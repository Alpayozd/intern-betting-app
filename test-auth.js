const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAuth() {
  try {
    const email = 'alpay@test.com'.trim().toLowerCase();
    console.log('Looking for email:', email);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });

    console.log('User found:', user ? 'YES' : 'NO');
    
    if (user) {
      console.log('User email in DB:', user.email);
      console.log('Email match:', user.email === email);
      console.log('Email lowercase match:', user.email.toLowerCase() === email);
      
      const isValid = await bcrypt.compare('test123', user.passwordHash);
      console.log('Password valid:', isValid);
    } else {
      // Prøv med original email
      const user2 = await prisma.user.findUnique({
        where: { email: 'alpay@test.com' }
      });
      console.log('User found with original email:', user2 ? 'YES' : 'NO');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();

