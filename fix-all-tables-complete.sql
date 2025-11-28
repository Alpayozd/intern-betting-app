-- Komplet fix script for alle tabeller
-- Dette script opdaterer alle tabeller til den nye struktur med BetSubMarket og WinningOption

-- ============================================
-- 1. FIX BETSELECTION TABEL
-- ============================================

-- Tjek om betSubMarketId kolonne findes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BetSelection' 
        AND column_name = 'betSubMarketId'
    ) THEN
        ALTER TABLE "BetSelection" ADD COLUMN "betSubMarketId" TEXT;
        RAISE NOTICE 'Column "betSubMarketId" added to "BetSelection" table.';
    END IF;
END $$;

-- Slet alle eksisterende BetSelection data
DELETE FROM "BetSelection";

-- Fjern foreign key constraint for betMarketId hvis den findes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'BetSelection_betMarketId_fkey'
    ) THEN
        ALTER TABLE "BetSelection" 
        DROP CONSTRAINT "BetSelection_betMarketId_fkey";
        RAISE NOTICE 'Foreign key constraint "BetSelection_betMarketId_fkey" dropped.';
    END IF;
END $$;

-- Fjern betMarketId kolonne hvis den findes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BetSelection' 
        AND column_name = 'betMarketId'
    ) THEN
        ALTER TABLE "BetSelection" 
        DROP COLUMN "betMarketId";
        RAISE NOTICE 'Column "betMarketId" dropped from "BetSelection" table.';
    END IF;
END $$;

-- Sæt betSubMarketId til NOT NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BetSelection' 
        AND column_name = 'betSubMarketId'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE "BetSelection" 
        ALTER COLUMN "betSubMarketId" SET NOT NULL;
        RAISE NOTICE 'Column "betSubMarketId" set to NOT NULL.';
    END IF;
END $$;

-- Tilføj foreign key constraint for betSubMarketId
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'BetSelection_betSubMarketId_fkey'
    ) THEN
        ALTER TABLE "BetSelection" 
        ADD CONSTRAINT "BetSelection_betSubMarketId_fkey" 
        FOREIGN KEY ("betSubMarketId") 
        REFERENCES "BetSubMarket"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
        RAISE NOTICE 'Foreign key constraint "BetSelection_betSubMarketId_fkey" added.';
    END IF;
END $$;

-- Tilføj index for betSubMarketId
CREATE INDEX IF NOT EXISTS "BetSelection_betSubMarketId_idx" ON "BetSelection"("betSubMarketId");

-- Fjern gammelt index for betMarketId
DROP INDEX IF EXISTS "BetSelection_betMarketId_idx";

-- ============================================
-- 2. FIX BETSUBMARKETSETTLEMENT TABEL
-- ============================================

-- Fjern winningOptionId foreign key constraint hvis den findes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'BetSubMarketSettlement_winningOptionId_fkey'
    ) THEN
        ALTER TABLE "BetSubMarketSettlement" 
        DROP CONSTRAINT "BetSubMarketSettlement_winningOptionId_fkey";
        RAISE NOTICE 'Foreign key constraint "BetSubMarketSettlement_winningOptionId_fkey" dropped.';
    END IF;
END $$;

-- Fjern index for winningOptionId hvis det findes
DROP INDEX IF EXISTS "BetSubMarketSettlement_winningOptionId_idx";

-- Fjern winningOptionId kolonne hvis den findes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BetSubMarketSettlement' 
        AND column_name = 'winningOptionId'
    ) THEN
        ALTER TABLE "BetSubMarketSettlement" 
        DROP COLUMN "winningOptionId";
        RAISE NOTICE 'Column "winningOptionId" dropped from "BetSubMarketSettlement" table.';
    END IF;
END $$;

-- ============================================
-- 3. SIKRER WINNINGOPTION TABEL FINDES
-- ============================================

-- Opret WinningOption tabel hvis den ikke findes
CREATE TABLE IF NOT EXISTS "WinningOption" (
    "id" TEXT NOT NULL,
    "betSubMarketSettlementId" TEXT NOT NULL,
    "betOptionId" TEXT NOT NULL,
    CONSTRAINT "WinningOption_pkey" PRIMARY KEY ("id")
);

-- Tilføj indexes til WinningOption
CREATE INDEX IF NOT EXISTS "WinningOption_betSubMarketSettlementId_idx" ON "WinningOption"("betSubMarketSettlementId");
CREATE INDEX IF NOT EXISTS "WinningOption_betOptionId_idx" ON "WinningOption"("betOptionId");

-- Tilføj unique constraint for (betSubMarketSettlementId, betOptionId)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'WinningOption_betSubMarketSettlementId_betOptionId_key'
    ) THEN
        ALTER TABLE "WinningOption" 
        ADD CONSTRAINT "WinningOption_betSubMarketSettlementId_betOptionId_key" 
        UNIQUE ("betSubMarketSettlementId", "betOptionId");
        RAISE NOTICE 'Unique constraint added to "WinningOption" table.';
    END IF;
END $$;

-- Tilføj foreign key constraints til WinningOption
DO $$
BEGIN
    -- Foreign key til BetSubMarketSettlement
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'WinningOption_betSubMarketSettlementId_fkey'
    ) THEN
        ALTER TABLE "WinningOption" 
        ADD CONSTRAINT "WinningOption_betSubMarketSettlementId_fkey" 
        FOREIGN KEY ("betSubMarketSettlementId") 
        REFERENCES "BetSubMarketSettlement"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
        RAISE NOTICE 'Foreign key constraint "WinningOption_betSubMarketSettlementId_fkey" added.';
    END IF;

    -- Foreign key til BetOption
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'WinningOption_betOptionId_fkey'
    ) THEN
        ALTER TABLE "WinningOption" 
        ADD CONSTRAINT "WinningOption_betOptionId_fkey" 
        FOREIGN KEY ("betOptionId") 
        REFERENCES "BetOption"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
        RAISE NOTICE 'Foreign key constraint "WinningOption_betOptionId_fkey" added.';
    END IF;
END $$;

-- ============================================
-- 4. SIKRER ALLOWMULTIPLEBETS KOLONNE FINDES
-- ============================================

-- Tilføj allowMultipleBets kolonne til BetSubMarket hvis den ikke findes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BetSubMarket' 
        AND column_name = 'allowMultipleBets'
    ) THEN
        ALTER TABLE "BetSubMarket" 
        ADD COLUMN "allowMultipleBets" BOOLEAN NOT NULL DEFAULT FALSE;
        RAISE NOTICE 'Column "allowMultipleBets" added to "BetSubMarket" table.';
    END IF;
END $$;

