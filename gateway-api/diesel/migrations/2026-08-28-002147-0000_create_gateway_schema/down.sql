-- This file should undo anything in `up.sql`
DROP TABLE IF EXISTS gateway.messages;
DROP TABLE IF EXISTS gateway.operation_logs;
DROP TABLE IF EXISTS gateway.conversations;
DROP TABLE IF EXISTS gateway.operations;
DROP TABLE IF EXISTS gateway.models;

DROP TYPE IF EXISTS gateway.operation_type;
DROP TYPE IF EXISTS gateway.provider;
DROP TYPE IF EXISTS gateway.message_role;
DROP TYPE IF EXISTS gateway.model_type;
DROP TYPE IF EXISTS gateway.user_plan;
DROP TYPE IF EXISTS gateway.log_type;

DROP SCHEMA IF EXISTS gateway;
