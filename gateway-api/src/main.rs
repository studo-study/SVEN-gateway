mod error;
mod config;
mod schema;

use std::{env, io};
use axum::{routing::get, Router};

#[tokio::main]
async fn main() {
    dotenvy::dotenv()?;
    let app = Router::new().route("/", get(root_handler));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:" + io::read_to_string("DEV_PORT")).await.unwrap();
    println!("Server running on http://localhost:3000");

    axum::serve(listener, app).await.unwrap();
}

async fn root_handler() -> &'static str {
    "Hello from Axum!"
}
