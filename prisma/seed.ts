import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '../../.env' });

const prisma = new PrismaClient();

async function main() {
  console.log('Connection to database successful!');
  // Test the connection by querying the database
  const userCount = await prisma.user.count();
  console.log(`There are ${userCount} users in the database.`);
}

main()
  .catch((e) => {
    console.error('Error connecting to the database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
