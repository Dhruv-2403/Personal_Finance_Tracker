const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  adapter: process.env.DATABASE_URL,
});

async function testConnection() {
    try {
        await prisma.$connect();
        console.log('Connected to PostgreSQL database via Prisma');
    } catch (error) {
        console.error('Failed to connect to database:', error);
        process.exit(1);
    }
}

testConnection();

module.exports = prisma;
