-- Fix BetSubMarket tabel - sikrer at betMarketId IKKE er nullable
-- Kør denne SQL i Supabase SQL Editor

-- Først, tjek om tabellen findes
DO $$ 
BEGIN
    -- Opret BetSubMarket tabel hvis den ikke findes
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'BetSubMarket') THEN
        CREATE TABLE "BetSubMarket" (
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
        
        RAISE NOTICE 'BetSubMarket tabel oprettet';
    ELSE
        RAISE NOTICE 'BetSubMarket tabel findes allerede';
    END IF;
    
    -- Sikrer at betMarketId IKKE er nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BetSubMarket' 
        AND column_name = 'betMarketId' 
        AND is_nullable = 'YES'
    ) THEN
        -- Opdater eksisterende nullable værdier til en tom string (hvis der er nogen)
        UPDATE "BetSubMarket" SET "betMarketId" = '' WHERE "betMarketId" IS NULL;
        
        -- Gør kolonnen NOT NULL
        ALTER TABLE "BetSubMarket" ALTER COLUMN "betMarketId" SET NOT NULL;
        
        RAISE NOTICE 'betMarketId kolonne er nu NOT NULL';
    ELSE
        RAISE NOTICE 'betMarketId kolonne er allerede NOT NULL';
    END IF;
    
    -- Tilføj foreign key hvis den ikke findes
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'BetSubMarket_betMarketId_fkey'
    ) THEN
        ALTER TABLE "BetSubMarket" 
        ADD CONSTRAINT "BetSubMarket_betMarketId_fkey" 
        FOREIGN KEY ("betMarketId") 
        REFERENCES "BetMarket"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
        
        RAISE NOTICE 'Foreign key tilføjet';
    ELSE
        RAISE NOTICE 'Foreign key findes allerede';
    END IF;
    
    -- Tilføj index hvis det ikke findes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'BetSubMarket' 
        AND indexname = 'BetSubMarket_betMarketId_idx'
    ) THEN
        CREATE INDEX "BetSubMarket_betMarketId_idx" ON "BetSubMarket"("betMarketId");
        RAISE NOTICE 'Index tilføjet';
    ELSE
        RAISE NOTICE 'Index findes allerede';
    END IF;
END $$;

