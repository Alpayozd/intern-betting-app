# 🎲 Intern Betting App

En moderne webapp hvor grupper af venner kan lave interne bets/odds inspireret af Bet365, men **KUN med point og for sjov** – ingen rigtige penge, ingen betalinger, ingen integration til betalingsgateways.

## ⚠️ Vigtigt

Denne app er **kun til underholdning**. Der handles ikke med rigtige penge, og alt sker med virtuelle points.

## 🎯 Funktioner

- **Grupper**: Opret eller join grupper med venner via invite codes
- **Bet Markets**: Opret bets med flere options og decimal-odds
- **Point System**: Hver bruger starter med 1000 points pr. gruppe
- **Leaderboard**: Følg point-stillingen i hver gruppe
- **Settlement**: Admins kan afgøre bets og points udbetales automatisk til vindere

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + React
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth.js (Credentials Provider)
- **Form Validation**: React Hook Form + Zod

## 📋 Forudsætninger

- Node.js 18+ og npm
- PostgreSQL database (lokalt eller remote)

## 🚀 Installation og Setup

### 1. Klon eller download projektet

```bash
cd "app til intern betting"
```

### 2. Installer dependencies

```bash
npm install
```

### 3. Opsæt miljøvariabler

Opret en `.env` fil i roden af projektet:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/intern_betting?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="din-hemmelige-nøgle-her-generer-en-tilfældig-streng"
```

**Vigtigt**: Generer en sikker `NEXTAUTH_SECRET`. Du kan bruge:

```bash
openssl rand -base64 32
```

### 4. Opsæt database

```bash
# Generer Prisma Client
npm run db:generate

# Push schema til database (eller brug migrate)
npm run db:push

# Seed database med testdata
npm run db:seed
```

### 5. Start udviklingsserveren

```bash
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000) i din browser.

## 🧪 Tests

Kør tests:

```bash
npm test
```

Tests dækker:
- Beregning af potentialPayoutPoints (stakePoints * odds)
- Validering af point saldo før bet
- Settlement logik (udbetaling til vindere)

## 📊 Database Schema

### Hovedentiteter

- **User**: Brugere med email/password auth
- **Group**: Grupper med invite codes
- **GroupMembership**: Medlemskab (ADMIN/MEMBER)
- **BetMarket**: Et bet/marked med status (OPEN/CLOSED/SETTLED)
- **BetOption**: En option inden for et bet market med odds
- **BetSelection**: En brugers bet (stakePoints + potentialPayoutPoints)
- **BetSettlement**: Afgørelse af et bet market (winningOptionId)
- **GroupScore**: Point saldo pr. bruger pr. gruppe (starter med 1000)

## 🎮 Brug af Appen

### 1. Opret konto

Gå til `/signup` og opret en konto.

### 2. Opret eller join en gruppe

- **Opret gruppe**: Gå til `/groups` og opret en ny gruppe
- **Join gruppe**: Brug invite code fra en eksisterende gruppe

### 3. Opret et bet market

Som admin i en gruppe kan du oprette bet markets:
- Titel og beskrivelse
- Lukketidspunkt
- Options med labels og odds

### 4. Placer bets

Når et bet market er åbent, kan medlemmer placere bets:
- Vælg en option
- Angiv stake (antal points)
- Se potentiel gevinst (stake * odds)

### 5. Afgør bet market

Som admin kan du afgøre et bet market når det er lukket:
- Vælg vindende option
- Points udbetales automatisk til vindere
- Leaderboard opdateres

## 📝 Seed Data

Seed scriptet opretter:

- **3 test brugere**:
  - alpay@test.com / test123
  - jonas@test.com / test123
  - mehmet@test.com / test123

- **1 test gruppe**: "Sushi-challenge" (invite code: SUSHI123)

- **2 test bet markets**:
  - Et åbent bet market
  - Et afgjort bet market med eksempel bets

## 🔐 Sikkerhed

- Passwords hashes med bcrypt
- NextAuth session management
- API routes beskyttet med session checks
- Kun admins kan afgøre bet markets

## 📦 Scripts

```bash
# Udvikling
npm run dev          # Start dev server

# Database
npm run db:generate  # Generer Prisma Client
npm run db:push      # Push schema til DB
npm run db:migrate   # Kør migration
npm run db:seed      # Seed testdata

# Produktion
npm run build        # Build til produktion
npm start            # Start produktion server

# Tests
npm test             # Kør tests
```

## 🏗️ Projektstruktur

```
.
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── groups/            # Gruppe sider
│   ├── bet-markets/      # Bet market sider
│   ├── login/             # Login side
│   ├── signup/            # Signup side
│   └── profile/           # Profil side
├── components/            # React komponenter
├── lib/                   # Utilities (Prisma, Auth)
├── prisma/                # Prisma schema og seed
├── types/                 # TypeScript typer
└── README.md
```

## 🌐 Deployment

For at få appen online, se [DEPLOYMENT.md](./DEPLOYMENT.md) for en detaljeret guide.

**Hurtig start med Vercel:**
1. Push kode til GitHub
2. Opret konto på [vercel.com](https://vercel.com)
3. Import dit repository
4. Tilføj environment variables (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)
5. Deploy!

**Database hosting (gratis):**
- [Supabase](https://supabase.com) - Anbefalet
- [Neon](https://neon.tech)
- [Railway](https://railway.app)

## 🐛 Fejlfinding

### Database connection fejl

Tjek at `DATABASE_URL` i `.env` er korrekt og at PostgreSQL kører.

### NextAuth fejl

Tjek at `NEXTAUTH_SECRET` er sat i `.env`.

### Build fejl

Sørg for at køre `npm run db:generate` før build.

## 📄 Licens

Dette projekt er til intern brug og underholdning.

## 🤝 Bidrag

Dette er et eksempelprojekt. Føl dig fri til at tilpasse og udvide efter behov!

---

**Husk**: Alt er kun for sjov med points. Ingen rigtige penge involveret! 🎲

