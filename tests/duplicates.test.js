/**
 * Unit tests for Duplicates Module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { findDuplicates, removeDuplicates, generateDuplicateReport } from '../src/modules/duplicates.js';

const TEST_DIR = join(process.cwd(), 'test-temp-duplicates');

describe('Duplicates Module', () => {
  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it('should find duplicate files with identical content', async () => {
    // Create duplicate files
    await writeFile(join(TEST_DIR, 'file1.txt'), 'identical content');
    await writeFile(join(TEST_DIR, 'file2.txt'), 'identical content');
    await writeFile(join(TEST_DIR, 'file3.txt'), 'different content');

    const result = await findDuplicates(TEST_DIR);

    expect(result.duplicateGroups.size).toBe(1);
    expect(result.stats.totalDuplicates).toBe(1);
    expect(result.stats.uniqueFiles).toBe(2);
  });

  it('should not find duplicates when all files are unique', async () => {
    await writeFile(join(TEST_DIR, 'file1.txt'), 'content 1');
    await writeFile(join(TEST_DIR, 'file2.txt'), 'content 2');
    await writeFile(join(TEST_DIR, 'file3.txt'), 'content 3');

    const result = await findDuplicates(TEST_DIR);

    expect(result.duplicateGroups.size).toBe(0);
    expect(result.stats.totalDuplicates).toBe(0);
  });

  it('should calculate wasted space correctly', async () => {
    const content = 'x'.repeat(1000); // 1000 bytes
    await writeFile(join(TEST_DIR, 'file1.txt'), content);
    await writeFile(join(TEST_DIR, 'file2.txt'), content);
    await writeFile(join(TEST_DIR, 'file3.txt'), content);

    const result = await findDuplicates(TEST_DIR);

    expect(result.stats.wastedSpace).toBe(2000); // 2 duplicates * 1000 bytes
  });

  it('should remove duplicates keeping first file', async () => {
    await writeFile(join(TEST_DIR, 'file1.txt'), 'duplicate');
    await writeFile(join(TEST_DIR, 'file2.txt'), 'duplicate');
    await writeFile(join(TEST_DIR, 'file3.txt'), 'duplicate');

    const { duplicateGroups } = await findDuplicates(TEST_DIR);
    const result = await removeDuplicates(duplicateGroups, 'first');

    expect(result.removed.length).toBe(2);
    expect(result.kept.length).toBe(1);
  });

  it('should generate valid duplicate report', async () => {
    await writeFile(join(TEST_DIR, 'file1.txt'), 'same');
    await writeFile(join(TEST_DIR, 'file2.txt'), 'same');

    const { duplicateGroups } = await findDuplicates(TEST_DIR);
    const report = generateDuplicateReport(duplicateGroups);

    expect(report).toHaveProperty('timestamp');
    expect(report).toHaveProperty('duplicateGroups');
    expect(report.duplicateGroups.length).toBe(1);
  });

  it('should handle empty directory', async () => {
    const result = await findDuplicates(TEST_DIR);

    expect(result.duplicateGroups.size).toBe(0);
    expect(result.stats.totalFiles).toBe(0);
  });
});
