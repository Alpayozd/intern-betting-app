-- Migration: Support multiple winning options per settlement
-- Dette script opdaterer databasen til at understøtte flere vindende options per settlement

-- 1. Opret WinningOption tabel
CREATE TABLE IF NOT EXISTS "WinningOption" (
    "id" TEXT NOT NULL,
    "betSubMarketSettlementId" TEXT NOT NULL,
    "betOptionId" TEXT NOT NULL,

    CONSTRAINT "WinningOption_pkey" PRIMARY KEY ("id")
);

-- 2. Tilføj indexes til WinningOption
CREATE INDEX IF NOT EXISTS "WinningOption_betSubMarketSettlementId_idx" ON "WinningOption"("betSubMarketSettlementId");
CREATE INDEX IF NOT EXISTS "WinningOption_betOptionId_idx" ON "WinningOption"("betOptionId");

-- 3. Tilføj unique constraint for (betSubMarketSettlementId, betOptionId)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'WinningOption_betSubMarketSettlementId_betOptionId_key'
    ) THEN
        ALTER TABLE "WinningOption" 
        ADD CONSTRAINT "WinningOption_betSubMarketSettlementId_betOptionId_key" 
        UNIQUE ("betSubMarketSettlementId", "betOptionId");
    END IF;
END $$;

-- 4. Tilføj foreign key constraints til WinningOption
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
    END IF;
END $$;

-- 5. Migrer eksisterende data (hvis der er nogen)
-- Kopiér winningOptionId fra BetSubMarketSettlement til WinningOption
DO $$
DECLARE
    settlement_record RECORD;
BEGIN
    FOR settlement_record IN 
        SELECT id, "winningOptionId" 
        FROM "BetSubMarketSettlement" 
        WHERE "winningOptionId" IS NOT NULL
    LOOP
        -- Tjek om WinningOption allerede findes
        IF NOT EXISTS (
            SELECT 1 FROM "WinningOption" 
            WHERE "betSubMarketSettlementId" = settlement_record.id 
            AND "betOptionId" = settlement_record."winningOptionId"
        ) THEN
            INSERT INTO "WinningOption" ("id", "betSubMarketSettlementId", "betOptionId")
            VALUES (
                gen_random_uuid()::text,
                settlement_record.id,
                settlement_record."winningOptionId"
            );
        END IF;
    END LOOP;
END $$;

-- 6. Fjern winningOptionId kolonne fra BetSubMarketSettlement
-- Først fjern foreign key constraint hvis den findes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'BetSubMarketSettlement_winningOptionId_fkey'
    ) THEN
        ALTER TABLE "BetSubMarketSettlement" 
        DROP CONSTRAINT "BetSubMarketSettlement_winningOptionId_fkey";
    END IF;
END $$;

-- Fjern index hvis det findes
DROP INDEX IF EXISTS "BetSubMarketSettlement_winningOptionId_idx";

-- Fjern kolonne
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'BetSubMarketSettlement' 
        AND column_name = 'winningOptionId'
    ) THEN
        ALTER TABLE "BetSubMarketSettlement" 
        DROP COLUMN "winningOptionId";
    END IF;
END $$;

-- 7. Fjern winningSettlements relation fra BetOption (hvis den findes som constraint)
-- Dette er normalt ikke nødvendigt, da Prisma håndterer relationer, men vi sikrer os
DO $$
BEGIN
    -- Tjek om der er en foreign key constraint fra BetOption til BetSubMarketSettlement
    -- (Dette skulle normalt ikke eksistere, men vi tjekker alligevel)
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname LIKE '%BetOption%winningSettlements%'
    ) THEN
        -- Fjern constraint hvis den findes
        EXECUTE 'ALTER TABLE "BetOption" DROP CONSTRAINT IF EXISTS ' || 
                (SELECT conname FROM pg_constraint WHERE conname LIKE '%BetOption%winningSettlements%' LIMIT 1);
    END IF;
END $$;

