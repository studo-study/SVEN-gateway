use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};

#[derive(Debug)]
pub enum AppError {
    NotFound,
    BadRequest,
    Unauthorized,
    Forbidden,
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
