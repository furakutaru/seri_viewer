import app from './_server.js';

/**
 * Vercel Serverless Function entry point.
 * Imports the bundled server logic from _server.js (generated during build).
 */
export default (req, res) => {
    return app(req, res);
};
