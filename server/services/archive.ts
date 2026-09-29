import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

export function extractZipSafely(zipFilePath: string, destDir: string): { extractedPath: string; fileCount: number } {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const zip = new AdmZip(zipFilePath);
  const zipEntries = zip.getEntries();
  let extractedCount = 0;

  for (const entry of zipEntries) {
    if (entry.isDirectory) continue;

    // Zip-Slip Path Traversal Protection
    const sanitizedEntryPath = path.normalize(entry.entryName).replace(/^(\.\.[\/\\])+/, '');
    const fullDestPath = path.join(destDir, sanitizedEntryPath);

    if (!fullDestPath.startsWith(path.resolve(destDir))) {
      console.warn(`Blocked potentially malicious Zip-Slip entry: ${entry.entryName}`);
      continue;
    }

    const entryDir = path.dirname(fullDestPath);
    if (!fs.existsSync(entryDir)) {
      fs.mkdirSync(entryDir, { recursive: true });
    }

    fs.writeFileSync(fullDestPath, entry.getData());
    extractedCount++;
  }

  // Check if there is a single top-level directory and adjust path
  const topLevelItems = fs.readdirSync(destDir);
  let effectivePath = destDir;
  if (topLevelItems.length === 1) {
    const singleItem = path.join(destDir, topLevelItems[0]);
    if (fs.statSync(singleItem).isDirectory()) {
      effectivePath = singleItem;
    }
  }

  return { extractedPath: effectivePath, fileCount: extractedCount };
}
