use std::env;

#[derive(Clone)]
pub struct Config {
    pub database_url: String,
    pub port: String,
    pub jwt_secret: String,
    pub frontend_origin: String,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            database_url: env::var("DATABASE_URL").expect("DATABASE_URL must be set"),
            port: env::var("DEV_PORT").unwrap_or_else(|_| "3000".into()),
            jwt_secret: env::var("AUTH_JWT_SECRET").expect("AUTH_JWT_SECRET must be set"),
            frontend_origin: env::var("FRONTEND_URL").unwrap_or_else(|_| {
                let web_port = env::var("WEB_PORT").unwrap_or_else(|_| "5173".into());
                format!("http://localhost:{web_port}")
            }),
        }
    }
}
