use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};

#[derive(Debug)]
pub enum AppError {
    NotFound,
    BadRequest,
    Unauthorized,
    Forbidden,
    BadGateway,
    GatewayTimeout,
    RateLimited,
    NotImplemented,
    Database(diesel::result::Error),
    Pool(diesel::r2d2::PoolError),
}

impl From<diesel::result::Error> for AppError {
    fn from(err: diesel::result::Error) -> Self {
        match err {
            diesel::result::Error::NotFound => AppError::NotFound,
            other => AppError::Database(other),
        }
    }
}

impl From<diesel::r2d2::PoolError> for AppError {
    fn from(err: diesel::r2d2::PoolError) -> Self {
        AppError::Pool(err)
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::NotFound => (StatusCode::NOT_FOUND, "resource not found".to_string()),
            AppError::BadRequest => (StatusCode::BAD_REQUEST, "invalid request".to_string()),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "invalid credentials".to_string()),
            AppError::Forbidden => (StatusCode::FORBIDDEN, "admin access required".to_string()),
            AppError::GatewayTimeout => {
                (StatusCode::GATEWAY_TIMEOUT, "model timed out".to_string())
            }
            AppError::RateLimited => (
                StatusCode::TOO_MANY_REQUESTS,
                "model rate limited".to_string(),
            ),
            AppError::NotImplemented => (
                StatusCode::NOT_IMPLEMENTED,
                "model platform not supported".to_string(),
            ),
            AppError::BadGateway => (
                StatusCode::BAD_GATEWAY,
                "model endpoint unreachable".to_string(),
            ),
            AppError::Database(err) => {
                eprintln!("database error: {err}");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "internal server error".to_string(),
                )
            }
            AppError::Pool(err) => {
                eprintln!("pool error: {err}");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "internal server error".to_string(),
                )
            }
        };
        (status, message).into_response()
    }
}

impl From<crate::inference::RunError> for AppError {
    fn from(err: crate::inference::RunError) -> Self {
        use crate::inference::RunError;
        match err {
            RunError::Timeout => AppError::GatewayTimeout,
            RunError::RateLimited => AppError::RateLimited,
            RunError::Unsupported => AppError::NotImplemented,
            RunError::Upstream(detail) => {
                tracing::error!("upstream error: {detail}");
                AppError::BadGateway
            }
        }
    }
}
