/**
 * One-Click Clean Module
 * Executes full cleanup pipeline
 */

import { calculateHealth } from './healthScore.js';
import { findDuplicates, removeDuplicates } from './duplicates.js';
import { organizeFiles } from './organizer.js';
import { renameFiles } from './renamer.js';
import { findJunk, cleanJunk } from './junkCleaner.js';
import { Logger } from '../utils.js';

const logger = new Logger();

/**
 * Execute one-click cleanup
 * @param {string} dirPath - Directory to clean
 * @param {Object} options - Options { dryRun: false }
 * @returns {Promise<Object>} Complete cleanup results
 */
export async function oneClickClean(dirPath, options = { dryRun: false }) {
  logger.info(`Starting one-click cleanup for: ${dirPath}`);
  
  const stages = [];
  const startTime = Date.now();
  
  try {
    // Stage 1: Initial health check
    logger.info('Stage 1: Calculating initial health...');
    const beforeHealth = await calculateHealth(dirPath);
    stages.push({ stage: 'initial-health', status: 'complete', result: beforeHealth });
    
    // Stage 2: Find and remove duplicates
    logger.info('Stage 2: Finding duplicates...');
    const { duplicateGroups, stats } = await findDuplicates(dirPath);
    stages.push({ stage: 'find-duplicates', status: 'complete', result: stats });
    
    if (duplicateGroups.size > 0 && !options.dryRun) {
      logger.info('Stage 2b: Removing duplicates...');
      const dupResult = await removeDuplicates(duplicateGroups);
      stages.push({ stage: 'remove-duplicates', status: 'complete', result: dupResult });
    }
    
    // Stage 3: Organize files
    logger.info('Stage 3: Organizing files...');
    const orgResult = await organizeFiles(dirPath, { dryRun: options.dryRun });
    stages.push({ stage: 'organize', status: 'complete', result: orgResult });
    
    // Stage 4: Rename files
    logger.info('Stage 4: Cleaning filenames...');
    const renameResult = await renameFiles(dirPath, 'clean', { dryRun: options.dryRun });
    stages.push({ stage: 'rename', status: 'complete', result: renameResult });
    
    // Stage 5: Find and clean junk
    logger.info('Stage 5: Finding junk files...');
    const junkResult = await findJunk(dirPath);
    stages.push({ stage: 'find-junk', status: 'complete', result: junkResult });
    
    if (junkResult.categories.temporary > 0 && !options.dryRun) {
      logger.info('Stage 5b: Cleaning junk...');
      const cleanResult = await cleanJunk(junkResult.junkFiles, { types: ['temporary'] });
      stages.push({ stage: 'clean-junk', status: 'complete', result: cleanResult });
    }
    
    // Stage 6: Final health check
    logger.info('Stage 6: Calculating final health...');
    const afterHealth = await calculateHealth(dirPath);
    stages.push({ stage: 'final-health', status: 'complete', result: afterHealth });
    
    const duration = Date.now() - startTime;
    
    logger.info(`One-click cleanup complete in ${duration}ms`);
    
    return {
      success: true,
      stages,
      beforeHealth: beforeHealth.overallScore,
      afterHealth: afterHealth.overallScore,
      improvement: afterHealth.overallScore - beforeHealth.overallScore,
      duration,
      dryRun: options.dryRun,
      finalReport: generateFinalReport(stages, beforeHealth, afterHealth)
    };
    
  } catch (error) {
    logger.error('One-click cleanup failed', error);
    return {
      success: false,
      error: error.message,
      stages
    };
  }
}

/**
 * Generate comprehensive final report
 * @param {Array} stages - Execution stages
 * @param {Object} beforeHealth - Initial health
 * @param {Object} afterHealth - Final health
 * @returns {Object} Report
 */
function generateFinalReport(stages, beforeHealth, afterHealth) {
  return {
    timestamp: new Date().toISOString(),
    summary: {
      healthImprovement: `${beforeHealth.overallScore} → ${afterHealth.overallScore}`,
      stagesCompleted: stages.length,
      recommendations: afterHealth.recommendations
    },
    stages: stages.map(s => ({
      stage: s.stage,
      status: s.status
    }))
  };
}
