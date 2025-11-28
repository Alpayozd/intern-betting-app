const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPassword() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'alpay@test.com' }
    });

    if (!user) {
      console.log('Bruger ikke fundet');
      return;
    }

    console.log('Bruger fundet:', user.email);
    console.log('Password hash length:', user.passwordHash.length);
    console.log('Password hash starts with:', user.passwordHash.substring(0, 10));

    const isValid = await bcrypt.compare('test123', user.passwordHash);
    console.log('Password match:', isValid);

    // Test med forkert password
    const isInvalid = await bcrypt.compare('forkert', user.passwordHash);
    console.log('Forkert password match:', isInvalid);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword();

