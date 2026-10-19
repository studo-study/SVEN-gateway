//! Provider-neutral inference: one request/response shape, one adapter per wire format.
use std::time::Duration;

use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

use crate::models::{Model, Platform};

pub const UPSTREAM_TIMEOUT: Duration = Duration::from_secs(120);
const ANTHROPIC_DEFAULT_MAX_TOKENS: u32 = 4096;

#[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Role {
    System,
    User,
    Assistant,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Message {
    pub role: Role,
    pub content: String,
}

/// Provider-independent request. Only whitelisted params are forwarded.
#[derive(Debug, Deserialize)]
pub struct RunRequest {
    pub messages: Vec<Message>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
    pub top_p: Option<f32>,
}

#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Candidate {
    pub content: String,
    pub finish_reason: Option<String>,
}

#[derive(Debug, Default, Serialize, PartialEq)]
pub struct Usage {
    pub input: u64,
    pub output: u64,
    pub cached: u64,
}

#[derive(Debug, Serialize, PartialEq)]
pub struct RunResponse {
    pub candidates: Vec<Candidate>,
    pub usage: Usage,
    pub model: String,
}

#[derive(Debug)]
pub enum RunError {
    Timeout,
    RateLimited,
    Unsupported,
    /// Provider answered with an error status or an unparsable body.
    Upstream(String),
}

pub async fn run(
    http: &reqwest::Client,
    model: &Model,
    req: &RunRequest,
) -> Result<RunResponse, RunError> {
    let name = model.model_name.clone().unwrap_or_default();
    let key = model.env_key.as_ref().and_then(|v| std::env::var(v).ok());
    let url = model.endpoint_url.clone();
    let (builder, parse): (_, fn(&Value, &str) -> Result<RunResponse, RunError>) =
        match model.platform.ok_or(RunError::Unsupported)? {
            Platform::AnthropicApi => {
                let url = url.unwrap_or_else(|| "https://api.anthropic.com/v1/messages".into());
                let mut b = http
                    .post(url)
                    .header("anthropic-version", "2023-06-01")
                    .json(&anthropic_body(&name, req));
                if let Some(key) = key {
                    b = b.header("x-api-key", key);
                }
                (b, parse_anthropic)
            }
            Platform::GoogleGeminiApi => {
                let url = url.unwrap_or_else(|| {
                format!(
                    "https://generativelanguage.googleapis.com/v1beta/models/{name}:generateContent"
                )
            });
                let mut b = http.post(url).json(&gemini_body(req));
                if let Some(key) = key {
                    b = b.header("x-goog-api-key", key);
                }
                (b, parse_gemini)
            }
            Platform::OpenaiApi
            | Platform::XaiApi
            | Platform::MistralApi
            | Platform::DeepseekApi
            | Platform::AlibabaModelStudio
            | Platform::MoonshotApi
            | Platform::Openrouter
            | Platform::TogetherAi
            | Platform::Groq
            | Platform::FireworksAi
            | Platform::Cerebras => {
                let url = url.ok_or(RunError::Unsupported)?;
                let mut b = http.post(url).json(&openai_body(&name, req));
                if let Some(key) = key {
                    b = b.bearer_auth(key);
                }
                (b, parse_openai)
            }
            _ => return Err(RunError::Unsupported),
        };

    let response = builder.send().await.map_err(|err| {
        if err.is_timeout() {
            RunError::Timeout
        } else {
            RunError::Upstream(err.to_string())
        }
    })?;
    let status = response.status();
    if status.as_u16() == 429 {
        return Err(RunError::RateLimited);
    }
    if !status.is_success() {
        let detail = response.text().await.unwrap_or_default();
        return Err(RunError::Upstream(format!("status {status}: {detail}")));
    }
    let body: Value = response
        .json()
        .await
        .map_err(|err| RunError::Upstream(err.to_string()))?;
    parse(&body, &name)
}

fn role_str(role: Role) -> &'static str {
    match role {
        Role::System => "system",
        Role::User => "user",
        Role::Assistant => "assistant",
    }
}

fn openai_body(model: &str, req: &RunRequest) -> Value {
    let messages: Vec<Value> = req
        .messages
        .iter()
        .map(|m| json!({"role": role_str(m.role), "content": m.content}))
        .collect();
    let mut body = json!({"model": model, "messages": messages});
    set_opt(&mut body, "temperature", req.temperature);
    set_opt(&mut body, "max_tokens", req.max_tokens);
    set_opt(&mut body, "top_p", req.top_p);
    body
}

/// System messages are lifted into the top-level `system` field.
fn anthropic_body(model: &str, req: &RunRequest) -> Value {
    let system: Vec<&str> = req
        .messages
        .iter()
        .filter(|m| m.role == Role::System)
        .map(|m| m.content.as_str())
        .collect();
    let messages: Vec<Value> = req
        .messages
        .iter()
        .filter(|m| m.role != Role::System)
        .map(|m| json!({"role": role_str(m.role), "content": m.content}))
        .collect();
    let mut body = json!({
        "model": model,
        "max_tokens": req.max_tokens.unwrap_or(ANTHROPIC_DEFAULT_MAX_TOKENS),
        "messages": messages,
    });
    if !system.is_empty() {
        body["system"] = json!(system.join("\n\n"));
    }
    set_opt(&mut body, "temperature", req.temperature);
    set_opt(&mut body, "top_p", req.top_p);
    body
}

fn gemini_body(req: &RunRequest) -> Value {
    let system: Vec<&str> = req
        .messages
        .iter()
        .filter(|m| m.role == Role::System)
        .map(|m| m.content.as_str())
        .collect();
    let contents: Vec<Value> = req
        .messages
        .iter()
        .filter(|m| m.role != Role::System)
        .map(|m| {
            let role = if m.role == Role::Assistant {
                "model"
            } else {
                "user"
            };
            json!({"role": role, "parts": [{"text": m.content}]})
        })
        .collect();
    let mut config = json!({});
    set_opt(&mut config, "temperature", req.temperature);
    set_opt(&mut config, "maxOutputTokens", req.max_tokens);
    set_opt(&mut config, "topP", req.top_p);
    let mut body = json!({"contents": contents, "generationConfig": config});
    if !system.is_empty() {
        body["systemInstruction"] = json!({"parts": [{"text": system.join("\n\n")}]});
    }
    body
}

fn set_opt<T: Serialize>(body: &mut Value, key: &str, value: Option<T>) {
    if let Some(v) = value {
        body[key] = json!(v);
    }
}

fn malformed(what: &str) -> RunError {
    RunError::Upstream(format!("unexpected {what} response shape"))
}

fn tokens(v: &Value, path: &[&str]) -> u64 {
    path.iter()
        .try_fold(v, |v, k| v.get(k))
        .and_then(Value::as_u64)
        .unwrap_or(0)
}

fn parse_openai(body: &Value, model: &str) -> Result<RunResponse, RunError> {
    let candidates = body["choices"]
        .as_array()
        .filter(|c| !c.is_empty())
        .ok_or_else(|| malformed("openai"))?
        .iter()
        .map(|c| Candidate {
            content: c["message"]["content"]
                .as_str()
                .unwrap_or_default()
                .to_string(),
            finish_reason: c["finish_reason"].as_str().map(str::to_string),
        })
        .collect();
    Ok(RunResponse {
        candidates,
        usage: Usage {
            input: tokens(body, &["usage", "prompt_tokens"]),
            output: tokens(body, &["usage", "completion_tokens"]),
            cached: tokens(body, &["usage", "prompt_tokens_details", "cached_tokens"]),
        },
        model: model.to_string(),
    })
}

fn parse_anthropic(body: &Value, model: &str) -> Result<RunResponse, RunError> {
    let content: String = body["content"]
        .as_array()
        .ok_or_else(|| malformed("anthropic"))?
        .iter()
        .filter(|b| b["type"] == "text")
        .filter_map(|b| b["text"].as_str())
        .collect();
    Ok(RunResponse {
        candidates: vec![Candidate {
            content,
            finish_reason: body["stop_reason"].as_str().map(str::to_string),
        }],
        usage: Usage {
            input: tokens(body, &["usage", "input_tokens"]),
            output: tokens(body, &["usage", "output_tokens"]),
            cached: tokens(body, &["usage", "cache_read_input_tokens"]),
        },
        model: model.to_string(),
    })
}

fn parse_gemini(body: &Value, model: &str) -> Result<RunResponse, RunError> {
    let candidates = body["candidates"]
        .as_array()
        .filter(|c| !c.is_empty())
        .ok_or_else(|| malformed("gemini"))?
        .iter()
        .map(|c| Candidate {
            content: c["content"]["parts"]
                .as_array()
                .map(|parts| parts.iter().filter_map(|p| p["text"].as_str()).collect())
                .unwrap_or_default(),
            finish_reason: c["finishReason"].as_str().map(str::to_string),
        })
        .collect();
    Ok(RunResponse {
        candidates,
        usage: Usage {
            input: tokens(body, &["usageMetadata", "promptTokenCount"]),
            output: tokens(body, &["usageMetadata", "candidatesTokenCount"]),
            cached: tokens(body, &["usageMetadata", "cachedContentTokenCount"]),
        },
        model: model.to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn expected(content: &str, finish: &str, usage: (u64, u64, u64)) -> RunResponse {
        RunResponse {
            candidates: vec![Candidate {
                content: content.into(),
                finish_reason: Some(finish.into()),
            }],
            usage: Usage {
                input: usage.0,
                output: usage.1,
                cached: usage.2,
            },
            model: "m".into(),
        }
    }

    #[test]
    fn providers_normalize_to_same_shape() {
        let openai = json!({"choices": [{"message": {"content": "hi"}, "finish_reason": "stop"}],
            "usage": {"prompt_tokens": 3, "completion_tokens": 2, "prompt_tokens_details": {"cached_tokens": 1}}});
        assert_eq!(
            parse_openai(&openai, "m").unwrap(),
            expected("hi", "stop", (3, 2, 1))
        );

        let anthropic = json!({"content": [{"type": "text", "text": "h"}, {"type": "text", "text": "i"}],
            "stop_reason": "end_turn", "usage": {"input_tokens": 3, "output_tokens": 2, "cache_read_input_tokens": 1}});
        assert_eq!(
            parse_anthropic(&anthropic, "m").unwrap(),
            expected("hi", "end_turn", (3, 2, 1))
        );

        let gemini = json!({"candidates": [{"content": {"parts": [{"text": "hi"}]}, "finishReason": "STOP"}],
            "usageMetadata": {"promptTokenCount": 3, "candidatesTokenCount": 2, "cachedContentTokenCount": 1}});
        assert_eq!(
            parse_gemini(&gemini, "m").unwrap(),
            expected("hi", "STOP", (3, 2, 1))
        );
    }

    #[test]
    fn system_messages_move_out_of_the_message_list() {
        let req = RunRequest {
            messages: vec![
                Message {
                    role: Role::System,
                    content: "be brief".into(),
                },
                Message {
                    role: Role::User,
                    content: "hi".into(),
                },
            ],
            temperature: None,
            max_tokens: None,
            top_p: None,
        };
        let a = anthropic_body("m", &req);
        assert_eq!(a["system"], "be brief");
        assert_eq!(a["messages"].as_array().unwrap().len(), 1);
        let g = gemini_body(&req);
        assert_eq!(g["systemInstruction"]["parts"][0]["text"], "be brief");
        assert_eq!(g["contents"].as_array().unwrap().len(), 1);
    }
}
