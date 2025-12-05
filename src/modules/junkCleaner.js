/**
 * Junk File Cleaner Module
 * Identifies and removes junk files
 */

import { unlink } from 'fs/promises';
import { extname, basename } from 'path';
import { getAllFiles, getFileStats, getFileSize, formatBytes, Logger } from '../utils.js';

const logger = new Logger();

const JUNK_EXTENSIONS = ['.tmp', '.cache', '.log', '.bak', '.old', '.temp'];
const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024; // 100MB
const STALE_DAYS = 180;

/**
 * Find junk files in directory
 * @param {string} dirPath - Directory to scan
 * @param {Object} options - Options
 * @returns {Promise<Object>} Junk file analysis
 */
export async function findJunk(dirPath, options = {}) {
  logger.info(`Scanning for junk files in: ${dirPath}`);
  
  const files = await getAllFiles(dirPath);
  const junkFiles = {
    temporary: [],
    large: [],
    stale: []
  };
  
  let totalSize = 0;
  const now = Date.now();
  const staleThreshold = STALE_DAYS * 24 * 60 * 60 * 1000;
  
  for (const file of files) {
    const ext = extname(file).toLowerCase();
    const stats = await getFileStats(file);
    
    if (!stats) continue;
    
    // Check for temporary files
    if (JUNK_EXTENSIONS.includes(ext) || basename(file).startsWith('~')) {
      junkFiles.temporary.push({ path: file, size: stats.size });
      totalSize += stats.size;
    }
    
    // Check for large files
    if (stats.size > LARGE_FILE_THRESHOLD) {
      junkFiles.large.push({ path: file, size: stats.size });
    }
    
    // Check for stale files
    const lastAccess = stats.atimeMs;
    if (now - lastAccess > staleThreshold) {
      junkFiles.stale.push({ path: file, size: stats.size, lastAccess: new Date(lastAccess) });
    }
  }
  
  const categories = {
    temporary: junkFiles.temporary.length,
    large: junkFiles.large.length,
    stale: junkFiles.stale.length
  };
  
  logger.info(`Found ${junkFiles.temporary.length} temporary, ${junkFiles.large.length} large, ${junkFiles.stale.length} stale files`);
  
  return {
    junkFiles,
    categories,
    totalSize,
    totalSizeFormatted: formatBytes(totalSize)
  };
}

/**
 * Clean junk files
 * @param {Object} junkFiles - Result from findJunk
 * @param {Object} options - Options { types: ['temporary'] }
 * @returns {Promise<Object>} Cleanup results
 */
export async function cleanJunk(junkFiles, options = { types: ['temporary'] }) {
  logger.info(`Cleaning junk files: ${options.types.join(', ')}`);
  
  let cleaned = 0;
  let freedSpace = 0;
  const deleted = [];
  
  for (const type of options.types) {
    if (!junkFiles[type]) continue;
    
    for (const file of junkFiles[type]) {
      try {
        await unlink(file.path);
        deleted.push(file.path);
        freedSpace += file.size;
        cleaned++;
        logger.info(`Deleted: ${file.path}`);
      } catch (error) {
        logger.error(`Failed to delete: ${file.path}`, error);
      }
    }
  }
  
  logger.info(`Cleaned ${cleaned} files, freed ${formatBytes(freedSpace)}`);
  
  return {
    cleaned,
    freedSpace,
    freedSpaceFormatted: formatBytes(freedSpace),
    deleted
  };
}
