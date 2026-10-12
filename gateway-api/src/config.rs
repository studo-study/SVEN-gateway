use std::env;

#[derive(Clone)]
pub struct Config {
    pub database_url: String,
    pub port: String,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            database_url: env::var("DATABASE_URL").expect("DATABASE_URL must be set"),
            port: env::var("DEV_PORT").unwrap_or_else(|_| "3000".into()),
        }
    }
}
