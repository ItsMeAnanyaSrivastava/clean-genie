/**
 * Duplicate File Finder Module
 * Identifies duplicate files using SHA-256 hashing
 */

import { unlink } from 'fs/promises';
import { getAllFiles, hashFile, getFileSize, formatBytes, Logger } from '../utils.js';

const logger = new Logger();

/**
 * Find duplicate files in a directory
 * @param {string} dirPath - Directory to scan
 * @param {Object} options - Options { recursive: true }
 * @returns {Promise<Object>} Duplicate groups and stats
 */
export async function findDuplicates(dirPath, options = { recursive: true }) {
  logger.info(`Starting duplicate scan in: ${dirPath}`);
  
  const files = await getAllFiles(dirPath);
  const hashMap = new Map();
  let processed = 0;
  
  // Hash all files and group by hash
  for (const file of files) {
    try {
      const hash = await hashFile(file);
      const size = await getFileSize(file);
      
      if (!hashMap.has(hash)) {
        hashMap.set(hash, []);
      }
      
      hashMap.get(hash).push({ path: file, size });
      processed++;
      
      if (processed % 100 === 0) {
        logger.info(`Processed ${processed}/${files.length} files`);
      }
    } catch (error) {
      logger.error(`Failed to hash file: ${file}`, error);
    }
  }
  
  // Filter to only groups with duplicates (2+ files)
  const duplicateGroups = new Map();
  let totalDuplicates = 0;
  let wastedSpace = 0;
  
  for (const [hash, fileGroup] of hashMap.entries()) {
    if (fileGroup.length > 1) {
      duplicateGroups.set(hash, fileGroup);
      totalDuplicates += fileGroup.length - 1; // Keep one
      wastedSpace += fileGroup[0].size * (fileGroup.length - 1);
    }
  }
  
  const stats = {
    totalFiles: files.length,
    uniqueFiles: hashMap.size,
    duplicateGroups: duplicateGroups.size,
    totalDuplicates,
    wastedSpace,
    wastedSpaceFormatted: formatBytes(wastedSpace)
  };
  
  logger.info(`Scan complete: ${stats.duplicateGroups} duplicate groups found`);
  logger.info(`Wasted space: ${stats.wastedSpaceFormatted}`);
  
  return { duplicateGroups, stats };
}

/**
 * Remove duplicate files, keeping one copy
 * @param {Map} duplicateGroups - Groups from findDuplicates
 * @param {string} keepStrategy - 'first' | 'last' | 'largest'
 * @returns {Promise<Object>} Removal results
 */
export async function removeDuplicates(duplicateGroups, keepStrategy = 'first') {
  logger.info(`Removing duplicates with strategy: ${keepStrategy}`);
  
  const removed = [];
  const kept = [];
  let savedSpace = 0;
  
  for (const [hash, fileGroup] of duplicateGroups.entries()) {
    // Determine which file to keep
    let keepIndex = 0;
    
    if (keepStrategy === 'last') {
      keepIndex = fileGroup.length - 1;
    } else if (keepStrategy === 'largest') {
      keepIndex = fileGroup.reduce((maxIdx, file, idx, arr) => 
        file.size > arr[maxIdx].size ? idx : maxIdx, 0);
    }
    
    kept.push(fileGroup[keepIndex].path);
    
    // Remove all others
    for (let i = 0; i < fileGroup.length; i++) {
      if (i !== keepIndex) {
        try {
          await unlink(fileGroup[i].path);
          removed.push(fileGroup[i].path);
          savedSpace += fileGroup[i].size;
          logger.info(`Removed duplicate: ${fileGroup[i].path}`);
        } catch (error) {
          logger.error(`Failed to remove: ${fileGroup[i].path}`, error);
        }
      }
    }
  }
  
  logger.info(`Removed ${removed.length} duplicates, saved ${formatBytes(savedSpace)}`);
  
  return {
    removed,
    kept,
    savedSpace,
    savedSpaceFormatted: formatBytes(savedSpace)
  };
}

/**
 * Generate duplicate report in JSON format
 * @param {Map} duplicateGroups - Duplicate groups
 * @returns {Object} JSON report
 */
export function generateDuplicateReport(duplicateGroups) {
  const report = {
    timestamp: new Date().toISOString(),
    duplicateGroups: []
  };
  
  for (const [hash, fileGroup] of duplicateGroups.entries()) {
    report.duplicateGroups.push({
      hash: hash.substring(0, 16) + '...',
      count: fileGroup.length,
      size: fileGroup[0].size,
      sizeFormatted: formatBytes(fileGroup[0].size),
      files: fileGroup.map(f => f.path)
    });
  }
  
  return report;
}
