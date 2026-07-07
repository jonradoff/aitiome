# Deploying Aitiome

The whole app ships as **one binary**: the Go engine serves the HTTP API and the
built web UI (and MCP is a separate `mcpd` binary). The `Dockerfile` builds it;
`fly.toml` runs it on fly.io.

## Local (single binary, like prod)
```sh
cd web && npm run build && cd ..
go build -o bin/httpd ./services/cmd/httpd
AITIO_WEB_DIR=web/dist ./bin/httpd     # http://localhost:8787
```

## Docker
```sh
docker build -t aitiome .
docker run -p 8787:8787 -e ANTHROPIC_API_KEY=sk-ant-... aitiome
```
Without the key the Claude evidence-reasoner falls back to the deterministic one;
everything else is identical.

## fly.io  ->  aitiome.metavert.io
Prerequisites: `fly auth login`, and DNS control of `metavert.io`.

```sh
# 1. Create the app (uses fly.toml; do not deploy yet)
fly launch --no-deploy --copy-config --name aitiome

# 2. Set the Claude key as a secret (never commit it)
fly secrets set ANTHROPIC_API_KEY=sk-ant-...

# 3. Deploy
fly deploy

# 4. Custom domain
fly certs add aitiome.metavert.io
#    fly prints the DNS records to add. Typically:
#      CNAME  aitiome  ->  aitiome.fly.dev
#    plus an _acme-challenge CNAME (or A/AAAA) for the certificate.
#    Add them at your metavert.io DNS provider, then:
fly certs show aitiome.metavert.io      # wait for "Certificate issued"
```

The engine reads `ANTHROPIC_API_KEY` from the environment (the fly secret); the
`.env` file is only for local dev and is gitignored.
