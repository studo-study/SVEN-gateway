init-frontend:
	@echo "installing dependencies for frontend"
	pnpm install

init-api:
	@echo "installing dependencies for api"
	cd gateway-api/ && cargo build

init-all: init-api init-frontend
	@echo "installing dependencies for everything"

start-frontend:
	@echo "installing dependencies for frontend"
	pnpm run dev

start-api:
	@echo "starting up the api..."
	cd gateway-api/ && cargo run

start-docker:
	@echo "starting up docker..."
	docker compose up

start-all: start-api start-frontend

stop-docker:
	docker compose down


#atlas workflow (see atlas/CLAUDE.md)
generate-schema:
	pnpm db:generate

migrate-schema:
	pnpm db:migrate

hash-schema:
	pnpm atlas:hash

generate-diesel-schema:
	pnpm db:diesel-schema
