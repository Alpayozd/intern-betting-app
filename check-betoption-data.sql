-- Tjek om der er data i BetOption tabellen
-- Kør denne først for at se om der er data der skal migreres

SELECT COUNT(*) as total_options FROM "BetOption";

-- Vis eksisterende data (hvis der er nogen)
SELECT * FROM "BetOption" LIMIT 10;

