# CleanGenie - Design Document

## Architecture Overview

CleanGenie follows a modular, pipeline-based architecture where each module is independent and composable.

```
┌─────────────────────────────────────────────────────────┐
│                     CLI Interface                       │
│                    (commander.js)                       │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  Core Modules   │    │  Utility Layer  │
├─────────────────┤    ├─────────────────┤
│ • duplicates    │    │ • fileUtils     │
│ • organizer     │    │ • hashUtils     │
│ • renamer       │    │ • logger        │
│ • junkCleaner   │    │ • reporter      │
│ • healthScore   │    └─────────────────┘
│ • oneClick      │
└─────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         File System (fs/promises)       │
└─────────────────────────────────────────┘
```

## Module Specifications

### 1. Duplicates Module (`duplicates.js`)

**Purpose**: Identify duplicate files using cryptographic hashing

**Interface**:
```javascript
async findDuplicates(dirPath, options = {})
  → { duplicateGroups: Map<hash, [files]>, stats: {...} }

async removeDuplicates(duplicateGroups, keepStrategy = 'first')
  → { removed: [...], kept: [...], savedSpace: number }
```

**Algorithm**:
1. Recursively traverse directory
2. Compute SHA-256 hash for each file (streaming for large files)
3. Group files by hash
4. Filter groups with 2+ files
5. Return duplicate groups

**Correctness Properties**:
- P1: Files with identical content have identical hashes
- P2: At least one copy of each unique file is preserved
- P3: Total files after = total files before - duplicates removed
- P4: Saved space = sum of removed file sizes

### 2. Organizer Module (`organizer.js`)

**Purpose**: Categorize and organize files by type

**Interface**:
```javascript
async organizeFiles(dirPath, options = {})
  → { organized: number, categories: {...}, snapshot: {...} }
```

**Categories**:
- Documents: .pdf, .doc, .docx, .txt, .md, .xlsx, .pptx
- Images: .jpg, .jpeg, .png, .gif, .svg, .webp
- Videos: .mp4, .avi, .mkv, .mov, .wmv
- Audio: .mp3, .wav, .flac, .aac, .ogg
- Archives: .zip, .rar, .7z, .tar, .gz
- Code: .js, .py, .java, .cpp, .html, .css
- Others: everything else

**Algorithm**:
1. Scan directory for files
2. Classify each file by extension
3. Create category folders if needed
4. Move files with collision detection
5. Generate before/after snapshot

**Correctness Properties**:
- P5: No files are lost during organization
- P6: No files are overwritten (collision handling)
- P7: All files end up in exactly one category
- P8: Original directory structure is preserved in snapshot

### 3. Renamer Module (`renamer.js`)

**Purpose**: Apply intelligent renaming patterns

**Interface**:
```javascript
async renameFiles(dirPath, pattern, options = {})
  → { renamed: number, operations: [...] }
```

**Patterns**:
- `clean`: Remove special chars, normalize spaces
- `date-prefix`: Add YYYY-MM-DD prefix
- `sequential`: Add sequential numbers
- `lowercase`: Convert to lowercase
- `custom`: User-defined regex pattern

**Algorithm**:
1. List files matching criteria
2. Apply pattern transformation
3. Check for collisions
4. Resolve collisions with suffixes
5. Execute renames atomically
6. Log all operations

**Correctness Properties**:
- P9: File extensions are always preserved
- P10: No two files have the same name after renaming
- P11: All rename operations are reversible via log
- P12: Invalid filename characters are removed

### 4. Junk Cleaner Module (`junkCleaner.js`)

**Purpose**: Identify and remove junk files

**Interface**:
```javascript
async findJunk(dirPath, options = {})
  → { junkFiles: [...], categories: {...}, totalSize: number }

async cleanJunk(junkFiles, options = {})
  → { cleaned: number, freedSpace: number }
```

**Junk Categories**:
- Temporary: .tmp, .cache, .log, ~files
- Extracted: folders matching archive names
- Large: files > 100MB (flagged for review)
- Stale: not accessed in 180+ days

**Algorithm**:
1. Traverse directory recursively
2. Classify files into junk categories
3. Calculate total junk size
4. Present findings to user
5. Delete with confirmation
6. Log all deletions

**Correctness Properties**:
- P13: No non-junk files are flagged
- P14: User confirmation required before deletion
- P15: Freed space matches sum of deleted file sizes
- P16: Deletion log allows recovery

### 5. Health Score Module (`healthScore.js`)

**Purpose**: Calculate directory health metrics

**Interface**:
```javascript
async calculateHealth(dirPath)
  → { 
      overallScore: number,
      duplicateScore: number,
      junkScore: number,
      organizationScore: number,
      recommendations: [...]
    }
```

**Scoring Algorithm**:
```
duplicateScore = 100 - (duplicateSize / totalSize * 100)
junkScore = 100 - (junkSize / totalSize * 100)
organizationScore = (categorizedFiles / totalFiles * 100)
overallScore = (duplicateScore + junkScore + organizationScore) / 3
```

**Correctness Properties**:
- P17: All scores are in range [0, 100]
- P18: Higher score indicates better health
- P19: Score of 100 means perfect health
- P20: Recommendations are actionable

### 6. One-Click Module (`oneClick.js`)

**Purpose**: Execute full cleanup pipeline

**Interface**:
```javascript
async oneClickClean(dirPath, options = {})
  → { 
      stages: [...],
      finalReport: {...},
      beforeHealth: number,
      afterHealth: number
    }
```

**Pipeline**:
1. Calculate initial health score
2. Find and remove duplicates
3. Organize remaining files
4. Apply clean renaming
5. Identify and clean junk
6. Calculate final health score
7. Generate comprehensive report

**Correctness Properties**:
- P21: All stages execute in order
- P22: Failure in one stage doesn't affect completed stages
- P23: Final report includes all operations
- P24: After health score >= before health score

## Data Flow

```
User Input (CLI)
    ↓
Command Parser
    ↓
Module Selection
    ↓
File System Scan
    ↓
Analysis & Processing
    ↓
Safe Execution (with logging)
    ↓
Report Generation
    ↓
Output to User
```

## Error Handling Strategy

1. **Validation Layer**: Check inputs before processing
2. **Try-Catch Blocks**: Wrap all file operations
3. **Atomic Operations**: Use transactions where possible
4. **Rollback Support**: Maintain operation logs
5. **User Feedback**: Clear error messages with recovery steps

## Safety Mechanisms

1. **Dry Run Mode**: Preview changes without execution
2. **Backup Creation**: Copy files before destructive ops
3. **Confirmation Prompts**: Require explicit user approval
4. **Operation Logging**: Track all changes for audit
5. **Collision Detection**: Never overwrite existing files

## Testing Strategy

### Unit Tests
- Test each module function independently
- Mock file system operations
- Verify correct outputs for known inputs

### Property-Based Tests
- Use fast-check for generative testing
- Verify correctness properties hold for all inputs
- Test edge cases automatically

### Integration Tests
- Test full pipeline execution
- Verify module interactions
- Test error propagation

## Performance Considerations

1. **Streaming**: Use streams for large file hashing
2. **Parallel Processing**: Hash multiple files concurrently
3. **Caching**: Cache file stats to avoid redundant calls
4. **Lazy Loading**: Load files on-demand
5. **Progress Reporting**: Show progress for long operations
