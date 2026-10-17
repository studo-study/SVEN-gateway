# Architectuur

SVEN-gateway is een AI-gateway. Onze eigen backends roepen de gateway aan met een API key en een **operation** (bv. `summarize-document`). De gateway zoekt bij die operation het juiste model en de juiste prompt, roept de AI-provider aan en geeft het resultaat terug. De backend kent geen provider-keys, geen modelnamen en geen prompts.

## Overzicht

```
Gebruiker ──[JWT]──▶ Frontend (app/) ──▶ Gateway beheer-API (/v1/auth, /v1/models, /v1/api-keys, ...)

                                     ┌──────────────────────────────────────┐
Backend (dev/staging/prod)           │      Gateway (gateway-api, axum)     │
   │                                 │                                      │
   │ POST /v1/run/{operation-slug}   │ 1. API key valideren                 │
   └──[sven_<env>_xxx]──────────────▶│ 2. operation opzoeken (slug)         │
                                     │ 3. model + prompt + params laden     │──▶ Anthropic
                                     │ 4. prompt vullen met input           │──▶ OpenAI
                                     │ 5. provider aanroepen (provider key) │──▶ Bedrock / Vertex / ...
   ◀──────────────[resultaat]────────│ 6. tokens, kost, latency loggen      │
                                     └──────────────────┬───────────────────┘
                                                        │
                                                   PostgreSQL (schema `gateway`)
```

Er is één gateway (live). Dev en staging gebruiken dezelfde gateway als productie. Ze krijgen elk eigen keys, zodat verkeer en kosten per omgeving gescheiden blijven.

## Onderdelen

| Map | Rol |
|---|---|
| `gateway-api/` | Rust/axum-service met Diesel/Postgres: beheer-API en AI-proxy. |
| `app/` | React-frontend: login, API keys, model garden, operations, usage, activity. |
| `models/` | Gedeelde TypeScript-types voor API-responses. |
| `infra/` | Deploy-configuratie voor `api` en `frontend`. |

## Datamodel (bestaand, schema `gateway`)

| Tabel | Inhoud |
|---|---|
| `models` | Beschikbare modellen: `model_name`, `model_type` (embedding/generation/chat), `provider`, `platform` (bv. `amazon_bedrock`, `openai_api`), `env_key` (naam van de env-variabele met de provider-key), `endpoint_url`, kosten per miljoen tokens, `context_window`, `max_output`, `vision`, `active`. |
| `operations` | Wat een backend aanroept: `slug`, `operation_type`, `model_type`, `title`, `model_id` (gekozen model), `prompt` (template), `is_active`. |
| `operation_logs` | Per aanroep: `user_id`, `operation_id`, `model_id`, `log_type`, `tokens`, `latency_ms`, `error_msg`. |
| `conversations` / `messages` | Gespreksgeschiedenis met rol, inhoud, model en tokengebruik. |

Nieuw nodig: `api_keys` (zie onder). Mogelijk extra kolommen op `operation_logs` (`api_key_id`, `environment`, input- en outputtokens apart, kost).

### Waarom operations

Het model en de prompt staan in de gateway, niet in de backend. Daardoor kun je in de UI:
- een operation naar een ander model laten wijzen zonder backend-deploy;
- de prompt aanpassen of uitrollen zonder code te wijzigen;
- een operation uitzetten (`is_active = false`);
- kosten en gebruik per operation zien.

## API keys

Een API key identificeert een **backend/omgeving**, niet een eindgebruiker.

### Formaat
`sven_<env>_<random>` met `<env>` is `dev`, `stg` of `live`. De random-deel is minstens 32 bytes uit een CSPRNG. De prefix laat in logs zien om welke omgeving het gaat.

### Tabel `api_keys`

| Kolom | Betekenis |
|---|---|
| `id` | UUID |
| `user_id` | Eigenaar/aanmaker |
| `description` | Vrije omschrijving |
| `environment` | `dev`, `staging` of `prod` |
| `prefix` | Eerste tekens, om in de UI te tonen |
| `key_hash` | SHA-256 van de volledige key (unique) |
| `allowed_operations` | Optioneel: beperkt de key tot bepaalde operations |
| `rate_limit` | Requests per minuut |
| `monthly_budget` | Optioneel: maximale kost per maand |
| `expires_at`, `revoked_at`, `last_used_at`, `created_at` | |

- De volledige key wordt één keer getoond bij aanmaken en nooit opgeslagen.
- SHA-256 volstaat, want de key heeft genoeg entropie. Vergelijk hashes constant-time.
- Intrekken zet `revoked_at`. De key wordt daarna direct geweigerd.

## Twee authenticatiepaden

| | Beheer (UI) | Verkeer (backends) |
|---|---|---|
| Wie | Mensen | Onze backends |
| Credential | JWT na login (`/v1/auth`) | API key (`Authorization: Bearer sven_...`) |
| Routes | `/v1/auth`, `/v1/models`, `/v1/api-keys`, operations-beheer | `/v1/run/{slug}` (naam is een voorstel) |

## Requestflow

```
POST /v1/run/summarize-document
Authorization: Bearer sven_live_xxx
{ "input": { "text": "..." }, "stream": false }
```

1. **Key valideren:** hash, opzoeken, `revoked_at`/`expires_at` controleren. Fout: `401`.
2. **Toegang:** mag deze key deze operation gebruiken? Zo niet: `403`.
3. **Rate limit en budget** per key. Fout: `429`.
4. **Operation laden** op `slug` met `is_active = true`. Onbekend: `404`.
5. **Model laden** via `operation.model_id`, met `active = true`. De provider-key komt uit de env-variabele die in `models.env_key` staat.
6. **Prompt opbouwen:** `operation.prompt` plus de input uit de request.
7. **Provider aanroepen** via een adapter per `platform`. Veel platformen zijn OpenAI-compatibel en hebben nauwelijks een eigen adapter nodig. Streaming wordt doorgegeven als SSE.
8. **Loggen** in `operation_logs`: tokens, latency, fout, key, omgeving, kost.
9. **Resultaat terug** naar de backend.

### Adapters

```rust
trait ProviderAdapter {
    async fn call(&self, model: &Model, request: ProviderRequest) -> Result<ProviderResponse, AppError>;
}
```

Eén implementatie per `platform`. Begin met één provider en breid uit.

### Fouten en betrouwbaarheid
- Time-outs per provider-aanroep.
- Retry met backoff alleen bij `429` en `5xx` van de provider, nooit bij `4xx`.
- Optioneel later: fallback-model per operation als de provider uitvalt.
- Provider-fouten worden omgezet naar een eigen, stabiele foutvorm; de backend ziet geen provider-specifieke fouten.

## Client-flows

De gateway wordt alleen door onze eigen backend-code aangeroepen, nooit door de browser.

### Embeddings (worker)

```
Client ─▶ Backend ─▶ job queue ─▶ Worker ──[sven_live_key]──▶ Gateway ─▶ provider
```

De worker is een gewone backend-client. Geef hem een eigen key (bv. `description: "embedding-worker"`), dan zijn zijn kosten en gebruik apart zichtbaar. Een request is een gewone HTTP-aanroep zonder streaming.

### Chat (websocket)

```
Browser ◀──WebSocket──▶ Backend ──HTTP + SSE──▶ Gateway ─▶ provider
```

- De browser praat alleen met de backend. De backend authenticeert de gebruiker, controleert permissies en beheert de gespreksgeschiedenis.
- De backend roept de gateway aan met `"stream": true`. De gateway streamt de tokens als SSE terug.
- De backend leest de SSE-chunks en schrijft elke chunk meteen naar de websocket. Er wordt niets gebufferd.
- Sluit de client de websocket, dan annuleert de backend de request naar de gateway. De gateway breekt dan de provider-aanroep af, zodat er geen tokens meer worden betaald voor een antwoord dat niemand leest.
- De backend stuurt de berichtgeschiedenis mee in elke request. De gateway blijft stateless en logt alleen metadata (zie Open punten).

### Waarom niet rechtstreeks vanuit de browser

- De API key identificeert een backend en zou in de browser lekken.
- De gateway kent geen gebruikers of sessies. Dat blijft bij de backend.
- De extra hop is intern en kost milliseconden, tegenover seconden voor een LLM-antwoord.

Als dit later toch nodig blijkt, kan de gateway kortlevende, gescopete tokens per gebruiker uitgeven. Dat is een extra laag en nu bewust niet gebouwd.

## Omgevingen

| Key-prefix | `environment` | Gebruik |
|---|---|---|
| `sven_dev_` | `dev` | Lokale ontwikkeling |
| `sven_stg_` | `staging` | Staging-backend |
| `sven_live_` | `prod` | Productie-backend |

Alle omgevingen gebruiken dezelfde operations en modellen. Het verschil zit in de key:
- usage en kosten worden per omgeving gelogd en getoond;
- dev-keys krijgen strengere rate limits en een laag budget;
- een key kan beperkt worden tot bepaalde operations.

Wil je later een operation eerst in staging uitproberen, voeg dan versies of een `environment`-veld op operations toe. Dat is nu niet nodig.

## Beveiliging

- Provider-keys staan alleen in env of een secret manager van de gateway. `models.env_key` bevat alleen de naam, nooit de waarde.
- Backends krijgen nooit een provider-key te zien.
- API keys en prompts komen niet in logs. Log standaard geen request- of response-inhoud, alleen metadata.
- De beheer-API is JWT-beschermd en rolgebonden. Het verkeer-eindpunt accepteert alleen API keys.
- CORS staat alleen de frontend-origin toe (`FRONTEND_URL`).
- De gateway is één single point of failure voor alle omgevingen. Test gateway-wijzigingen eerst op een aparte instantie.

## Configuratie

Bestaand: `DATABASE_URL`, `DEV_PORT`, `AUTH_JWT_SECRET`, `FRONTEND_URL`.
Per model één env-variabele met de provider-key, de naam staat in `models.env_key`.

## Bouwvolgorde

1. Migratie `api_keys` plus aanmaken, lijst en intrekken (JWT). Koppelen aan de `ApiKeys`-pagina, met een `InputSelect` voor de omgeving.
2. Extractor `ApiKeyAuth` voor `/v1/run/{slug}`.
3. `/v1/run/{slug}` met één provider-adapter, zonder streaming.
4. Logging naar `operation_logs`, uitgebreid met key, omgeving en kost.
5. Streaming (SSE) en annulering, nodig voor chat. Daarna extra adapters, rate limiting en budget.
6. Usage- en Activity-pagina's op basis van de logs.

## Open punten

- Chat: de backend stuurt de berichten mee en de gateway logt alleen metadata. Of de gateway `conversations`/`messages` toch zelf bewaart, is nog niet beslist.
- Hoe ziet de input eruit: vrije tekst, of een template met variabelen in `operation.prompt` (bv. `{{text}}`)? Chat-operations hebben ook berichtgeschiedenis nodig (`conversations`/`messages`).
- Wordt het eindpunt OpenAI-compatibel, zodat bestaande SDK's werken, of een eigen vorm per operation?
- Moeten backends zelf een model kunnen kiezen, of altijd via de operation?
- Fallback-model per operation: nu of later?
- Welke platformen komen als eerste (Bedrock, OpenAI, Anthropic)?
