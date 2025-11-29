-- Cleanup script: Slet alle orphaned BetSelections
-- Dette script sletter alle BetSelections der refererer til BetOptions der ikke længere findes
-- Kør dette i Supabase SQL Editor

-- Slet alle BetSelections der refererer til BetOptions der ikke længere findes
DELETE FROM "BetSelection"
WHERE "betOptionId" NOT IN (
    SELECT id FROM "BetOption"
);

-- Vis antal slettede records (hvis nogen)
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Slettet % orphaned BetSelections', deleted_count;
END $$;

