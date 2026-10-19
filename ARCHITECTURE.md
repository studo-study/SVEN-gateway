# Architectuur

SVEN-gateway is een AI-gateway. Onze eigen backends roepen de gateway aan met een API key en een **operation-slug** (bv. `summarize-document`). De gateway zoekt bij die operation de modellen en de system prompt, roept de AI-provider aan en geeft een genormaliseerd resultaat terug. De backend kent geen provider-keys, geen modelnamen en geen prompts, en weet niet welke provider antwoordt.

Status per onderdeel staat in [Status](#status): wat er staat, wat gepland is.

## Overzicht

```
Gebruiker ──[JWT]──▶ Frontend (app/) ──▶ Beheer-API (/v1/auth, /v1/models, /v1/operations, /v1/api-keys)

Backend (dev/staging/prod)        ┌───────────────────────── gateway-api (axum) ──────────────────────┐
   │                              │                                                                    │
   │ POST /v1/run/{slug}  (sync)  │  auth ─▶ operation ─▶ deployment ─▶ cache ─▶ strategie ─▶ adapter ─┼─▶ Anthropic
   │ POST /v1/job/enqueue (async) │             │                          │         (fallback)        │─▶ OpenAI-compatibel
   └──[Bearer sven_<env>_xxx]────▶│             │                          ▼                           │─▶ Gemini / Vertex
   ◀────────[RunResponse]─────────│             ▼                       JobRunner ◀── jobs (Postgres)  │─▶ Bedrock / Azure
                                  │       PostgreSQL (schema `gateway`) ◀── logs (async)              │
                                  └────────────────────────────────────────────────────────────────────┘
```

Er is één gateway. Dev, staging en productie gebruiken dezelfde operations en modellen en onderscheiden zich door hun API key (eigen limieten, budget en kostenoverzicht).

## Onderdelen

| Map | Rol |
|---|---|
| `gateway-api/` | Rust/axum-service met Diesel/Postgres: beheer-API en inference-API. |
| `app/` | React-frontend (react-router): login, API keys, model garden, operations, usage, activity. |
| `models/` | Gedeelde TypeScript-types voor API-responses. |
| `atlas/` | Databaseschema (HCL) en migraties via Atlas. |
| `infra/` | Deploy-configuratie voor `api` en `frontend`. |

## Begrippen

| Begrip | Betekenis |
|---|---|
| **Model** | Een concreet model op een platform (`platform`, `model_name`, `endpoint_url`, kosten). Bepaalt welke adapter wordt gebruikt. |
| **Operation** | Wat een backend aanroept: een slug met type, system prompt en een deployment. |
| **Deployment** | De gerangschikte lijst modellen van een operation: een primair model plus fallbacks, met een strategie. |
| **Run** | Eén uitvoering van een operation, sync of als job. |
| **RunResponse** | Het genormaliseerde antwoord, onafhankelijk van de provider. |

### Waarom operations

Model en prompt staan in de gateway, niet in de backend. In de UI kun je daardoor:
- een operation naar een ander model laten wijzen zonder backend-deploy;
- de prompt aanpassen zonder code te wijzigen;
- een operation uitzetten (`is_active = false`);
- kosten en gebruik per operation zien.

## Datamodel (schema `gateway`)

| Tabel | Inhoud |
|---|---|
| `models` | `model_name`, `model_type` (embedding/generation/chat), `provider`, `platform`, `endpoint_url`, `env_key` (naam van de env-variabele met de provider-key), kosten per miljoen tokens (`input_cost_pm`, `output_cost_pm`, `cached_cost_pm`), `context_window`, `max_output`, `vision`, `active`. |
| `operations` | `slug` (unique), `operation_type`, `model_type`, `title`, `system_prompt`, `is_active`, `model_id` (primair model, wordt vervangen door `operation_models`). |
| `api_keys` | Zie [API keys](#api-keys). |
| `operation_logs` | Per run: operation, model, key, omgeving, tokens in/uit, kost, latency, fout, cache-hit, fallback-stappen. |
| `conversations` / `messages` | Gespreksgeschiedenis. Niet nodig voor het inference-pad; zie [Open punten](#open-punten). |

Gepland:

| Tabel | Inhoud |
|---|---|
| `operation_models` | `operation_id`, `model_id`, `position`, `timeout_ms`. De deployment van een operation. |
| `jobs` | `id`, `operation_id`, `api_key_id`, `status`, `request`, `response`, `error`, `attempts`, `run_after`, `locked_at`, `created_at`, `finished_at`. |
| `result_cache` | `key`, `response`, `created_at`, `expires_at`. |

Bij `operations` komt een `strategy` (`fallback`, later `distributed`), een `cache_enabled` en een `cache_ttl`. Een versienummer van de operation zit in de cache-sleutel, zodat een bewerkte prompt geen oude antwoorden serveert.

## API keys

Een API key identificeert een **backend/omgeving**, niet een eindgebruiker.

- Formaat: `sven_<env>_<random>` met `<env>` is `dev`, `stg` of `live`. Het random-deel is 40 alfanumerieke tekens uit een CSPRNG. De prefix laat in logs zien om welke omgeving het gaat.
- De volledige key wordt één keer getoond bij aanmaken en nooit opgeslagen. Alleen de SHA-256-hash staat in `key_hash`; dat volstaat omdat de key genoeg entropie heeft.
- Intrekken zet `revoked_at`; de key wordt direct geweigerd. `expires_at` wordt bij elke aanroep gecontroleerd.
- Aanwezig: `description`, `environment`, `prefix`, `key_hash`, `created_at`, `last_used_at`, `expires_at`, `revoked_at`.
- Gepland: `allowed_operations` (beperkt de key tot bepaalde operations), `rate_limit` (requests per minuut) en `monthly_budget`.
- `last_used_at` wordt gebufferd en hooguit eens per minuut per key geschreven.

## Twee authenticatiepaden

| | Beheer (UI) | Verkeer (backends) |
|---|---|---|
| Wie | Mensen | Onze backends |
| Credential | JWT-cookie na login | `Authorization: Bearer sven_...` |
| Routes | `/v1/auth`, `/v1/models`, `/v1/operations`, `/v1/api-keys` | `/v1/run/{slug}`, `/v1/job/*` |

De twee paden delen geen extractor en geen middleware. Het verkeerpad accepteert uitsluitend API keys.

## Inference-pijplijn

Eén functie, `run_operation`, wordt gebruikt door de sync-route en door de JobRunner.

1. **Key valideren:** hash opzoeken, `revoked_at` en `expires_at` controleren. Fout: `401`.
2. **Toegang:** mag de key deze operation gebruiken? Zo niet: `403`.
3. **Rate limit en budget** per key. Fout: `429`.
4. **Operation en deployment laden** op slug met `is_active = true`. Onbekend: `404`. Beide stappen lopen via een in-memory cache met korte TTL.
5. **Voorbereiden:** de `{{variabelen}}` uit het verzoek worden ingevuld in de system prompt en de messages. Een ontbrekende variabele geeft `400`.
6. **Cache:** bij een hit gaat het opgeslagen resultaat direct terug; geen provider, geen kosten.
7. **Strategie uitvoeren** over de modellen van de deployment.
8. **Adapter aanroepen** per model.
9. **Normaliseren** naar `RunResponse`.
10. **Loggen** asynchroon: tokens, kost, latency, cache-hit, fallback-stappen.

### Strategieën

- **Fallback** (default): modellen op volgorde. Doorschuiven bij `Timeout`, `RateLimited` en provider-`5xx`; nooit bij `BadRequest` of `Auth`.
- **Timeout-race** (optioneel): na `timeout_ms` start het volgende model parallel, het eerste antwoord wint en de ander wordt geannuleerd.
- **Distributed** (later): gewogen verdeling over modellen.
- Elk model heeft een circuit breaker: na N fouten wordt het tijdelijk overgeslagen.

### Adapters

```rust
trait ProviderRunner {
    async fn run(&self, model: &Model, req: &RunRequest) -> Result<RunResponse, RunError>;
}
```

Eén implementatie per formaat, gekozen op `model.platform`:

| Adapter | Platformen |
|---|---|
| OpenAI-compatibel | `openai_api`, `groq`, `together_ai`, `openrouter`, `mistral_api`, `deepseek_api`, `xai_api`, `fireworks_ai`, `cerebras`, `moonshot_api`, `alibaba_model_studio` |
| Anthropic | `anthropic_api` |
| Gemini | `google_gemini_api` |
| Later | `google_vertex_ai`, `azure_openai`, `amazon_bedrock` (eigen auth: service-account, SigV4) |

De provider-key komt uit de env-variabele waarvan de naam in `models.env_key` staat, opgehaald via één functie `provider_key(model)`. Dat maakt een latere overstap naar versleutelde opslag een lokale wijziging.

### Types

```rust
RunRequest  { messages, variables, tools, params }
RunResponse { candidates, usage { input, output, cached }, model, finish_reason, cached: bool }
RunError    { Timeout, RateLimited, Upstream(status), BadRequest, Auth }
```

Provider-specifieke fouten en antwoordvormen verlaten de adapter niet.

## Endpoints

| Route | Gedrag |
|---|---|
| `POST /v1/run/{slug}` | Synchroon. Optioneel `stream: true` voor SSE in een eigen, provider-onafhankelijk eventformaat. |
| `POST /v1/job/enqueue` | Asynchroon: `202 { job_id }`. Optioneel `Idempotency-Key` en `callback_url`. |
| `GET /v1/job/result/{id}` | Status of resultaat. Alleen voor de key die de job aanmaakte. |
| `GET /healthz`, `GET /readyz` | Proces-health en DB-bereikbaarheid. |
| `GET /metrics` | Prometheus: queuediepte, latency-histogram, fouten per provider. |

Voorbeeld:

```
POST /v1/run/summarize-document
Authorization: Bearer sven_live_xxx
{ "variables": { "text": "..." }, "messages": [...], "stream": false }
```

Het verzoek bevat nooit een provider of modelnaam.

## Async jobs

- Een job is een rij in `jobs` met status `queued`, `running`, `succeeded` of `failed`.
- De **JobRunner** bestaat uit tokio-taken die pollen met `SELECT … FOR UPDATE SKIP LOCKED`. Aantal workers en batchgrootte staan in env. Postgres volstaat als queue tot ver in de schaal; een aparte broker is nu niet nodig.
- Retries: `attempts` ophogen en `run_after` met exponentiële backoff zetten; na een maximum wordt de job `failed`.
- Crash-herstel: jobs die `running` zijn met een verlopen `locked_at` gaan terug naar `queued`.
- De sync-route en de runner roepen dezelfde `run_operation` aan.

## Schaalbaarheid

- De service is stateless; meerdere instances kunnen achter een load balancer. Gedeelde state zit in Postgres, later Redis (rate limits, cache).
- Responses worden gestreamd, niet gebufferd.
- Eén gedeelde `reqwest::Client` met connect- en totaaltimeouts en een bovengrens op de request-body.
- Lookups van key, operation en deployment lopen via een cache met korte TTL; schrijven naar `operation_logs` en `last_used_at` gebeurt buiten het request-pad.
- Diesel is blocking; DB-werk in async handlers gaat via `spawn_blocking` of `diesel-async`. De poolgrootte en timeouts zijn configureerbaar.
- Concurrency-limiet per provider, zodat een trage provider niet alle workers vasthoudt.
- Het beheerpad en het inferencepad zijn later te splitsen in twee processen op dezelfde database.

## Observability en kosten

- Elke run schrijft één logrij: operation, model, key, omgeving, tokens, kost, latency, cache-hit, fallback-stappen, fout.
- Kosten worden berekend uit `input_cost_pm`, `output_cost_pm` en `cached_cost_pm` en met de rij opgeslagen, zodat latere prijswijzigingen oude data niet vertekenen.
- De Usage- en Activity-pagina's lezen uit `operation_logs`.
- Er wordt standaard geen request- of response-inhoud gelogd, alleen metadata.
- `tracing`-spans dragen een request- en job-id.

## Client-flows

De gateway wordt alleen door onze eigen backend-code aangeroepen, nooit door de browser.

**Embeddings (worker):**

```
Client ─▶ Backend ─▶ job queue ─▶ Worker ──[sven_live_key]──▶ Gateway ─▶ provider
```

De worker is een gewone backend-client met een eigen key (`description: "embedding-worker"`), zodat zijn kosten apart zichtbaar zijn. Voor grote hoeveelheden gebruikt hij `/v1/job/enqueue`.

**Chat (websocket):**

```
Browser ◀──WebSocket──▶ Backend ──HTTP + SSE──▶ Gateway ─▶ provider
```

- De browser praat alleen met de backend; die authenticeert de gebruiker en beheert de gespreksgeschiedenis.
- De backend roept de gateway aan met `stream: true` en schrijft elke chunk meteen naar de websocket.
- Sluit de client de websocket, dan annuleert de backend de request. De gateway breekt dan de provider-aanroep af, zodat er geen tokens meer worden betaald.
- De backend stuurt de berichtgeschiedenis mee; de gateway blijft stateless.

Waarom niet rechtstreeks vanuit de browser: de API key identificeert een backend en zou lekken, de gateway kent geen gebruikers of sessies, en de extra interne hop kost milliseconden tegenover seconden voor een LLM-antwoord.

## Omgevingen

| Key-prefix | `environment` | Gebruik |
|---|---|---|
| `sven_dev_` | `dev` | Lokale ontwikkeling |
| `sven_stg_` | `staging` | Staging-backend |
| `sven_live_` | `prod` | Productie-backend |

De omgeving bepaalt rate limits, budget en kostenoverzicht, niet welke operation of welk model wordt gebruikt. Dev-keys krijgen strengere limieten en een laag budget.

## Beveiliging

- Provider-keys staan alleen in env of een secret manager van de gateway; `models.env_key` bevat de naam, nooit de waarde. Gepland: versleutelde opslag in de database (AES-GCM, master key uit env of KMS).
- Backends zien nooit een provider-key.
- API keys en prompts komen niet in logs.
- Het beheerpad is JWT-beschermd en rolgebonden; het verkeerpad accepteert alleen API keys.
- Invoer wordt begrensd: lengte van berichten, aantal berichten en een witlijst van toegestane parameters.
- CORS staat alleen de frontend-origin toe (`FRONTEND_URL`).
- De gateway is één single point of failure voor alle omgevingen; test wijzigingen eerst op een aparte instantie.
- Gepland: audit-log voor beheeracties.

## Configuratie

| Variabele | Doel |
|---|---|
| `DATABASE_URL` | Postgres |
| `DEV_PORT` | Poort |
| `AUTH_JWT_SECRET` | JWT-ondertekening |
| `FRONTEND_URL` | CORS-origin |
| `<models.env_key>` | Per model de provider-key |
| `DB_POOL_MAX`, `UPSTREAM_TIMEOUT_SECS`, `JOB_WORKERS`, `JOB_BATCH_SIZE` | Gepland: afstellen van pool, timeouts en runner |

## Status

| Onderdeel | Status |
|---|---|
| Beheer-API: auth, models, operations, API keys | Gebouwd |
| Beheer-UI: login, API keys, model garden, operations | Gebouwd |
| `POST /v1/run/{slug}`: key-auth, system prompt, doorsturen naar OpenAI-compatibel endpoint, streaming | Gebouwd (eerste versie, ongetest tegen een echt model) |
| Fase 0: timeouts, caches, gebufferde `last_used_at`, DB buiten het request-pad | Gepland |
| Fase 1: `RunRequest`/`RunResponse`, adapters (OpenAI-compatibel, Anthropic, Gemini) | Gepland |
| Fase 2: deployments met fallback | Gepland |
| Fase 3: variabelen en result-cache | Gepland |
| Fase 4: async jobs en JobRunner | Gepland |
| Fase 5: logging naar `operation_logs`, kosten, Usage/Activity op echte data | Gepland |
| Fase 6: rate limits, budget, scopes, circuit breaker | Gepland |
| Fase 7: versleutelde provider-secrets, audit-log, Redis, splitsing beheer/inference | Gepland |

## Open punten

- Eigen eindpuntvorm per operation (`variables`/`messages`), of OpenAI-compatibel zodat bestaande SDK's werken?
- Mogen backends zelf een model kiezen, of altijd via de operation? Voorstel: altijd via de operation.
- Bewaart de gateway `conversations`/`messages` toch zelf, of blijft dat bij de backend? Voorstel: bij de backend.
- Welke cloud-platformen (Bedrock, Vertex, Azure) komen als eerste na de drie basis-adapters?
- Moet een operation eerst in staging uitgeprobeerd kunnen worden? Dan zijn versies of een `environment`-veld op operations nodig.
