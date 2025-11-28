import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starter seed...")

  // Opret test brugere
  const passwordHash = await bcrypt.hash("test123", 10)

  const user1 = await prisma.user.upsert({
    where: { email: "alpay@test.com" },
    update: {},
    create: {
      name: "Alpay",
      email: "alpay@test.com",
      passwordHash,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: "jonas@test.com" },
    update: {},
    create: {
      name: "Jonas",
      email: "jonas@test.com",
      passwordHash,
    },
  })

  const user3 = await prisma.user.upsert({
    where: { email: "mehmet@test.com" },
    update: {},
    create: {
      name: "Mehmet",
      email: "mehmet@test.com",
      passwordHash,
    },
  })

  console.log("✅ Brugere oprettet")

  // Opret test gruppe
  const group = await prisma.group.upsert({
    where: { inviteCode: "SUSHI123" },
    update: {},
    create: {
      name: "Sushi-challenge",
      description: "Gruppe til at bette på sushi-udfordringer",
      inviteCode: "SUSHI123",
      createdByUserId: user1.id,
      memberships: {
        create: [
          {
            userId: user1.id,
            role: "ADMIN",
          },
          {
            userId: user2.id,
            role: "MEMBER",
          },
          {
            userId: user3.id,
            role: "MEMBER",
          },
        ],
      },
      groupScores: {
        create: [
          {
            userId: user1.id,
            totalPoints: 1000,
            initialPoints: 1000,
          },
          {
            userId: user2.id,
            totalPoints: 1000,
            initialPoints: 1000,
          },
          {
            userId: user3.id,
            totalPoints: 1000,
            initialPoints: 1000,
          },
        ],
      },
    },
    include: {
      memberships: true,
      groupScores: true,
    },
  })

  console.log("✅ Gruppe oprettet:", group.name)

  // Opret test bet market (åbent)
  const closesAt = new Date()
  closesAt.setHours(closesAt.getHours() + 24) // Lukker om 24 timer

  const betMarket1 = await prisma.betMarket.create({
    data: {
      groupId: group.id,
      title: "Hvem spiser flest stykker sushi i aften?",
      description: "Bettet afgøres efter måltidet. Den der spiser flest stykker vinder.",
      status: "OPEN",
      createdByUserId: user1.id,
      closesAt,
      betOptions: {
        create: [
          {
            label: "Alpay",
            odds: 1.80,
          },
          {
            label: "Jonas",
            odds: 2.25,
          },
          {
            label: "Mehmet",
            odds: 3.10,
          },
        ],
      },
    },
    include: {
      betOptions: true,
    },
  })

  console.log("✅ Bet market oprettet:", betMarket1.title)

  // Opret test bet market (afgjort)
  const betMarket2 = await prisma.betMarket.create({
    data: {
      groupId: group.id,
      title: "Hvem kommer først til restauranten?",
      description: "Første person der ankommer vinder.",
      status: "SETTLED",
      createdByUserId: user1.id,
      closesAt: new Date(Date.now() - 3600000), // Lukket for 1 time siden
      betOptions: {
        create: [
          {
            label: "Alpay",
            odds: 2.00,
          },
          {
            label: "Jonas",
            odds: 1.75,
          },
          {
            label: "Mehmet",
            odds: 2.50,
          },
        ],
      },
    },
    include: {
      betOptions: true,
    },
  })

  // Opret settlement for betMarket2
  const winningOption = betMarket2.betOptions[0] // Alpay vandt
  await prisma.betSettlement.create({
    data: {
      betMarketId: betMarket2.id,
      winningOptionId: winningOption.id,
      settledByUserId: user1.id,
    },
  })

  // Opret nogle test bets på betMarket2
  const bet1 = await prisma.betSelection.create({
    data: {
      betMarketId: betMarket2.id,
      betOptionId: winningOption.id, // Vinder!
      userId: user1.id,
      stakePoints: 100,
      potentialPayoutPoints: 200,
    },
  })

  // Opdater point saldo for user1 (har vundet)
  await prisma.groupScore.update({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId: user1.id,
      },
    },
    data: {
      totalPoints: {
        increment: 200, // Payout
      },
    },
  })

  const bet2 = await prisma.betSelection.create({
    data: {
      betMarketId: betMarket2.id,
      betOptionId: betMarket2.betOptions[1].id, // Taber
      userId: user2.id,
      stakePoints: 50,
      potentialPayoutPoints: 87.5,
    },
  })

  // Opdater point saldo for user2 (har tabt - stake allerede trukket)
  await prisma.groupScore.update({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId: user2.id,
      },
    },
    data: {
      totalPoints: {
        decrement: 50, // Stake trukket
      },
    },
  })

  console.log("✅ Test bets oprettet")
  console.log("✅ Seed færdig!")

  console.log("\n📋 Login oplysninger:")
  console.log("Email: alpay@test.com | Password: test123")
  console.log("Email: jonas@test.com | Password: test123")
  console.log("Email: mehmet@test.com | Password: test123")
  console.log("\n🎲 Test gruppe invite code: SUSHI123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

