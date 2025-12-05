/**
 * Unit tests for Junk Cleaner Module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm, readdir } from 'fs/promises';
import { join } from 'path';
import { findJunk, cleanJunk } from '../src/modules/junkCleaner.js';

const TEST_DIR = join(process.cwd(), 'test-temp-junk');

describe('Junk Cleaner Module', () => {
  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it('should identify temporary files', async () => {
    await writeFile(join(TEST_DIR, 'file.tmp'), 'temp');
    await writeFile(join(TEST_DIR, 'file.cache'), 'cache');
    await writeFile(join(TEST_DIR, 'file.log'), 'log');
    await writeFile(join(TEST_DIR, 'normal.txt'), 'normal');

    const result = await findJunk(TEST_DIR);

    expect(result.categories.temporary).toBe(3);
  });

  it('should identify large files', async () => {
    const largeContent = 'x'.repeat(101 * 1024 * 1024); // 101 MB
    await writeFile(join(TEST_DIR, 'large.bin'), largeContent);

    const result = await findJunk(TEST_DIR);

    expect(result.categories.large).toBe(1);
  });

  it('should clean temporary files', async () => {
    await writeFile(join(TEST_DIR, 'file.tmp'), 'temp');
    await writeFile(join(TEST_DIR, 'keep.txt'), 'keep');

    const junkResult = await findJunk(TEST_DIR);
    const cleanResult = await cleanJunk(junkResult.junkFiles, { types: ['temporary'] });

    expect(cleanResult.cleaned).toBe(1);
    
    const files = await readdir(TEST_DIR);
    expect(files).toContain('keep.txt');
    expect(files).not.toContain('file.tmp');
  });

  it('should calculate total junk size', async () => {
    const content = 'x'.repeat(1000);
    await writeFile(join(TEST_DIR, 'file1.tmp'), content);
    await writeFile(join(TEST_DIR, 'file2.tmp'), content);

    const result = await findJunk(TEST_DIR);

    expect(result.totalSize).toBe(2000);
  });

  it('should handle empty directory', async () => {
    const result = await findJunk(TEST_DIR);

    expect(result.categories.temporary).toBe(0);
    expect(result.totalSize).toBe(0);
  });

  it('should not delete non-junk files', async () => {
    await writeFile(join(TEST_DIR, 'important.txt'), 'important');

    const junkResult = await findJunk(TEST_DIR);
    await cleanJunk(junkResult.junkFiles, { types: ['temporary'] });

    const files = await readdir(TEST_DIR);
    expect(files).toContain('important.txt');
  });
});
