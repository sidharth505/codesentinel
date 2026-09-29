import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { CONFIG } from './config.ts';
import analyzeRouter from './routes/analyze.ts';
import repositoriesRouter from './routes/repositories.ts';
import reportsRouter from './routes/reports.ts';
import findingsRouter from './routes/findings.ts';

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logger
app.use((req, _res, next) => {
  if (!req.path.startsWith('/api/analyze/stream')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'CodeSentinel API',
    version: '2.4.0',
    geminiEnabled: Boolean(CONFIG.GEMINI_API_KEY && CONFIG.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    workspacesDir: CONFIG.WORKSPACES_DIR,
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api/analyze', analyzeRouter);
app.use('/api/repositories', repositoriesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/findings', findingsRouter);

// Serve frontend build if dist exists
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start HTTP server
const server = app.listen(CONFIG.PORT, CONFIG.HOST, () => {
  console.log(`=================================================`);
  console.log(`🛡️  CodeSentinel Backend Server running`);
  console.log(`📡 URL: http://${CONFIG.HOST}:${CONFIG.PORT}`);
  console.log(`Gemini AI: ${CONFIG.GEMINI_API_KEY ? 'Configured' : 'Disabled'}`);
  console.log(`=================================================`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default app;
