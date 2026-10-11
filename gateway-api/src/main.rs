mod error;
mod config;
mod schema;

use std::env;
use axum::{routing::get, Router};

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    let app = Router::new().route("/", get(root_handler));

    let port = env::var("DEV_PORT").unwrap_or_else(|_| "3000".into());
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{port}")).await.unwrap();
    println!("Server running on http://localhost:{port}");

    axum::serve(listener, app).await.unwrap();
}

async fn root_handler() -> &'static str {
    "Hello from Axum!"
}
