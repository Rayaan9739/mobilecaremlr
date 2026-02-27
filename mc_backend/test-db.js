// Use the same prisma instance as the server
const prisma = require('./src/utils/prisma');

async function test() {
  try {
    const count = await prisma.user.count();
    console.log('User count:', count);
    
    const users = await prisma.user.findMany({ take: 5 });
    console.log('Users:', JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
