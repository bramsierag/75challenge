# 75 Challenge - Next.js PWA met Postgres

Een Progressive Web App gebouwd met Next.js, TypeScript en Postgres.

## Functionaliteiten

- ✅ Next.js 15+ met App Router
- ✅ TypeScript voor type safety
- ✅ PWA ondersteuning (offline werken, installeerbaar)
- ✅ Prisma ORM voor database management
- ✅ PostgreSQL database
- ✅ Tailwind CSS voor styling
- ✅ ESLint voor code kwaliteit

## Vereisten

- Node.js 18+ 
- PostgreSQL database (lokaal of remote)
- npm of yarn

## Installatie

1. **Installeer dependencies:**
   ```bash
   npm install
   ```

2. **Configureer database:**
   
   Pas `.env` bestand aan met jouw Postgres connection string:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/75challenge"
   ```

3. **Genereer Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

4. **Run database migraties:**
   ```bash
   npm run prisma:migrate
   ```

## Development

Start de development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

## API Endpoints

### Challenges

- `GET /api/challenges` - Haal alle challenges op
- `POST /api/challenges` - Maak een nieuwe challenge aan
  ```json
  {
    "title": "Workout",
    "day": 1
  }
  ```
- `GET /api/challenges/[id]` - Haal een specifieke challenge op
- `PATCH /api/challenges/[id]` - Update een challenge (bijv. markeer als voltooid)
  ```json
  {
    "completed": true
  }
  ```
- `DELETE /api/challenges/[id]` - Verwijder een challenge

## Database Management

- **Prisma Studio:** `npm run prisma:studio` - Open visuele database editor
- **Migraties:** `npm run prisma:migrate` - Run nieuwe database migraties
- **Client genereren:** `npm run prisma:generate` - Genereer Prisma Client

## PWA Features

De app is een Progressive Web App met:

- **Offline functionaliteit** - Werkt zonder internetverbinding
- **Installeerbaar** - Installeer als native app op je apparaat
- **Service Worker** - Automatische caching voor snelle laadtijden
- **Manifest** - App iconen en display instellingen

## Project Structuur

```
75challenge/
├── app/
│   ├── api/              # API routes
│   │   └── challenges/   # Challenge endpoints
│   ├── globals.css       # Tailwind CSS
│   ├── layout.tsx        # Root layout met PWA metadata
│   └── page.tsx          # Homepage
├── lib/
│   └── prisma.ts         # Prisma client singleton
├── prisma/
│   └── schema.prisma     # Database schema
├── public/
│   ├── manifest.json     # PWA manifest
│   └── icon.svg          # App icoon
└── .env                  # Environment variabelen
```

## Database Schema

### Challenge Model
```prisma
model Challenge {
  id        String   @id @default(cuid())
  title     String
  completed Boolean  @default(false)
  day       Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### User Model
```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Deployment

### Build voor productie

```bash
npm run build
npm start
```

### Platform specifieke instructies

- **Vercel:** Push naar GitHub en verbind met Vercel
- **Railway/Render:** Zorg dat `DATABASE_URL` is geconfigureerd
- **Docker:** Maak een Dockerfile met Node.js en Postgres

## Tips

1. **Icons genereren:** Gebruik een tool zoals [PWA Asset Generator](https://www.pwabuilder.com/) om app icons te maken
2. **Database seeding:** Maak een `prisma/seed.ts` bestand voor test data
3. **Environment variabelen:** Gebruik nooit echte credentials in `.env` voor productie

## Licentie

MIT
