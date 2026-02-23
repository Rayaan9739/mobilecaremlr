
const prisma = require('./src/utils/prisma');
const fs = require('fs');

async function diagnose() {
  const logFile = 'diagnosis.log';
  const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
  };

  try {
    log('Starting diagnosis...');
    
    if (!prisma) {
      log('❌ Prisma instance is null/undefined!');
      return;
    }

    if (!prisma.category) {
      log('❌ Prisma.category is undefined! (Did you run npx prisma generate?)');
      log('Available models: ' + Object.keys(prisma).join(', '));
      return;
    }

    log('✅ Prisma.category exists.');
    log('Attempting to fetch categories...');

    const categories = await prisma.category.findMany();
    log(`✅ Request success. Found ${categories.length} categories.`);
    log('Categories: ' + JSON.stringify(categories, null, 2));

  } catch (err) {
    log('❌ Error occurred:');
    log(err.message);
    log(err.stack);
  } finally {
    await prisma.$disconnect();
    log('Diagnosis complete.');
  }
}

diagnose();
