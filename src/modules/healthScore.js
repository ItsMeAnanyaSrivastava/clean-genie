/**
 * Health Score Module
 * Calculates directory health metrics
 */

import { findDuplicates } from './duplicates.js';
import { findJunk } from './junkCleaner.js';
import { getAllFiles, getFileSize, Logger } from '../utils.js';

const logger = new Logger();

/**
 * Calculate directory health score
 * @param {string} dirPath - Directory to analyze
 * @returns {Promise<Object>} Health metrics
 */
export async function calculateHealth(dirPath) {
  logger.info(`Calculating health score for: ${dirPath}`);
  
  // Get all files and total size
  const files = await getAllFiles(dirPath);
  let totalSize = 0;
  
  for (const file of files) {
    totalSize += await getFileSize(file);
  }
  
  // Find duplicates
  const { stats: dupStats } = await findDuplicates(dirPath);
  
  // Find junk
  const junkResult = await findJunk(dirPath);
  
  // Calculate scores
  const duplicateScore = totalSize > 0 
    ? Math.max(0, 100 - (dupStats.wastedSpace / totalSize * 100))
    : 100;
  
  const junkScore = totalSize > 0
    ? Math.max(0, 100 - (junkResult.totalSize / totalSize * 100))
    : 100;
  
  // Organization score (simplified: check if files are in subdirectories)
  const organizedFiles = files.filter(f => f.split(/[/\\]/).length > 2).length;
  const organizationScore = files.length > 0
    ? (organizedFiles / files.length * 100)
    : 100;
  
  const overallScore = Math.round((duplicateScore + junkScore + organizationScore) / 3);
  
  // Generate recommendations
  const recommendations = [];
  
  if (duplicateScore < 80) {
    recommendations.push(`Remove ${dupStats.totalDuplicates} duplicate files to save ${dupStats.wastedSpaceFormatted}`);
  }
  
  if (junkScore < 80) {
    recommendations.push(`Clean ${junkResult.categories.temporary} temporary files to free ${junkResult.totalSizeFormatted}`);
  }
  
  if (organizationScore < 60) {
    recommendations.push('Organize files into category folders for better structure');
  }
  
  if (overallScore >= 90) {
    recommendations.push('Your directory is in excellent health!');
  }
  
  logger.info(`Health score: ${overallScore}/100`);
  
  return {
    overallScore,
    duplicateScore: Math.round(duplicateScore),
    junkScore: Math.round(junkScore),
    organizationScore: Math.round(organizationScore),
    recommendations,
    details: {
      totalFiles: files.length,
      totalSize,
      duplicates: dupStats.totalDuplicates,
      junkFiles: junkResult.categories.temporary
    }
  };
}
