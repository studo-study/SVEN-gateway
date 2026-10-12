// Hand-written: `diesel.toml` only prints the `gateway` schema, so tables owned
// by the main app in `public` are declared here (only the columns we use).
diesel::table! {
    users (id) {
        id -> Uuid,
        email -> Varchar,
        password_hash -> Varchar,
        roles -> Jsonb,
    }
}
