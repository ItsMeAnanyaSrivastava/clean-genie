/**
 * Property-based tests for Duplicates Module
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { findDuplicates, removeDuplicates } from '../src/modules/duplicates.js';

const TEST_DIR = join(process.cwd(), 'test-prop-duplicates');

describe('Duplicates Properties', () => {
  it('P1: Files with identical content have identical hashes', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 1000 }), async (content) => {
        await mkdir(TEST_DIR, { recursive: true });
        
        await writeFile(join(TEST_DIR, 'file1.txt'), content);
        await writeFile(join(TEST_DIR, 'file2.txt'), content);
        
        const result = await findDuplicates(TEST_DIR);
        
        await rm(TEST_DIR, { recursive: true, force: true });
        
        // If content is same, should find duplicates
        return result.duplicateGroups.size === 1;
      }),
      { numRuns: 10 }
    );
  });

  it('P2: At least one copy of each unique file is preserved', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 2, maxLength: 5 }),
        async (contents) => {
          await mkdir(TEST_DIR, { recursive: true });
          
          // Create files with given contents
          for (let i = 0; i < contents.length; i++) {
            await writeFile(join(TEST_DIR, `file${i}.txt`), contents[i]);
          }
          
          const { duplicateGroups } = await findDuplicates(TEST_DIR);
          const result = await removeDuplicates(duplicateGroups);
          
          await rm(TEST_DIR, { recursive: true, force: true });
          
          // Number of kept files should equal number of unique contents
          const uniqueContents = new Set(contents);
          return result.kept.length === uniqueContents.size;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('P3: Total files after = total files before - duplicates removed', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 2, max: 5 }), async (numDuplicates) => {
        await mkdir(TEST_DIR, { recursive: true });
        
        const content = 'duplicate content';
        for (let i = 0; i < numDuplicates; i++) {
          await writeFile(join(TEST_DIR, `file${i}.txt`), content);
        }
        
        const { duplicateGroups } = await findDuplicates(TEST_DIR);
        const result = await removeDuplicates(duplicateGroups);
        
        await rm(TEST_DIR, { recursive: true, force: true });
        
        // Should remove all but one
        return result.removed.length === numDuplicates - 1;
      }),
      { numRuns: 10 }
    );
  });

  it('P4: Saved space = sum of removed file sizes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 2, max: 4 }),
        async (fileSize, numCopies) => {
          await mkdir(TEST_DIR, { recursive: true });
          
          const content = 'x'.repeat(fileSize);
          for (let i = 0; i < numCopies; i++) {
            await writeFile(join(TEST_DIR, `file${i}.txt`), content);
          }
          
          const { duplicateGroups } = await findDuplicates(TEST_DIR);
          const result = await removeDuplicates(duplicateGroups);
          
          await rm(TEST_DIR, { recursive: true, force: true });
          
          // Saved space should equal file size * (copies - 1)
          const expectedSaved = fileSize * (numCopies - 1);
          return result.savedSpace === expectedSaved;
        }
      ),
      { numRuns: 10 }
    );
  });
});
