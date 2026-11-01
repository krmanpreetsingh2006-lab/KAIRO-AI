import app from './server-app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  KAIRO AI Backend Relay Engine Initialized`);
  console.log(`  Tagline: Intelligence Beyond Limits.`);
  console.log(`  Port: http://localhost:${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});
