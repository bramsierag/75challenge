# Docker en GitHub Container Registry Setup

## Wat gebeurt er?

De workflow doet het volgende:
1. **Trigger**: Bij elke push naar `main`, `develop` of wanneer je een tag maakt (bijv. `v1.0.0`)
2. **Build**: Maakt een geoptimaliseerde Docker image met multi-stage build
3. **Push**: Upload naar GitHub Container Registry (ghcr.io)
4. **Tags**: Automatische versioning gebaseerd op branch/tag

## Stappen om te starten:

### 1. Push je code naar GitHub
```bash
git add .
git commit -m "Add Docker build workflow"
git push origin main
```

### 2. GitHub Actions wordt automatisch gestart
- Ga naar je repository op GitHub
- Klik op "Actions" tab
- Je ziet de workflow draaien

### 3. Image is beschikbaar op:
```
ghcr.io/JOUW_GITHUB_USERNAME/75challenge:latest
```

## Image gebruiken:

### Option A: Docker Compose met GitHub registry
```yaml
services:
  app:
    image: ghcr.io/JOUW_USERNAME/75challenge:latest
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/challenge
    ports:
      - "3000:3000"
```

### Option B: Lokaal pullen en draaien
```bash
# Login (eerste keer)
echo $GITHUB_TOKEN | docker login ghcr.io -u JOUW_USERNAME --password-stdin

# Pull image
docker pull ghcr.io/JOUW_USERNAME/75challenge:latest

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  ghcr.io/JOUW_USERNAME/75challenge:latest
```

## Versioning met tags:

```bash
# Maak een release tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

Dit maakt automatisch:
- `ghcr.io/user/75challenge:v1.0.0`
- `ghcr.io/user/75challenge:1.0`
- `ghcr.io/user/75challenge:latest`

## Public/Private image:

Standaard is je image **private**. Om het publiek te maken:
1. Ga naar GitHub → Packages
2. Klik op je package
3. Package settings → Change visibility → Public

## Lokaal testen van productie build:

```bash
# Build met production Dockerfile
docker build -f Dockerfile.prod -t 75challenge:test .

# Run met database
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/challenge" \
  75challenge:test
```

## Verschillen Dockerfile vs Dockerfile.prod:

- **Dockerfile**: Development met hot reload, volume mounts
- **Dockerfile.prod**: Multi-stage build, optimized, standalone output (kleiner, sneller)
