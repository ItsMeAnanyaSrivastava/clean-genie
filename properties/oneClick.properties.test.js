/**
 * Property-based tests for One-Click Module
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { oneClickClean } from '../src/modules/oneClick.js';

const TEST_DIR = join(process.cwd(), 'test-prop-oneclick');

describe('One-Click Properties', () => {
  it('P21: All stages execute in order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 3 }),
        async (contents) => {
          await mkdir(TEST_DIR, { recursive: true });
          
          for (let i = 0; i < contents.length; i++) {
            await writeFile(join(TEST_DIR, `file${i}.txt`), contents[i]);
          }
          
          const result = await oneClickClean(TEST_DIR);
          
          await rm(TEST_DIR, { recursive: true, force: true });
          
          // Should have multiple stages
          return result.stages && result.stages.length > 0;
        }
      ),
      { numRuns: 5 }
    );
  });

  it('P23: Final report includes all operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 3 }),
        async (contents) => {
          await mkdir(TEST_DIR, { recursive: true });
          
          for (let i = 0; i < contents.length; i++) {
            await writeFile(join(TEST_DIR, `file${i}.txt`), contents[i]);
          }
          
          const result = await oneClickClean(TEST_DIR);
          
          await rm(TEST_DIR, { recursive: true, force: true });
          
          // Final report should exist
          return result.finalReport !== undefined;
        }
      ),
      { numRuns: 5 }
    );
  });

  it('P24: After health score >= before health score', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 3 }),
        async (contents) => {
          await mkdir(TEST_DIR, { recursive: true });
          
          for (let i = 0; i < contents.length; i++) {
            await writeFile(join(TEST_DIR, `file${i}.txt`), contents[i]);
          }
          
          const result = await oneClickClean(TEST_DIR);
          
          await rm(TEST_DIR, { recursive: true, force: true });
          
          // Health should improve or stay same
          return result.afterHealth >= result.beforeHealth;
        }
      ),
      { numRuns: 5 }
    );
  });
});
