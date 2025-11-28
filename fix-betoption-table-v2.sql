-- Fix BetOption tabel - opdater fra betMarketId til betSubMarketId
-- Kør denne SQL i Supabase SQL Editor
-- Dette script sletter ALLE eksisterende BetOptions og opdaterer strukturen

-- Først, slet alle eksisterende BetOptions (da de ikke kan migreres)
DELETE FROM "BetOption";

-- Slet betMarketId foreign key constraint hvis den findes
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'BetOption_betMarketId_fkey'
    ) THEN
        ALTER TABLE "BetOption" DROP CONSTRAINT "BetOption_betMarketId_fkey";
        RAISE NOTICE 'betMarketId foreign key constraint slettet';
    END IF;
END $$;

-- Slet betMarketId kolonne hvis den findes
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BetOption' 
        AND column_name = 'betMarketId'
    ) THEN
        ALTER TABLE "BetOption" DROP COLUMN "betMarketId";
        RAISE NOTICE 'betMarketId kolonne slettet';
    END IF;
END $$;

-- Sikrer at betSubMarketId kolonne findes og er NOT NULL
DO $$ 
BEGIN
    -- Tilføj kolonne hvis den ikke findes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BetOption' 
        AND column_name = 'betSubMarketId'
    ) THEN
        ALTER TABLE "BetOption" ADD COLUMN "betSubMarketId" TEXT NOT NULL;
        RAISE NOTICE 'betSubMarketId kolonne oprettet';
    ELSE
        -- Opdater eksisterende NULL værdier (hvis der er nogen)
        UPDATE "BetOption" SET "betSubMarketId" = '' WHERE "betSubMarketId" IS NULL;
        
        -- Gør kolonnen NOT NULL hvis den ikke allerede er det
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'BetOption' 
            AND column_name = 'betSubMarketId' 
            AND is_nullable = 'YES'
        ) THEN
            -- Først opdater alle NULL værdier
            UPDATE "BetOption" SET "betSubMarketId" = '' WHERE "betSubMarketId" IS NULL;
            -- Derefter gør kolonnen NOT NULL
            ALTER TABLE "BetOption" ALTER COLUMN "betSubMarketId" SET NOT NULL;
            RAISE NOTICE 'betSubMarketId kolonne er nu NOT NULL';
        END IF;
    END IF;
END $$;

-- Tilføj foreign key constraint hvis den ikke findes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'BetOption_betSubMarketId_fkey'
    ) THEN
        ALTER TABLE "BetOption" 
        ADD CONSTRAINT "BetOption_betSubMarketId_fkey" 
        FOREIGN KEY ("betSubMarketId") 
        REFERENCES "BetSubMarket"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
        RAISE NOTICE 'betSubMarketId foreign key constraint tilføjet';
    END IF;
END $$;

-- Tilføj index hvis det ikke findes
CREATE INDEX IF NOT EXISTS "BetOption_betSubMarketId_idx" ON "BetOption"("betSubMarketId");

-- Verificer strukturen
SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'BetOption'
ORDER BY ordinal_position;

