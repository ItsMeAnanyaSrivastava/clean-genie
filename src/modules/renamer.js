/**
 * Smart File Renamer Module
 * Applies intelligent renaming patterns to files
 */

import { basename, extname, join, dirname } from 'path';
import { rename } from 'fs/promises';
import { getAllFiles, cleanFilename, Logger } from '../utils.js';

const logger = new Logger();

/**
 * Rename files based on pattern
 * @param {string} dirPath - Directory containing files
 * @param {string} pattern - Renaming pattern
 * @param {Object} options - Options { dryRun: false }
 * @returns {Promise<Object>} Rename results
 */
export async function renameFiles(dirPath, pattern, options = { dryRun: false }) {
  logger.info(`Starting rename with pattern: ${pattern}`);
  
  const files = await getAllFiles(dirPath);
  const operations = [];
  let renamed = 0;
  
  for (const file of files) {
    const oldName = basename(file);
    const ext = extname(file);
    const dir = dirname(file);
    let newName;
    
    // Apply pattern
    switch (pattern) {
      case 'clean':
        newName = cleanFilename(oldName);
        break;
      
      case 'date-prefix':
        const date = new Date().toISOString().split('T')[0];
        newName = `${date}_${oldName}`;
        break;
      
      case 'sequential':
        newName = `file_${String(renamed + 1).padStart(4, '0')}${ext}`;
        break;
      
      case 'lowercase':
        newName = oldName.toLowerCase();
        break;
      
      default:
        newName = oldName;
    }
    
    // Skip if no change
    if (newName === oldName) continue;
    
    const newPath = join(dir, newName);
    
    operations.push({
      from: file,
      to: newPath,
      oldName,
      newName
    });
    
    if (!options.dryRun) {
      try {
        await rename(file, newPath);
        renamed++;
        logger.info(`Renamed: ${oldName} → ${newName}`);
      } catch (error) {
        logger.error(`Failed to rename: ${oldName}`, error);
      }
    } else {
      renamed++;
    }
  }
  
  logger.info(`Rename complete: ${renamed} files renamed`);
  
  return {
    renamed,
    operations,
    dryRun: options.dryRun
  };
}
