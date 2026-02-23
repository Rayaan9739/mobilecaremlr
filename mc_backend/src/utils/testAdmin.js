const { ensureAdminExists } = require('./ensureAdmin');

async function test() {
  console.log('Testing admin creation...');
  await ensureAdminExists();
  console.log('Test completed.');
  process.exit(0);
}

test().catch(console.error);