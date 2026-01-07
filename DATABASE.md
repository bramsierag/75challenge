# 75 Challenge Database Setup

## Start Volledige Stack (App + Database)

```bash
# Start app en database
docker-compose up -d

# Bekijk logs
docker-compose logs -f

# Stop alles
docker-compose down
```

## Alleen Database

```bash
# Start alleen database
docker-compose up -d postgres

# Check of database draait
docker-compose ps

# Bekijk logs
docker-compose logs -f postgres
```

## Database Migraties

```bash
# Als je docker-compose gebruikt, worden migraties automatisch gedraaid

# Handmatig migraties draaien (lokale development)
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

## Development

**Optie 1: Alles in Docker**
```bash
docker-compose up -d
# App draait op http://localhost:3000
# Database draait op localhost:5432
```

**Optie 2: Alleen database in Docker, app lokaal**
```bash
# Start alleen database
docker-compose up -d postgres

# Run app lokaal
npm run dev
```

## Database Beheer

```bash
# Stop alles
docker-compose down

# Stop en verwijder data
docker-compose down -v

# Herstart services
docker-compose restart

# Rebuild app container
docker-compose up -d --build app
```

## Connectie Details

**Van lokale machine:**
- **Host:** localhost
- **Port:** 5432

**Van app container:**
- **Host:** postgres
- **Port:** 5432

**Database credentials:**
- **Database:** 75challenge
- **User:** postgres
- **Password:** postgres

## URLs

- **App:** http://localhost:3000
- **Database:** localhost:5432
