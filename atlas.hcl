variable "url" {
  type    = string
  default = getenv("DATABASE_URL")
}

env "local" {
  src = "file://atlas/schema"
  url = var.url
  dev = "docker://postgres/16/dev"
  migration {
    dir = "file://atlas/migrations"
  }
}
