-- Tilføj allowMultipleBets kolonne til BetSubMarket tabel
-- Kør denne SQL i Supabase SQL Editor

-- Tilføj kolonne hvis den ikke findes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BetSubMarket' 
        AND column_name = 'allowMultipleBets'
    ) THEN
        ALTER TABLE "BetSubMarket" 
        ADD COLUMN "allowMultipleBets" BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'allowMultipleBets kolonne tilføjet';
    ELSE
        RAISE NOTICE 'allowMultipleBets kolonne findes allerede';
    END IF;
END $$;

