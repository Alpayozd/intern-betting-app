-- Tjek BetSubMarket tabel struktur i Supabase
-- Kør denne SQL i Supabase SQL Editor

-- Tjek om BetSubMarket tabellen findes
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'BetSubMarket'
) AS table_exists;

-- Tjek betMarketId kolonne struktur
SELECT 
  column_name,
  is_nullable,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'BetSubMarket' 
AND column_name = 'betMarketId';

-- Tjek alle kolonner i BetSubMarket
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'BetSubMarket'
ORDER BY ordinal_position;

