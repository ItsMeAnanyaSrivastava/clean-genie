/**
 * Unit tests for Health Score Module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { calculateHealth } from '../src/modules/healthScore.js';

const TEST_DIR = join(process.cwd(), 'test-temp-health');

describe('Health Score Module', () => {
  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it('should calculate health score in range 0-100', async () => {
    await writeFile(join(TEST_DIR, 'file.txt'), 'content');

    const result = await calculateHealth(TEST_DIR);

    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it('should return perfect score for clean directory', async () => {
    await mkdir(join(TEST_DIR, 'Documents'), { recursive: true });
    await writeFile(join(TEST_DIR, 'Documents', 'file.txt'), 'content');

    const result = await calculateHealth(TEST_DIR);

    expect(result.overallScore).toBeGreaterThan(80);
  });

  it('should detect duplicates in score', async () => {
    await writeFile(join(TEST_DIR, 'file1.txt'), 'duplicate');
    await writeFile(join(TEST_DIR, 'file2.txt'), 'duplicate');

    const result = await calculateHealth(TEST_DIR);

    expect(result.duplicateScore).toBeLessThan(100);
  });

  it('should detect junk in score', async () => {
    await writeFile(join(TEST_DIR, 'file.tmp'), 'junk');
    await writeFile(join(TEST_DIR, 'file.cache'), 'junk');

    const result = await calculateHealth(TEST_DIR);

    expect(result.junkScore).toBeLessThan(100);
  });

  it('should provide recommendations', async () => {
    await writeFile(join(TEST_DIR, 'file1.txt'), 'dup');
    await writeFile(join(TEST_DIR, 'file2.txt'), 'dup');

    const result = await calculateHealth(TEST_DIR);

    expect(result.recommendations).toBeInstanceOf(Array);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should handle empty directory', async () => {
    const result = await calculateHealth(TEST_DIR);

    expect(result.overallScore).toBe(100);
  });
});
