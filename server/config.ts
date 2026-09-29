import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Try loading .env.local first, then fallback to .env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  HOST: process.env.HOST || '0.0.0.0',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  WORKSPACES_DIR: path.resolve(process.cwd(), 'scratch', 'workspaces'),
  STORAGE_DIR: path.resolve(process.cwd(), 'server', 'data'),
  MAX_UPLOAD_SIZE_MB: 50,
  PYTHON_BIN: process.env.PYTHON_BIN || 'python3'
};

// Ensure critical directories exist
if (!fs.existsSync(CONFIG.WORKSPACES_DIR)) {
  fs.mkdirSync(CONFIG.WORKSPACES_DIR, { recursive: true });
}
if (!fs.existsSync(CONFIG.STORAGE_DIR)) {
  fs.mkdirSync(CONFIG.STORAGE_DIR, { recursive: true });
}
