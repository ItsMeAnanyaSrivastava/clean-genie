/**
 * Unit tests for Renamer Module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm, readdir } from 'fs/promises';
import { join } from 'path';
import { renameFiles } from '../src/modules/renamer.js';

const TEST_DIR = join(process.cwd(), 'test-temp-renamer');

describe('Renamer Module', () => {
  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it('should clean messy filenames', async () => {
    await writeFile(join(TEST_DIR, 'My File!@#$%.txt'), 'content');

    const result = await renameFiles(TEST_DIR, 'clean');

    expect(result.renamed).toBe(1);
    
    const files = await readdir(TEST_DIR);
    expect(files[0]).toMatch(/^[a-z0-9_]+\.txt$/);
  });

  it('should preserve file extensions', async () => {
    await writeFile(join(TEST_DIR, 'TEST FILE.PDF'), 'content');

    await renameFiles(TEST_DIR, 'clean');

    const files = await readdir(TEST_DIR);
    expect(files[0]).toMatch(/\.PDF$/);
  });

  it('should apply lowercase pattern', async () => {
    await writeFile(join(TEST_DIR, 'UPPERCASE.TXT'), 'content');

    await renameFiles(TEST_DIR, 'lowercase');

    const files = await readdir(TEST_DIR);
    expect(files[0]).toBe('uppercase.txt');
  });

  it('should handle dry run mode', async () => {
    await writeFile(join(TEST_DIR, 'Bad Name!.txt'), 'content');

    const result = await renameFiles(TEST_DIR, 'clean', { dryRun: true });

    expect(result.dryRun).toBe(true);
    expect(result.renamed).toBe(1);
    
    const files = await readdir(TEST_DIR);
    expect(files[0]).toBe('Bad Name!.txt'); // Unchanged
  });

  it('should skip files that do not need renaming', async () => {
    await writeFile(join(TEST_DIR, 'already_clean.txt'), 'content');

    const result = await renameFiles(TEST_DIR, 'clean');

    expect(result.renamed).toBe(0);
  });

  it('should add date prefix', async () => {
    await writeFile(join(TEST_DIR, 'file.txt'), 'content');

    await renameFiles(TEST_DIR, 'date-prefix');

    const files = await readdir(TEST_DIR);
    expect(files[0]).toMatch(/^\d{4}-\d{2}-\d{2}_file\.txt$/);
  });
});
