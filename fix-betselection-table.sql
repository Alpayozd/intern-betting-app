-- Fix BetSelection table - remove betMarketId and ensure betSubMarketId exists
-- Dette script opdaterer BetSelection tabellen til at bruge betSubMarketId i stedet for betMarketId

-- 1. Tjek om betSubMarketId kolonne findes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BetSelection' 
        AND column_name = 'betSubMarketId'
    ) THEN
        -- Tilføj betSubMarketId kolonne
        ALTER TABLE "BetSelection" ADD COLUMN "betSubMarketId" TEXT;
        RAISE NOTICE 'Column "betSubMarketId" added to "BetSelection" table.';
    END IF;
END $$;

-- 2. Slet alle eksisterende BetSelection data (da vi ikke kan migrere dem automatisk)
-- Dette er nødvendigt fordi vi ikke har en logisk mapping fra betMarketId til betSubMarketId
DELETE FROM "BetSelection";

-- 3. Fjern foreign key constraint for betMarketId hvis den findes
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

-- 4. Fjern betMarketId kolonne hvis den findes
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

-- 5. Sæt betSubMarketId til NOT NULL
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

-- 6. Tilføj foreign key constraint for betSubMarketId
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

-- 7. Tilføj index for betSubMarketId hvis det ikke findes
CREATE INDEX IF NOT EXISTS "BetSelection_betSubMarketId_idx" ON "BetSelection"("betSubMarketId");

-- 8. Fjern gammelt index for betMarketId hvis det findes
DROP INDEX IF EXISTS "BetSelection_betMarketId_idx";

