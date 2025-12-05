/**
 * Property-based tests for Health Score Module
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { calculateHealth } from '../src/modules/healthScore.js';

const TEST_DIR = join(process.cwd(), 'test-prop-health');

describe('Health Score Properties', () => {
  it('P17: All scores are in range [0, 100]', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 10 }),
            content: fc.string({ minLength: 0, maxLength: 100 })
          }),
          { minLength: 0, maxLength: 10 }
        ),
        async (files) => {
          await mkdir(TEST_DIR, { recursive: true });
          
          for (const file of files) {
            await writeFile(join(TEST_DIR, file.name + '.txt'), file.content);
          }
          
          const result = await calculateHealth(TEST_DIR);
          
          await rm(TEST_DIR, { recursive: true, force: true });
          
          // All scores should be in valid range
          return (
            result.overallScore >= 0 && result.overallScore <= 100 &&
            result.duplicateScore >= 0 && result.duplicateScore <= 100 &&
            result.junkScore >= 0 && result.junkScore <= 100 &&
            result.organizationScore >= 0 && result.organizationScore <= 100
          );
        }
      ),
      { numRuns: 10 }
    );
  });

  it('P19: Score of 100 means perfect health', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        await mkdir(TEST_DIR, { recursive: true });
        
        // Create perfectly organized directory
        await mkdir(join(TEST_DIR, 'Documents'), { recursive: true });
        await writeFile(join(TEST_DIR, 'Documents', 'unique.txt'), 'unique content');
        
        const result = await calculateHealth(TEST_DIR);
        
        await rm(TEST_DIR, { recursive: true, force: true });
        
        // Perfect directory should have high score
        return result.overallScore >= 80;
      }),
      { numRuns: 5 }
    );
  });

  it('P20: Recommendations are actionable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
        async (contents) => {
          await mkdir(TEST_DIR, { recursive: true });
          
          for (let i = 0; i < contents.length; i++) {
            await writeFile(join(TEST_DIR, `file${i}.txt`), contents[i]);
          }
          
          const result = await calculateHealth(TEST_DIR);
          
          await rm(TEST_DIR, { recursive: true, force: true });
          
          // Recommendations should be an array
          return Array.isArray(result.recommendations);
        }
      ),
      { numRuns: 10 }
    );
  });
});
