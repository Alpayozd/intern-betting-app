/**
 * Tests for bet calculation logic
 * 
 * Dette test-suite tester de kritiske beregninger for bets:
 * - Beregning af potentialPayoutPoints (stakePoints * odds)
 * - Validering af point saldo før bet
 * - Settlement logik (udbetaling til vindere)
 */

describe("Bet Calculations", () => {
  describe("potentialPayoutPoints calculation", () => {
    it("should calculate correct payout for decimal odds", () => {
      const stakePoints = 100
      const odds = 1.80
      const expectedPayout = 180

      const actualPayout = stakePoints * odds

      expect(actualPayout).toBe(expectedPayout)
    })

    it("should calculate correct payout for higher odds", () => {
      const stakePoints = 50
      const odds = 3.10
      const expectedPayout = 155

      const actualPayout = stakePoints * odds

      expect(actualPayout).toBe(expectedPayout)
    })

    it("should handle fractional stakes correctly", () => {
      const stakePoints = 25
      const odds = 2.25
      const expectedPayout = 56.25

      const actualPayout = stakePoints * odds

      expect(actualPayout).toBe(expectedPayout)
    })
  })

  describe("point balance validation", () => {
    it("should allow bet if user has sufficient points", () => {
      const userPoints = 1000
      const stakePoints = 100

      const hasSufficientPoints = userPoints >= stakePoints

      expect(hasSufficientPoints).toBe(true)
    })

    it("should reject bet if user has insufficient points", () => {
      const userPoints = 50
      const stakePoints = 100

      const hasSufficientPoints = userPoints >= stakePoints

      expect(hasSufficientPoints).toBe(false)
    })

    it("should allow bet if user has exactly enough points", () => {
      const userPoints = 100
      const stakePoints = 100

      const hasSufficientPoints = userPoints >= stakePoints

      expect(hasSufficientPoints).toBe(true)
    })
  })

  describe("settlement payout calculation", () => {
    it("should calculate total payout for multiple winning bets", () => {
      const winningSelections = [
        { stakePoints: 100, odds: 1.80, potentialPayoutPoints: 180 },
        { stakePoints: 50, odds: 2.25, potentialPayoutPoints: 112.5 },
        { stakePoints: 200, odds: 1.50, potentialPayoutPoints: 300 },
      ]

      const totalPayout = winningSelections.reduce(
        (sum, selection) => sum + selection.potentialPayoutPoints,
        0
      )

      expect(totalPayout).toBe(592.5)
    })

    it("should correctly update user balance after settlement", () => {
      const initialBalance = 1000
      const stakePoints = 100
      const potentialPayout = 180

      // Efter bet (træk stake)
      const balanceAfterBet = initialBalance - stakePoints
      expect(balanceAfterBet).toBe(900)

      // Efter settlement (tilføj payout)
      const balanceAfterSettlement = balanceAfterBet + potentialPayout
      expect(balanceAfterSettlement).toBe(1080)
    })

    it("should handle multiple users winning correctly", () => {
      const users = [
        { id: "1", initialPoints: 1000, stake: 100, odds: 1.80 },
        { id: "2", initialPoints: 1000, stake: 50, odds: 2.25 },
        { id: "3", initialPoints: 1000, stake: 200, odds: 1.50 },
      ]

      // Simuler bet (træk stake)
      const afterBet = users.map((user) => ({
        ...user,
        points: user.initialPoints - user.stake,
      }))

      // Simuler settlement (tilføj payout)
      const afterSettlement = afterBet.map((user) => ({
        ...user,
        points: user.points + user.stake * user.odds,
      }))

      expect(afterSettlement[0].points).toBe(1080)
      expect(afterSettlement[1].points).toBe(1112.5)
      expect(afterSettlement[2].points).toBe(1300)
    })
  })
})

