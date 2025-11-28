-- Migration v2: Tilføj BetSubMarket struktur
-- Kør denne SQL i Supabase SQL Editor
-- FORUDSÆTTER: Den første migration (supabase-migration.sql) er allerede kørt
-- KUN KØR DENNE FIL - IKKE DEN FØRSTE MIGRATION IGEN!

-- Opret enums (hvis de ikke allerede findes)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GroupRole') THEN
        CREATE TYPE "GroupRole" AS ENUM ('ADMIN', 'MEMBER');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BetMarketStatus') THEN
        CREATE TYPE "BetMarketStatus" AS ENUM ('OPEN', 'CLOSED', 'SETTLED');
    END IF;
END $$;

-- Opret BetSubMarket tabel (hvis den ikke allerede findes)
CREATE TABLE IF NOT EXISTS "BetSubMarket" (
    "id" TEXT NOT NULL,
    "betMarketId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "BetMarketStatus" NOT NULL DEFAULT 'OPEN',
    "createdByUserId" TEXT NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetSubMarket_pkey" PRIMARY KEY ("id")
);

-- Opret BetSubMarketSettlement tabel (hvis den ikke allerede findes)
CREATE TABLE IF NOT EXISTS "BetSubMarketSettlement" (
    "id" TEXT NOT NULL,
    "betSubMarketId" TEXT NOT NULL,
    "winningOptionId" TEXT NOT NULL,
    "settledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledByUserId" TEXT NOT NULL,

    CONSTRAINT "BetSubMarketSettlement_pkey" PRIMARY KEY ("id")
);

-- Opdater BetOption til at referere til BetSubMarket
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'BetOption' AND column_name = 'betSubMarketId') THEN
        ALTER TABLE "BetOption" ADD COLUMN "betSubMarketId" TEXT;
    END IF;
END $$;

ALTER TABLE "BetOption" DROP CONSTRAINT IF EXISTS "BetOption_betMarketId_fkey";

-- Opdater BetSelection til at referere til BetSubMarket
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'BetSelection' AND column_name = 'betSubMarketId') THEN
        ALTER TABLE "BetSelection" ADD COLUMN "betSubMarketId" TEXT;
    END IF;
END $$;

ALTER TABLE "BetSelection" DROP CONSTRAINT IF EXISTS "BetSelection_betMarketId_fkey";

-- Tilføj foreign keys (hvis de ikke allerede findes)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BetSubMarket_betMarketId_fkey') THEN
        ALTER TABLE "BetSubMarket" ADD CONSTRAINT "BetSubMarket_betMarketId_fkey" 
            FOREIGN KEY ("betMarketId") REFERENCES "BetMarket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BetSubMarket_createdByUserId_fkey') THEN
        ALTER TABLE "BetSubMarket" ADD CONSTRAINT "BetSubMarket_createdByUserId_fkey" 
            FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BetOption_betSubMarketId_fkey') THEN
        ALTER TABLE "BetOption" ADD CONSTRAINT "BetOption_betSubMarketId_fkey" 
            FOREIGN KEY ("betSubMarketId") REFERENCES "BetSubMarket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BetSelection_betSubMarketId_fkey') THEN
        ALTER TABLE "BetSelection" ADD CONSTRAINT "BetSelection_betSubMarketId_fkey" 
            FOREIGN KEY ("betSubMarketId") REFERENCES "BetSubMarket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BetSubMarketSettlement_betSubMarketId_fkey') THEN
        ALTER TABLE "BetSubMarketSettlement" ADD CONSTRAINT "BetSubMarketSettlement_betSubMarketId_fkey" 
            FOREIGN KEY ("betSubMarketId") REFERENCES "BetSubMarket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BetSubMarketSettlement_winningOptionId_fkey') THEN
        ALTER TABLE "BetSubMarketSettlement" ADD CONSTRAINT "BetSubMarketSettlement_winningOptionId_fkey" 
            FOREIGN KEY ("winningOptionId") REFERENCES "BetOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BetSubMarketSettlement_settledByUserId_fkey') THEN
        ALTER TABLE "BetSubMarketSettlement" ADD CONSTRAINT "BetSubMarketSettlement_settledByUserId_fkey" 
            FOREIGN KEY ("settledByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Tilføj indexes (hvis de ikke allerede findes)
CREATE INDEX IF NOT EXISTS "BetSubMarket_betMarketId_idx" ON "BetSubMarket"("betMarketId");
CREATE INDEX IF NOT EXISTS "BetSubMarket_status_idx" ON "BetSubMarket"("status");
CREATE INDEX IF NOT EXISTS "BetOption_betSubMarketId_idx" ON "BetOption"("betSubMarketId");
CREATE INDEX IF NOT EXISTS "BetSelection_betSubMarketId_idx" ON "BetSelection"("betSubMarketId");
CREATE INDEX IF NOT EXISTS "BetSubMarketSettlement_betSubMarketId_idx" ON "BetSubMarketSettlement"("betSubMarketId");

-- Tilføj unique constraint (hvis den ikke allerede findes)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BetSubMarketSettlement_betSubMarketId_key') THEN
        ALTER TABLE "BetSubMarketSettlement" ADD CONSTRAINT "BetSubMarketSettlement_betSubMarketId_key" UNIQUE ("betSubMarketId");
    END IF;
END $$;

-- NOTE: Eksisterende data skal migreres manuelt eller slettes
-- Gamle betOptions og betSelections der refererer til BetMarket direkte skal opdateres eller slettes

