# syntax=docker/dockerfile:1.7

ARG GO_VERSION=1.25
ARG AIR_VERSION=v1.65.3

# ========== Base ==========
FROM golang:${GO_VERSION}-alpine AS base
WORKDIR /app
RUN apk add --no-cache git ca-certificates tzdata

# ========== Deps (camada cacheada) ==========
FROM base AS deps
COPY go.mod go.sum* ./
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go mod download

# ========== Dev (hot reload com air) ==========
FROM deps AS dev
ARG AIR_VERSION
RUN go install github.com/air-verse/air@${AIR_VERSION}
COPY . .
EXPOSE 8080
# go mod tidy garante go.sum coerente quando dependências forem adicionadas via volume mount.
CMD ["sh", "-c", "go mod tidy && air -c .air.toml"]

# ========== Builder (binário de produção) ==========
FROM deps AS builder
COPY . .
ARG VERSION=dev
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux \
    go build -trimpath -ldflags="-s -w -X main.version=${VERSION}" \
        -o /out/fidelis-api ./cmd/api

# ========== Runtime (distroless, mínimo possível) ==========
FROM gcr.io/distroless/static-debian12:nonroot AS runtime
WORKDIR /app
COPY --from=builder /out/fidelis-api /app/fidelis-api
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/app/fidelis-api"]
