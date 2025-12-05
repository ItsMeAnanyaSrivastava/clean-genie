/**
 * Smart File Organizer Module
 * Categorizes and organizes files by type
 */

import { join, basename } from 'path';
import { getAllFiles, getFileCategory, safeMove, Logger } from '../utils.js';

const logger = new Logger();

/**
 * Organize files in a directory by category
 * @param {string} dirPath - Directory to organize
 * @param {Object} options - Options { dryRun: false }
 * @returns {Promise<Object>} Organization results
 */
export async function organizeFiles(dirPath, options = { dryRun: false }) {
  logger.info(`Starting file organization in: ${dirPath}`);
  
  const files = await getAllFiles(dirPath);
  const snapshot = {
    before: {},
    after: {}
  };
  
  const categories = {
    Documents: [],
    Images: [],
    Videos: [],
    Audio: [],
    Archives: [],
    Code: [],
    Others: []
  };
  
  // Classify all files
  for (const file of files) {
    const category = getFileCategory(file);
    categories[category].push(file);
    snapshot.before[file] = category;
  }
  
  let organized = 0;
  const operations = [];
  
  // Move files to category folders
  for (const [category, categoryFiles] of Object.entries(categories)) {
    if (categoryFiles.length === 0) continue;
    
    const categoryPath = join(dirPath, category);
    
    for (const file of categoryFiles) {
      // Skip if already in category folder
      if (file.includes(join(dirPath, category))) {
        continue;
      }
      
      const fileName = basename(file);
      const destination = join(categoryPath, fileName);
      
      if (!options.dryRun) {
        try {
          const finalPath = await safeMove(file, destination);
          snapshot.after[file] = finalPath;
          operations.push({ from: file, to: finalPath, category });
          organized++;
          logger.info(`Moved: ${file} → ${category}/`);
        } catch (error) {
          logger.error(`Failed to move: ${file}`, error);
        }
      } else {
        operations.push({ from: file, to: destination, category });
        organized++;
      }
    }
  }
  
  const categoryCounts = Object.fromEntries(
    Object.entries(categories).map(([cat, files]) => [cat, files.length])
  );
  
  logger.info(`Organization complete: ${organized} files organized`);
  
  return {
    organized,
    categories: categoryCounts,
    operations,
    snapshot,
    dryRun: options.dryRun
  };
}

/**
 * Generate organization report
 * @param {Object} result - Result from organizeFiles
 * @returns {Object} Report
 */
export function generateOrganizationReport(result) {
  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalOrganized: result.organized,
      dryRun: result.dryRun
    },
    categories: result.categories,
    operations: result.operations.map(op => ({
      file: basename(op.from),
      category: op.category,
      moved: !result.dryRun
    }))
  };
}
