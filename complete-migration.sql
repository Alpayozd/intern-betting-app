-- KOMPLET MIGRATION - Kør denne i Supabase SQL Editor
-- Dette script opretter ALT fra bunden, så du ikke behøver den første migration

-- Opret enums først (hvis de ikke allerede findes)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GroupRole') THEN
        CREATE TYPE "GroupRole" AS ENUM ('ADMIN', 'MEMBER');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BetMarketStatus') THEN
        CREATE TYPE "BetMarketStatus" AS ENUM ('OPEN', 'CLOSED', 'SETTLED');
    END IF;
END $$;

-- Opret User tabel (hvis den ikke findes)
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "User_email_key" UNIQUE ("email")
);

-- Opret Group tabel (hvis den ikke findes)
CREATE TABLE IF NOT EXISTS "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "inviteCode" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Group_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Group_inviteCode_key" UNIQUE ("inviteCode")
);

-- Opret GroupMembership tabel (hvis den ikke findes)
CREATE TABLE IF NOT EXISTS "GroupMembership" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupMembership_pkey" PRIMARY KEY ("id")
);

-- Opret GroupScore tabel (hvis den ikke findes)
CREATE TABLE IF NOT EXISTS "GroupScore" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 1000,
    "initialPoints" INTEGER NOT NULL DEFAULT 1000,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupScore_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GroupScore_groupId_userId_key" UNIQUE ("groupId", "userId")
);

-- Opret BetMarket tabel (hvis den ikke findes)
CREATE TABLE IF NOT EXISTS "BetMarket" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "BetMarketStatus" NOT NULL DEFAULT 'OPEN',
    "createdByUserId" TEXT NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BetMarket_pkey" PRIMARY KEY ("id")
);

-- Opret BetSubMarket tabel (hvis den ikke findes)
CREATE TABLE IF NOT EXISTS "BetSubMarket" (
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

-- Opret BetOption tabel (hvis den ikke findes)
CREATE TABLE IF NOT EXISTS "BetOption" (
    "id" TEXT NOT NULL,
    "betSubMarketId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "odds" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BetOption_pkey" PRIMARY KEY ("id")
);

-- Opret BetSelection tabel (hvis den ikke findes)
CREATE TABLE IF NOT EXISTS "BetSelection" (
    "id" TEXT NOT NULL,
    "betSubMarketId" TEXT NOT NULL,
    "betOptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stakePoints" INTEGER NOT NULL,
    "potentialPayoutPoints" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BetSelection_pkey" PRIMARY KEY ("id")
);

-- Opret BetSubMarketSettlement tabel (hvis den ikke findes)
CREATE TABLE IF NOT EXISTS "BetSubMarketSettlement" (
    "id" TEXT NOT NULL,
    "betSubMarketId" TEXT NOT NULL,
    "winningOptionId" TEXT NOT NULL,
    "settledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledByUserId" TEXT NOT NULL,
    CONSTRAINT "BetSubMarketSettlement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BetSubMarketSettlement_betSubMarketId_key" UNIQUE ("betSubMarketId")
);

-- Tilføj foreign keys (hvis de ikke allerede findes)
DO $$ 
BEGIN
    -- Group foreign keys
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Group_createdByUserId_fkey') THEN
        ALTER TABLE "Group" ADD CONSTRAINT "Group_createdByUserId_fkey" 
            FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    -- GroupMembership foreign keys
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GroupMembership_groupId_fkey') THEN
        ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_groupId_fkey" 
            FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GroupMembership_userId_fkey') THEN
        ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    -- GroupScore foreign keys
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GroupScore_groupId_fkey') THEN
        ALTER TABLE "GroupScore" ADD CONSTRAINT "GroupScore_groupId_fkey" 
            FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GroupScore_userId_fkey') THEN
        ALTER TABLE "GroupScore" ADD CONSTRAINT "GroupScore_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    -- BetMarket foreign keys
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BetMarket_groupId_fkey') THEN
        ALTER TABLE "BetMarket" ADD CONSTRAINT "BetMarket_groupId_fkey" 
            FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BetMarket_createdByUserId_fkey') THEN
        ALTER TABLE "BetMarket" ADD CONSTRAINT "BetMarket_createdByUserId_fkey" 
            FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    -- BetSubMarket foreign keys
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BetSubMarket_betMarketId_fkey') THEN
        ALTER TABLE "BetSubMarket" ADD CONSTRAINT "BetSubMarket_betMarketId_fkey" 
            FOREIGN KEY ("betMarketId") REFERENCES "BetMarket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BetSubMarket_createdByUserId_fkey') THEN
        ALTER TABLE "BetSubMarket" ADD CONSTRAINT "BetSubMarket_createdByUserId_fkey" 
            FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    -- BetOption foreign keys
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BetOption_betSubMarketId_fkey') THEN
        ALTER TABLE "BetOption" ADD CONSTRAINT "BetOption_betSubMarketId_fkey" 
            FOREIGN KEY ("betSubMarketId") REFERENCES "BetSubMarket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    -- BetSelection foreign keys
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BetSelection_betSubMarketId_fkey') THEN
        ALTER TABLE "BetSelection" ADD CONSTRAINT "BetSelection_betSubMarketId_fkey" 
            FOREIGN KEY ("betSubMarketId") REFERENCES "BetSubMarket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BetSelection_betOptionId_fkey') THEN
        ALTER TABLE "BetSelection" ADD CONSTRAINT "BetSelection_betOptionId_fkey" 
            FOREIGN KEY ("betOptionId") REFERENCES "BetOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BetSelection_userId_fkey') THEN
        ALTER TABLE "BetSelection" ADD CONSTRAINT "BetSelection_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    -- BetSubMarketSettlement foreign keys
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BetSubMarketSettlement_betSubMarketId_fkey') THEN
        ALTER TABLE "BetSubMarketSettlement" ADD CONSTRAINT "BetSubMarketSettlement_betSubMarketId_fkey" 
            FOREIGN KEY ("betSubMarketId") REFERENCES "BetSubMarket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BetSubMarketSettlement_winningOptionId_fkey') THEN
        ALTER TABLE "BetSubMarketSettlement" ADD CONSTRAINT "BetSubMarketSettlement_winningOptionId_fkey" 
            FOREIGN KEY ("winningOptionId") REFERENCES "BetOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BetSubMarketSettlement_settledByUserId_fkey') THEN
        ALTER TABLE "BetSubMarketSettlement" ADD CONSTRAINT "BetSubMarketSettlement_settledByUserId_fkey" 
            FOREIGN KEY ("settledByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Tilføj indexes (hvis de ikke allerede findes)
CREATE INDEX IF NOT EXISTS "GroupMembership_groupId_idx" ON "GroupMembership"("groupId");
CREATE INDEX IF NOT EXISTS "GroupMembership_userId_idx" ON "GroupMembership"("userId");
CREATE INDEX IF NOT EXISTS "GroupScore_groupId_idx" ON "GroupScore"("groupId");
CREATE INDEX IF NOT EXISTS "GroupScore_userId_idx" ON "GroupScore"("userId");
CREATE INDEX IF NOT EXISTS "BetMarket_groupId_idx" ON "BetMarket"("groupId");
CREATE INDEX IF NOT EXISTS "BetMarket_status_idx" ON "BetMarket"("status");
CREATE INDEX IF NOT EXISTS "BetSubMarket_betMarketId_idx" ON "BetSubMarket"("betMarketId");
CREATE INDEX IF NOT EXISTS "BetSubMarket_status_idx" ON "BetSubMarket"("status");
CREATE INDEX IF NOT EXISTS "BetOption_betSubMarketId_idx" ON "BetOption"("betSubMarketId");
CREATE INDEX IF NOT EXISTS "BetSelection_betSubMarketId_idx" ON "BetSelection"("betSubMarketId");
CREATE INDEX IF NOT EXISTS "BetSelection_userId_idx" ON "BetSelection"("userId");
CREATE INDEX IF NOT EXISTS "BetSelection_betOptionId_idx" ON "BetSelection"("betOptionId");
CREATE INDEX IF NOT EXISTS "BetSubMarketSettlement_betSubMarketId_idx" ON "BetSubMarketSettlement"("betSubMarketId");

