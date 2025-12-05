/**
 * Unit tests for Organizer Module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm, readdir } from 'fs/promises';
import { join } from 'path';
import { organizeFiles, generateOrganizationReport } from '../src/modules/organizer.js';

const TEST_DIR = join(process.cwd(), 'test-temp-organizer');

describe('Organizer Module', () => {
  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it('should organize files into category folders', async () => {
    await writeFile(join(TEST_DIR, 'document.pdf'), 'pdf content');
    await writeFile(join(TEST_DIR, 'image.jpg'), 'jpg content');
    await writeFile(join(TEST_DIR, 'video.mp4'), 'mp4 content');

    const result = await organizeFiles(TEST_DIR);

    expect(result.organized).toBeGreaterThan(0);
    expect(result.categories.Documents).toBe(1);
    expect(result.categories.Images).toBe(1);
    expect(result.categories.Videos).toBe(1);
  });

  it('should not overwrite existing files', async () => {
    await writeFile(join(TEST_DIR, 'file.txt'), 'content 1');
    await mkdir(join(TEST_DIR, 'Documents'), { recursive: true });
    await writeFile(join(TEST_DIR, 'Documents', 'file.txt'), 'content 2');

    const result = await organizeFiles(TEST_DIR);

    const files = await readdir(join(TEST_DIR, 'Documents'));
    expect(files.length).toBeGreaterThanOrEqual(2); // Original + moved with suffix
  });

  it('should handle dry run mode', async () => {
    await writeFile(join(TEST_DIR, 'test.pdf'), 'content');

    const result = await organizeFiles(TEST_DIR, { dryRun: true });

    expect(result.dryRun).toBe(true);
    expect(result.organized).toBeGreaterThan(0);
    
    // File should still be in root
    const files = await readdir(TEST_DIR);
    expect(files).toContain('test.pdf');
  });

  it('should generate organization report', async () => {
    await writeFile(join(TEST_DIR, 'doc.pdf'), 'content');
    
    const result = await organizeFiles(TEST_DIR);
    const report = generateOrganizationReport(result);

    expect(report).toHaveProperty('timestamp');
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('categories');
  });

  it('should skip files already in category folders', async () => {
    await mkdir(join(TEST_DIR, 'Documents'), { recursive: true });
    await writeFile(join(TEST_DIR, 'Documents', 'file.pdf'), 'content');

    const result = await organizeFiles(TEST_DIR);

    expect(result.organized).toBe(0);
  });

  it('should handle empty directory', async () => {
    const result = await organizeFiles(TEST_DIR);

    expect(result.organized).toBe(0);
    expect(Object.values(result.categories).every(c => c === 0)).toBe(true);
  });
});
