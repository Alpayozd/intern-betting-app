# Deployment Guide - Bet with Friends

Denne guide forklarer hvordan du deployer appen online.

## Option 1: Vercel (Anbefalet - Nemmest)

Vercel er den nemmeste måde at deploye Next.js apps på.

### Trin 1: Opret Vercel konto
1. Gå til [vercel.com](https://vercel.com)
2. Opret en konto (gratis med GitHub/GitLab/Bitbucket)

### Trin 2: Forbered database online
Du skal have en online PostgreSQL database. Her er nogle gratis muligheder:

**Option A: Supabase (Anbefalet)**
1. Gå til [supabase.com](https://supabase.com)
2. Opret en gratis konto
3. Opret et nyt projekt
4. Gå til "Settings" > "Database"
5. Kopier "Connection string" (URI format)
6. Den ser ud som: `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`

**Option B: Neon**
1. Gå til [neon.tech](https://neon.tech)
2. Opret en gratis konto
3. Opret et nyt projekt
4. Kopier connection string

**Option C: Railway**
1. Gå til [railway.app](https://railway.app)
2. Opret en gratis konto
3. Opret et nyt PostgreSQL projekt
4. Kopier connection string

### Trin 3: Push kode til GitHub
1. Opret et nyt repository på GitHub
2. I din terminal, kør:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/[DIT-BRUGERNAVN]/[REPO-NAVN].git
git push -u origin main
```

### Trin 4: Deploy på Vercel
1. Gå til [vercel.com/new](https://vercel.com/new)
2. Vælg dit GitHub repository
3. Klik "Import"
4. I "Environment Variables", tilføj:
   - `DATABASE_URL`: Din PostgreSQL connection string fra trin 2
   - `NEXTAUTH_SECRET`: Generer en secret (se nedenfor)
   - `NEXTAUTH_URL`: Din Vercel URL (fx `https://din-app.vercel.app`)

**Generer NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

5. Klik "Deploy"
6. Vent på deployment (2-5 minutter)

### Trin 5: Kør database migrations
Efter deployment, skal du køre Prisma migrations:

1. Gå til Vercel dashboard > dit projekt > "Settings" > "Functions"
2. Eller brug Vercel CLI:
```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.local
```

3. Kør migrations:
```bash
npx prisma migrate deploy
```

Eller brug Prisma Studio online via Vercel CLI.

### Trin 6: Seed database (valgfrit)
Hvis du vil have test data:
```bash
npm run db:seed
```

## Option 2: Netlify

1. Opret konto på [netlify.com](https://netlify.com)
2. Push kode til GitHub
3. Vælg "Add new site" > "Import from Git"
4. Vælg dit repository
5. Build command: `npm run build`
6. Publish directory: `.next`
7. Tilføj environment variables (samme som Vercel)
8. Deploy

## Option 3: Railway

1. Opret konto på [railway.app](https://railway.app)
2. "New Project" > "Deploy from GitHub repo"
3. Vælg dit repository
4. Railway opretter automatisk en PostgreSQL database
5. Tilføj environment variables
6. Deploy

## Vigtige Environment Variables

Sørg for at have disse i din hosting platform:

```
DATABASE_URL=postgresql://user:password@host:5432/database
NEXTAUTH_SECRET=din-secret-key-her
NEXTAUTH_URL=https://din-app.vercel.app
```

## Efter Deployment

1. **Test appen**: Gå til din URL og test alle features
2. **Opret første bruger**: Gå til `/signup` og opret en konto
3. **Opret gruppe**: Test at oprette en gruppe
4. **Test betting**: Opret et bet market og test betting flow

## Troubleshooting

### Database connection fejl
- Tjek at `DATABASE_URL` er korrekt
- Tjek at database er tilgængelig fra internettet (ikke kun localhost)
- Tjek firewall settings på din database provider

### NextAuth fejl
- Sørg for at `NEXTAUTH_URL` matcher din faktiske URL
- Sørg for at `NEXTAUTH_SECRET` er sat

### Build fejl
- Tjek at alle dependencies er i `package.json`
- Tjek build logs i Vercel dashboard

## Custom Domain (Valgfrit)

1. Gå til Vercel dashboard > dit projekt > "Settings" > "Domains"
2. Tilføj dit domæne
3. Følg instruktionerne for DNS setup

## Continous Deployment

Når du pusher til GitHub, deployer Vercel automatisk. Det er sat op som standard!

