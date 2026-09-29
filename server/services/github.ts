import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { extractZipSafely } from './archive.ts';

const execFileAsync = promisify(execFile);

export interface GitHubRepoInfo {
  owner: string;
  name: string;
  branch: string;
  url: string;
}

export function parseGitHubUrl(url: string): GitHubRepoInfo | null {
  const cleaned = url.trim().replace(/\.git$/, '');
  const match = cleaned.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?/);
  if (!match) return null;

  return {
    owner: match[1],
    name: match[2],
    branch: match[3] || 'main',
    url: cleaned
  };
}

export async function fetchGitHubRepository(
  repoUrl: string,
  destWorkspaceDir: string
): Promise<{ extractedPath: string; repoInfo: GitHubRepoInfo; fileCount: number }> {
  const repoInfo = parseGitHubUrl(repoUrl);
  if (!repoInfo) {
    throw new Error(`Invalid GitHub repository URL: ${repoUrl}`);
  }

  if (!fs.existsSync(destWorkspaceDir)) {
    fs.mkdirSync(destWorkspaceDir, { recursive: true });
  }

  // Attempt 1: Fast git clone --depth 1
  try {
    const cloneDest = path.join(destWorkspaceDir, repoInfo.name);
    await execFileAsync('git', ['clone', '--depth', '1', repoUrl, cloneDest], { timeout: 30000 });
    
    // Count files
    const files = fs.readdirSync(cloneDest, { recursive: true }) as string[];
    return {
      extractedPath: cloneDest,
      repoInfo,
      fileCount: files.length
    };
  } catch (gitErr) {
    console.warn('git clone failed or timed out, attempting zip archive download:', gitErr);
  }

  // Attempt 2: Direct zipball download via GitHub HTTP
  const zipUrl = `https://github.com/${repoInfo.owner}/${repoInfo.name}/archive/refs/heads/${repoInfo.branch}.zip`;
  const tempZip = path.join(destWorkspaceDir, `${repoInfo.name}.zip`);

  const response = await fetch(zipUrl);
  if (!response.ok) {
    // Try 'master' branch fallback
    const fallbackResponse = await fetch(`https://github.com/${repoInfo.owner}/${repoInfo.name}/archive/refs/heads/master.zip`);
    if (!fallbackResponse.ok) {
      throw new Error(`Failed to fetch GitHub repository from ${zipUrl}: ${response.statusText}`);
    }
    const buffer = Buffer.from(await fallbackResponse.arrayBuffer());
    fs.writeFileSync(tempZip, buffer);
    repoInfo.branch = 'master';
  } else {
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(tempZip, buffer);
  }

  const { extractedPath, fileCount } = extractZipSafely(tempZip, destWorkspaceDir);
  try {
    fs.unlinkSync(tempZip);
  } catch {}

  return { extractedPath, repoInfo, fileCount };
}
