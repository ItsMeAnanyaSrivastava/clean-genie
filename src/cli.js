#!/usr/bin/env node

/**
 * CleanGenie CLI
 * Command-line interface for digital cleaning operations
 */

import { Command } from 'commander';
import { resolve } from 'path';
import { findDuplicates, removeDuplicates, generateDuplicateReport } from './modules/duplicates.js';
import { organizeFiles, generateOrganizationReport } from './modules/organizer.js';
import { renameFiles } from './modules/renamer.js';
import { findJunk, cleanJunk } from './modules/junkCleaner.js';
import { calculateHealth } from './modules/healthScore.js';
import { oneClickClean } from './modules/oneClick.js';

const program = new Command();

program
  .name('clean-genie')
  .description('AI-Powered Digital Cleaning Assistant')
  .version('1.0.0');

// Scan command
program
  .command('scan')
  .description('Scan directory for issues')
  .argument('<path>', 'Directory to scan')
  .action(async (path) => {
    const dirPath = resolve(path);
    console.log(`\n🔍 Scanning: ${dirPath}\n`);
    
    const health = await calculateHealth(dirPath);
    
    console.log(`📊 Health Score: ${health.overallScore}/100\n`);
    console.log(`   Duplicates: ${health.duplicateScore}/100`);
    console.log(`   Junk: ${health.junkScore}/100`);
    console.log(`   Organization: ${health.organizationScore}/100\n`);
    
    if (health.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      health.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }
    
    console.log();
  });

// Organize command
program
  .command('organize')
  .description('Organize files by category')
  .argument('<path>', 'Directory to organize')
  .option('--dry-run', 'Preview without making changes')
  .action(async (path, options) => {
    const dirPath = resolve(path);
    console.log(`\n📁 Organizing: ${dirPath}\n`);
    
    const result = await organizeFiles(dirPath, { dryRun: options.dryRun });
    
    console.log(`✅ Organized ${result.organized} files\n`);
    console.log('Categories:');
    Object.entries(result.categories).forEach(([cat, count]) => {
      if (count > 0) console.log(`   ${cat}: ${count} files`);
    });
    
    if (options.dryRun) {
      console.log('\n⚠️  Dry run - no changes made');
    }
    
    console.log();
  });

// Rename command
program
  .command('rename')
  .description('Rename files with pattern')
  .argument('<path>', 'Directory containing files')
  .option('-p, --pattern <pattern>', 'Rename pattern (clean, date-prefix, sequential, lowercase)', 'clean')
  .option('--dry-run', 'Preview without making changes')
  .action(async (path, options) => {
    const dirPath = resolve(path);
    console.log(`\n✏️  Renaming files in: ${dirPath}`);
    console.log(`   Pattern: ${options.pattern}\n`);
    
    const result = await renameFiles(dirPath, options.pattern, { dryRun: options.dryRun });
    
    console.log(`✅ Renamed ${result.renamed} files`);
    
    if (options.dryRun) {
      console.log('\n⚠️  Dry run - no changes made');
    }
    
    console.log();
  });

// Junk clean command
program
  .command('junkclean')
  .description('Clean junk files')
  .argument('<path>', 'Directory to clean')
  .option('--dry-run', 'Preview without making changes')
  .action(async (path, options) => {
    const dirPath = resolve(path);
    console.log(`\n🗑️  Finding junk in: ${dirPath}\n`);
    
    const junkResult = await findJunk(dirPath);
    
    console.log(`Found junk files:`);
    console.log(`   Temporary: ${junkResult.categories.temporary}`);
    console.log(`   Large: ${junkResult.categories.large}`);
    console.log(`   Stale: ${junkResult.categories.stale}`);
    console.log(`   Total size: ${junkResult.totalSizeFormatted}\n`);
    
    if (!options.dryRun && junkResult.categories.temporary > 0) {
      const cleanResult = await cleanJunk(junkResult.junkFiles, { types: ['temporary'] });
      console.log(`✅ Cleaned ${cleanResult.cleaned} files`);
      console.log(`   Freed: ${cleanResult.freedSpaceFormatted}`);
    } else if (options.dryRun) {
      console.log('⚠️  Dry run - no changes made');
    }
    
    console.log();
  });

// One-click command
program
  .command('oneclick')
  .description('Execute full cleanup pipeline')
  .argument('<path>', 'Directory to clean')
  .option('--dry-run', 'Preview without making changes')
  .action(async (path, options) => {
    const dirPath = resolve(path);
    console.log(`\n🧞 CleanGenie One-Click Cleanup\n`);
    console.log(`Target: ${dirPath}\n`);
    
    const result = await oneClickClean(dirPath, { dryRun: options.dryRun });
    
    if (result.success) {
      console.log(`✅ Cleanup complete!\n`);
      console.log(`Health: ${result.beforeHealth} → ${result.afterHealth} (+${result.improvement})`);
      console.log(`Duration: ${result.duration}ms`);
      console.log(`Stages: ${result.stages.length}\n`);
      
      if (options.dryRun) {
        console.log('⚠️  Dry run - no changes made');
      }
    } else {
      console.log(`❌ Cleanup failed: ${result.error}`);
    }
    
    console.log();
  });

// Report command
program
  .command('report')
  .description('Generate health report')
  .argument('<path>', 'Directory to analyze')
  .action(async (path) => {
    const dirPath = resolve(path);
    console.log(`\n📋 Generating report for: ${dirPath}\n`);
    
    const health = await calculateHealth(dirPath);
    
    console.log(JSON.stringify(health, null, 2));
    console.log();
  });

program.parse();
