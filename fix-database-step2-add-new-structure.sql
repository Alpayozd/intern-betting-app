-- STEP 2: Tilføj nye constraints og strukturer
-- Kør dette script EFTER step1

-- ============================================
-- 1. TILFØJ FOREIGN KEY FOR BETSUBMARKETID I BETSELECTION
-- ============================================

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

-- ============================================
-- 2. OPRET WINNINGOPTION TABEL
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
-- 3. SIKRER ALLOWMULTIPLEBETS KOLONNE FINDES
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

