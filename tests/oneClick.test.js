/**
 * Unit tests for One-Click Module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { oneClickClean } from '../src/modules/oneClick.js';

const TEST_DIR = join(process.cwd(), 'test-temp-oneclick');

describe('One-Click Module', () => {
  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it('should execute all stages successfully', async () => {
    await writeFile(join(TEST_DIR, 'file.txt'), 'content');

    const result = await oneClickClean(TEST_DIR);

    expect(result.success).toBe(true);
    expect(result.stages.length).toBeGreaterThan(0);
  });

  it('should improve health score', async () => {
    await writeFile(join(TEST_DIR, 'dup1.txt'), 'duplicate');
    await writeFile(join(TEST_DIR, 'dup2.txt'), 'duplicate');
    await writeFile(join(TEST_DIR, 'junk.tmp'), 'junk');

    const result = await oneClickClean(TEST_DIR);

    expect(result.afterHealth).toBeGreaterThanOrEqual(result.beforeHealth);
  });

  it('should generate final report', async () => {
    await writeFile(join(TEST_DIR, 'file.txt'), 'content');

    const result = await oneClickClean(TEST_DIR);

    expect(result.finalReport).toBeDefined();
    expect(result.finalReport).toHaveProperty('timestamp');
    expect(result.finalReport).toHaveProperty('summary');
  });

  it('should handle dry run mode', async () => {
    await writeFile(join(TEST_DIR, 'file.txt'), 'content');

    const result = await oneClickClean(TEST_DIR, { dryRun: true });

    expect(result.dryRun).toBe(true);
    expect(result.success).toBe(true);
  });

  it('should track execution duration', async () => {
    await writeFile(join(TEST_DIR, 'file.txt'), 'content');

    const result = await oneClickClean(TEST_DIR);

    expect(result.duration).toBeGreaterThan(0);
  });

  it('should handle empty directory', async () => {
    const result = await oneClickClean(TEST_DIR);

    expect(result.success).toBe(true);
  });
});
