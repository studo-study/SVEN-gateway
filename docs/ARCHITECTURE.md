# Architectuur

SVEN-gateway is een API-gateway voor onze eigen REST-backends. Clients praten met de gateway met een API key. De gateway authenticeert, autoriseert, limiteert, logt en stuurt het verkeer door naar de juiste backend.

## Overzicht

```
                                   ┌─────────────────────────────┐
Client ──[sven_<env>_xxx]─────────▶│          Gateway            │
                                   │  (gateway-api, Rust/axum)   │
                                   │                             │
                                   │ 1. key hash opzoeken        │
                                   │ 2. scopes en limieten       │
                                   │ 3. omgeving bepalen         │
                                   │ 4. proxy + identiteit       │──▶ dev-backend      (env=dev)
                                   │ 5. usage loggen             │──▶ staging-backend  (env=staging)
                                   └──────────────┬──────────────┘──▶ prod-backend     (env=prod)
                                                  │
Gebruiker ──[JWT]──▶ Frontend (app/, React) ──────┘ /v1/auth, /v1/api-keys, /v1/models, ...
                                                  │
                                              PostgreSQL
```

Er draait één gateway (live). Dev en staging gebruiken dezelfde gateway als productie. De API key bepaalt naar welke backend het verkeer gaat.

## Onderdelen

| Map | Rol |
|---|---|
| `gateway-api/` | Rust/axum-service: auth, key-beheer, proxy, usage. Diesel voor Postgres. |
| `app/` | React-frontend (react-router) voor beheer: login, API keys, models, usage, activity. |
| `models/` | Gedeelde TypeScript-types voor API-responses. |
| `infra/` | Deploy-configuratie voor `api` en `frontend`. |

## Twee authenticatiepaden

De gateway kent twee aparte manieren om in te loggen. Houd ze gescheiden.

| | Beheer (UI) | Verkeer (proxy) |
|---|---|---|
| Wie | Mensen | Machines/clients |
| Credential | JWT na login (`/v1/auth`) | API key (`Authorization: Bearer sven_...`) |
| Routes | `/v1/auth`, `/v1/api-keys`, `/v1/models`, ... | Proxy-routes naar de backends |
| Doel | Keys en instellingen beheren | Backend-endpoints aanroepen |

## API keys

### Formaat

`sven_<env>_<random>` met `<env>` is `dev`, `stg` of `live`.

- De random-deel is minstens 32 bytes uit een CSPRNG, base62- of hex-gecodeerd.
- De prefix laat in logs en bij gelekte keys meteen zien om welke omgeving het gaat.

### Opslag

Tabel `api_keys`:

| Kolom | Betekenis |
|---|---|
| `id` | UUID |
| `user_id` | Eigenaar |
| `description` | Vrije omschrijving |
| `environment` | Enum: `dev`, `staging`, `prod` |
| `prefix` | Eerste paar tekens, om in de UI te tonen |
| `key_hash` | SHA-256 van de volledige key (unique) |
| `scopes` | Toegestane routes/methodes |
| `rate_limit` | Requests per minuut |
| `expires_at` | Optioneel |
| `revoked_at` | Gezet bij intrekken |
| `last_used_at` | Voor de UI en opruimen |
| `created_at` | |

- De volledige key wordt één keer getoond bij aanmaken en daarna nooit meer opgeslagen.
- SHA-256 volstaat, want de key heeft genoeg entropie. Argon2 is hier niet nodig.
- Vergelijk hashes met een constant-time vergelijking.

### Levenscyclus

1. Aanmaken via de UI (`POST /v1/api-keys`, JWT). Response bevat de key één keer.
2. Gebruik door de client op de proxy-routes.
3. Intrekken (`DELETE /v1/api-keys/{id}`) zet `revoked_at`. Daarna wordt de key direct geweigerd.

## Requestflow (proxy)

1. **Extractor `ApiKeyAuth`** leest de `Authorization`-header, hasht de key en zoekt hem op. Geweigerd bij onbekend, ingetrokken of verlopen: `401`.
2. **Autorisatie:** past de methode en het pad bij de `scopes` van de key? Zo niet: `403`.
3. **Rate limit** per key. Overschreden: `429`.
4. **Omgeving:** `key.environment` bepaalt de upstream `base_url`.
5. **Doorsturen** met `reqwest`: methode, pad, query, body en headers gaan mee. De response wordt gestreamd terug.
6. **Usage loggen** in `usage_events`.

### Identiteit richting de backend

De gateway verwijdert de `Authorization`-header van de client en alle inkomende `X-User-Id`/`X-Key-Id` headers. Daarna zet hij zelf:

- `X-User-Id`
- `X-Key-Id`
- `X-Environment`
- een door de gateway ondertekende korte JWT of shared secret, zodat de backend kan controleren dat het verzoek echt van de gateway komt.

## Omgevingen

| Key-prefix | `environment` | Upstream |
|---|---|---|
| `sven_dev_` | `dev` | `UPSTREAM_DEV` |
| `sven_stg_` | `staging` | `UPSTREAM_STAGING` |
| `sven_live_` | `prod` | `UPSTREAM_PROD` |

Regels:
- Een `dev`- of `staging`-key bereikt nooit de prod-backend. Dat wordt afgedwongen in de gateway, niet in de client.
- Dev-keys krijgen strengere rate limits.
- Usage wordt per omgeving gelogd en getoond, zodat dev-verkeer de prod-cijfers niet vervuilt.

## Usage-logging

Tabel `usage_events`: `id, key_id, environment, method, path, status, latency_ms, created_at`. Dit voedt de Usage- en Activity-pagina's. Log geen request- of response-bodies.

## Beveiliging

- Backends zijn alleen bereikbaar vanaf de gateway (privé netwerk of firewall). Ze vertrouwen de identiteitsheaders alleen als de handtekening of het shared secret klopt.
- Provider- en backend-secrets staan in env of een secret manager, nooit in de database in platte tekst of in de frontend.
- Keys en secrets komen niet in logs.
- CORS staat alleen de frontend-origin toe (`FRONTEND_URL`).
- Eén gateway is één single point of failure. Test gateway-wijzigingen eerst op een aparte instantie voordat ze live gaan.

## Configuratie

Bestaande variabelen: `DATABASE_URL`, `DEV_PORT`, `AUTH_JWT_SECRET`, `FRONTEND_URL`.

Nieuw: `UPSTREAM_DEV`, `UPSTREAM_STAGING`, `UPSTREAM_PROD`, en een secret om de identiteit naar de backends te ondertekenen.

## Bouwvolgorde

1. Migratie `api_keys` en endpoints voor aanmaken, lijst en intrekken. Koppelen aan de `ApiKeys`-pagina, met een `InputSelect` voor de omgeving.
2. Extractor `ApiKeyAuth`.
3. Eén proxy-route naar één upstream, inclusief identiteitsheaders.
4. Omgeving-routing op basis van de key.
5. Rate limiting en scopes.
6. `usage_events` en koppeling met de Usage- en Activity-pagina's.

## Open punten

- Zijn de backends één service of meerdere? Meerdere betekent een routingtabel `route_prefix → upstream` per omgeving.
- Hoe worden dev- en staging-backends gehost, en zijn ze bereikbaar vanaf de live gateway?
- Formaat van `scopes` (pad-patronen, rollen of beide).
