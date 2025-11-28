-- Prisma Schema SQL Migration for Supabase
-- Kør denne SQL i Supabase SQL Editor

-- Opret enums først
CREATE TYPE "GroupRole" AS ENUM ('ADMIN', 'MEMBER');
CREATE TYPE "BetMarketStatus" AS ENUM ('OPEN', 'CLOSED', 'SETTLED');

-- Opret User tabel
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Opret Group tabel
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "inviteCode" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- Opret GroupMembership tabel
CREATE TABLE "GroupMembership" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMembership_pkey" PRIMARY KEY ("id")
);

-- Opret BetMarket tabel
CREATE TABLE "BetMarket" (
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

-- Opret BetOption tabel
CREATE TABLE "BetOption" (
    "id" TEXT NOT NULL,
    "betMarketId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "odds" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetOption_pkey" PRIMARY KEY ("id")
);

-- Opret BetSelection tabel
CREATE TABLE "BetSelection" (
    "id" TEXT NOT NULL,
    "betMarketId" TEXT NOT NULL,
    "betOptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stakePoints" INTEGER NOT NULL,
    "potentialPayoutPoints" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetSelection_pkey" PRIMARY KEY ("id")
);

-- Opret BetSettlement tabel
CREATE TABLE "BetSettlement" (
    "id" TEXT NOT NULL,
    "betMarketId" TEXT NOT NULL,
    "winningOptionId" TEXT NOT NULL,
    "settledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledByUserId" TEXT NOT NULL,

    CONSTRAINT "BetSettlement_pkey" PRIMARY KEY ("id")
);

-- Opret GroupScore tabel
CREATE TABLE "GroupScore" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 1000,
    "initialPoints" INTEGER NOT NULL DEFAULT 1000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupScore_pkey" PRIMARY KEY ("id")
);

-- Tilføj foreign keys
ALTER TABLE "Group" ADD CONSTRAINT "Group_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BetMarket" ADD CONSTRAINT "BetMarket_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BetMarket" ADD CONSTRAINT "BetMarket_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BetOption" ADD CONSTRAINT "BetOption_betMarketId_fkey" FOREIGN KEY ("betMarketId") REFERENCES "BetMarket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BetSelection" ADD CONSTRAINT "BetSelection_betMarketId_fkey" FOREIGN KEY ("betMarketId") REFERENCES "BetMarket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BetSelection" ADD CONSTRAINT "BetSelection_betOptionId_fkey" FOREIGN KEY ("betOptionId") REFERENCES "BetOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BetSelection" ADD CONSTRAINT "BetSelection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BetSettlement" ADD CONSTRAINT "BetSettlement_betMarketId_fkey" FOREIGN KEY ("betMarketId") REFERENCES "BetMarket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BetSettlement" ADD CONSTRAINT "BetSettlement_winningOptionId_fkey" FOREIGN KEY ("winningOptionId") REFERENCES "BetOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BetSettlement" ADD CONSTRAINT "BetSettlement_settledByUserId_fkey" FOREIGN KEY ("settledByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GroupScore" ADD CONSTRAINT "GroupScore_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupScore" ADD CONSTRAINT "GroupScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tilføj unique constraints
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Group_inviteCode_key" ON "Group"("inviteCode");
CREATE UNIQUE INDEX "GroupMembership_groupId_userId_key" ON "GroupMembership"("groupId", "userId");
CREATE UNIQUE INDEX "BetSettlement_betMarketId_key" ON "BetSettlement"("betMarketId");
CREATE UNIQUE INDEX "GroupScore_groupId_userId_key" ON "GroupScore"("groupId", "userId");

-- Tilføj indexes
CREATE INDEX "GroupMembership_groupId_idx" ON "GroupMembership"("groupId");
CREATE INDEX "GroupMembership_userId_idx" ON "GroupMembership"("userId");
CREATE INDEX "BetMarket_groupId_idx" ON "BetMarket"("groupId");
CREATE INDEX "BetMarket_status_idx" ON "BetMarket"("status");
CREATE INDEX "BetOption_betMarketId_idx" ON "BetOption"("betMarketId");
CREATE INDEX "BetSelection_betMarketId_idx" ON "BetSelection"("betMarketId");
CREATE INDEX "BetSelection_userId_idx" ON "BetSelection"("userId");
CREATE INDEX "BetSelection_betOptionId_idx" ON "BetSelection"("betOptionId");
CREATE INDEX "BetSettlement_betMarketId_idx" ON "BetSettlement"("betMarketId");
CREATE INDEX "GroupScore_groupId_idx" ON "GroupScore"("groupId");
CREATE INDEX "GroupScore_userId_idx" ON "GroupScore"("userId");

