-- Fix BetOption tabel - opdater fra betMarketId til betSubMarketId
-- Kør denne SQL i Supabase SQL Editor
-- ADVARSEL: Dette vil slette alle eksisterende BetOptions hvis der er nogen!

-- Først, tjek om betMarketId kolonne findes
DO $$ 
BEGIN
    -- Hvis betMarketId kolonne findes, skal vi migrere data og opdatere strukturen
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BetOption' 
        AND column_name = 'betMarketId'
    ) THEN
        RAISE NOTICE 'betMarketId kolonne findes - starter migration...';
        
        -- ADVARSEL: Hvis der er eksisterende data, skal vi slette dem
        -- da vi ikke kan migrere fra betMarketId til betSubMarketId automatisk
        IF EXISTS (SELECT 1 FROM "BetOption" LIMIT 1) THEN
            RAISE NOTICE 'ADVARSEL: Der er eksisterende data i BetOption. Sletter dem...';
            DELETE FROM "BetOption";
            RAISE NOTICE 'Eksisterende BetOptions slettet';
        END IF;
        
        -- Slet betMarketId foreign key constraint hvis den findes
        IF EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'BetOption_betMarketId_fkey'
        ) THEN
            ALTER TABLE "BetOption" DROP CONSTRAINT "BetOption_betMarketId_fkey";
            RAISE NOTICE 'betMarketId foreign key constraint slettet';
        END IF;
        
        -- Slet betMarketId kolonne
        ALTER TABLE "BetOption" DROP COLUMN "betMarketId";
        RAISE NOTICE 'betMarketId kolonne slettet';
    END IF;
    
    -- Sikrer at betSubMarketId kolonne findes og er NOT NULL
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
            ALTER TABLE "BetOption" ALTER COLUMN "betSubMarketId" SET NOT NULL;
            RAISE NOTICE 'betSubMarketId kolonne er nu NOT NULL';
        END IF;
    END IF;
    
    -- Tilføj foreign key constraint hvis den ikke findes
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
    
    -- Tilføj index hvis det ikke findes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'BetOption' 
        AND indexname = 'BetOption_betSubMarketId_idx'
    ) THEN
        CREATE INDEX "BetOption_betSubMarketId_idx" ON "BetOption"("betSubMarketId");
        RAISE NOTICE 'Index tilføjet';
    END IF;
    
    RAISE NOTICE 'BetOption tabel migration færdig!';
END $$;

