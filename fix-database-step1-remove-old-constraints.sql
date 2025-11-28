-- STEP 1: Fjern alle gamle constraints og kolonner FØRST
-- Kør dette script FØRST for at fjerne alle gamle strukturer

-- ============================================
-- 1. FJERN WINNINGOPTIONID FRA BETSUBMARKETSETTLEMENT
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
-- 2. FJERN BETMARKETID FRA BETSELECTION
-- ============================================

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

-- Fjern gammelt index for betMarketId
DROP INDEX IF EXISTS "BetSelection_betMarketId_idx";

-- ============================================
-- 3. SIKRER BETSUBMARKETID FINDES I BETSELECTION
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

-- Slet alle eksisterende BetSelection data (da vi ikke kan migrere dem)
DELETE FROM "BetSelection";

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

