# syntax=docker/dockerfile:1

# --- Stage 1: build the web UI ---
FROM node:22-alpine AS web
WORKDIR /web
COPY web/package.json web/package-lock.json* ./
RUN npm install
COPY contract ../contract
COPY web ./
RUN npm run build

# --- Stage 2: build the Go engine (data is embedded via go:embed) ---
FROM golang:1.26-alpine AS engine
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags "-s -w" -o /out/httpd ./services/cmd/httpd

# --- Final: tiny image serving API + web from one binary ---
FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=engine /out/httpd /app/httpd
COPY --from=web /web/dist /app/web
ENV AITIO_WEB_DIR=/app/web
ENV AITIO_HTTP_ADDR=:8787
EXPOSE 8787
USER nonroot:nonroot
ENTRYPOINT ["/app/httpd"]
