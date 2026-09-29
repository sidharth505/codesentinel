import { spawn } from 'child_process';
import path from 'path';
import { CONFIG } from '../config.ts';

export interface ASTAnalysisOutput {
  overallScore: {
    debtScore: number;
    maxScore: number;
    severity: 'high' | 'medium' | 'low';
    severityLabel: string;
    patternCount: number;
    summary: string;
  };
  categories: any[];
  findings: any[];
  metrics: any;
  architecture: {
    nodes: any[];
    edges: any[];
  };
  error?: string;
}

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function runASTAnalysis(targetDirectory: string): Promise<ASTAnalysisOutput> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, 'ast_analyzer.py');

    const pythonProcess = spawn(CONFIG.PYTHON_BIN, [scriptPath, targetDirectory], {
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0 && !stdoutData.trim()) {
        return reject(new Error(`AST analyzer exited with code ${code}: ${stderrData}`));
      }

      try {
        const parsed = JSON.parse(stdoutData.trim());
        if (parsed.error) {
          return reject(new Error(parsed.error));
        }
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Failed to parse AST output JSON: ${err}. Raw output was: ${stdoutData.slice(0, 300)}`));
      }
    });

    pythonProcess.on('error', (err) => {
      reject(new Error(`Failed to spawn Python process: ${err.message}`));
    });
  });
}
