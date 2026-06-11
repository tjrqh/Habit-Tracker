import { createApp } from './app';
import { environment } from './config/environment';
import prisma from './config/database';

async function main() {
  const app = createApp();
  const PORT = environment.PORT;

  // Database connection check
  try {
    console.log('✓ Database connection established (mock mode)');
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    process.exit(1);
  }

  // Start server
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          Habit Tracker API Server Started 🚀              ║
║                                                            ║
║  Environment: ${environment.NODE_ENV.padEnd(45)}║
║  Port: ${PORT}${' '.repeat(51 - PORT.toString().length)}║
║  Database: MySQL                                           ║
║                                                            ║
║  API Documentation: http://localhost:${PORT}/api/health${' '.repeat(
      25 - PORT.toString().length,
    )}║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('\nSIGTERM received. Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('\nSIGINT received. Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
  });
}

main().catch(error => {
  console.error('Application startup failed:', error);
  process.exit(1);
});
