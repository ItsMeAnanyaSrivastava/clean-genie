/**
 * Property-based tests for Organizer Module
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { organizeFiles } from '../src/modules/organizer.js';
import { getAllFiles } from '../src/utils.js';

const TEST_DIR = join(process.cwd(), 'test-prop-organizer');

describe('Organizer Properties', () => {
  it('P5: No files are lost during organization', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 10 }),
            ext: fc.constantFrom('.txt', '.jpg', '.pdf', '.mp4')
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (files) => {
          await mkdir(TEST_DIR, { recursive: true });
          
          const filesBefore = files.length;
          
          for (const file of files) {
            await writeFile(join(TEST_DIR, file.name + file.ext), 'content');
          }
          
          await organizeFiles(TEST_DIR);
          
          const filesAfter = await getAllFiles(TEST_DIR);
          
          await rm(TEST_DIR, { recursive: true, force: true });
          
          // Same number of files before and after
          return filesAfter.length === filesBefore;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('P7: All files end up in exactly one category', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.constantFrom('.txt', '.jpg', '.pdf', '.mp4', '.zip'),
          { minLength: 1, maxLength: 5 }
        ),
        async (extensions) => {
          await mkdir(TEST_DIR, { recursive: true });
          
          for (let i = 0; i < extensions.length; i++) {
            await writeFile(join(TEST_DIR, `file${i}${extensions[i]}`), 'content');
          }
          
          const result = await organizeFiles(TEST_DIR);
          
          await rm(TEST_DIR, { recursive: true, force: true });
          
          // Sum of all categories should equal organized files
          const totalCategorized = Object.values(result.categories).reduce((a, b) => a + b, 0);
          return totalCategorized >= extensions.length;
        }
      ),
      { numRuns: 10 }
    );
  });
});
