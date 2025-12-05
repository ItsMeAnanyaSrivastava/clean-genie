/**
 * Property-based tests for Renamer Module
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { mkdir, writeFile, rm, readdir } from 'fs/promises';
import { join, extname } from 'path';
import { renameFiles } from '../src/modules/renamer.js';

const TEST_DIR = join(process.cwd(), 'test-prop-renamer');

describe('Renamer Properties', () => {
  it('P9: File extensions are always preserved', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.constantFrom('.txt', '.pdf', '.jpg', '.doc'),
        async (filename, ext) => {
          await mkdir(TEST_DIR, { recursive: true });
          
          const originalFile = filename + ext;
          await writeFile(join(TEST_DIR, originalFile), 'content');
          
          await renameFiles(TEST_DIR, 'clean');
          
          const files = await readdir(TEST_DIR);
          
          await rm(TEST_DIR, { recursive: true, force: true });
          
          // Extension should be preserved
          return files.length > 0 && extname(files[0]) === ext;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('P10: No two files have the same name after renaming', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 5 }),
        async (filenames) => {
          await mkdir(TEST_DIR, { recursive: true });
          
          for (const name of filenames) {
            await writeFile(join(TEST_DIR, name + '.txt'), 'content');
          }
          
          await renameFiles(TEST_DIR, 'clean');
          
          const files = await readdir(TEST_DIR);
          const uniqueFiles = new Set(files);
          
          await rm(TEST_DIR, { recursive: true, force: true });
          
          // All filenames should be unique
          return files.length === uniqueFiles.size;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('P12: Invalid filename characters are removed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        async (filename) => {
          await mkdir(TEST_DIR, { recursive: true });
          
          const messyName = filename + '!@#$%^&*()';
          await writeFile(join(TEST_DIR, messyName + '.txt'), 'content');
          
          await renameFiles(TEST_DIR, 'clean');
          
          const files = await readdir(TEST_DIR);
          
          await rm(TEST_DIR, { recursive: true, force: true });
          
          // Should not contain special characters
          return files.length > 0 && !/[!@#$%^&*()]/.test(files[0]);
        }
      ),
      { numRuns: 10 }
    );
  });
});
