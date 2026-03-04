const app = require('./server-bundle.cjs');

// Handle potential .default wrapper from esbuild ESM->CJS conversion
const exportedApp = app.default || app;

/**
 * Vercel Serverless Function entry point
 */
module.exports = exportedApp;
