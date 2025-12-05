# CleanGenie - Requirements Specification

## Overview
CleanGenie is an AI-powered digital cleaning assistant that automates the tedious task of organizing, cleaning, and maintaining a healthy file system on personal computers.

## Problem Statement
Users face significant challenges managing their digital files:
- Duplicate files waste storage space and create confusion
- Poorly named files make retrieval difficult
- Downloads folders become chaotic repositories
- Junk files accumulate unnoticed, consuming gigabytes
- Manual cleanup is time-consuming and error-prone

## Acceptance Criteria (EARS Format)

### AC-1: Duplicate File Detection
**WHEN** the system scans a directory for duplicates  
**THEN** it SHALL compute SHA-256 hashes for all files  
**AND** group files with identical hashes  
**AND** output a JSON report listing all duplicate groups  
**AND** preserve at least one copy of each unique file

### AC-2: Smart File Organization
**WHEN** the user requests file organization for a directory  
**THEN** the system SHALL categorize files by extension into logical folders  
**AND** create category folders (Documents, Images, Videos, Audio, Archives, Code, Others)  
**AND** move files safely without overwriting existing files  
**AND** generate a before/after snapshot report

### AC-3: AI-Based File Renaming
**WHEN** the user provides a renaming pattern  
**THEN** the system SHALL apply the pattern to matching files  
**AND** clean messy filenames (remove special chars, normalize spaces)  
**AND** ensure no filename collisions occur  
**AND** preserve file extensions  
**AND** log all rename operations

### AC-4: Junk File Cleaning
**WHEN** the system analyzes a directory for junk  
**THEN** it SHALL identify temporary files (.tmp, .cache, .log)  
**AND** detect extracted archive folders with corresponding archives  
**AND** flag large files (>100MB) for user review  
**AND** identify files not accessed in 180+ days  
**AND** provide safe deletion recommendations

### AC-5: Health Score Calculation
**WHEN** the system calculates directory health  
**THEN** it SHALL compute duplicate percentage (0-100)  
**AND** compute junk percentage (0-100)  
**AND** compute organization grade (0-100)  
**AND** output an overall health score (0-100)  
**AND** provide actionable recommendations

### AC-6: One-Click Clean Mode
**WHEN** the user executes one-click clean  
**THEN** the system SHALL run all modules sequentially  
**AND** find and remove duplicates  
**AND** organize remaining files  
**AND** rename files with standard patterns  
**AND** clean junk files  
**AND** generate a comprehensive final report  
**AND** ensure all operations are logged

### AC-7: CLI Interface
**WHEN** the user invokes CLI commands  
**THEN** the system SHALL support:
- `clean-genie scan <path>` - scan for issues
- `clean-genie organize <path>` - organize files
- `clean-genie rename <path> --pattern <p>` - rename files
- `clean-genie junkclean <path>` - clean junk
- `clean-genie oneclick <path>` - full cleanup
- `clean-genie report <path>` - generate health report

### AC-8: Safety and Rollback
**WHEN** any operation fails or user requests rollback  
**THEN** the system SHALL maintain operation logs  
**AND** support undo for file moves  
**AND** never delete files without explicit confirmation  
**AND** create backups before destructive operations

## Non-Functional Requirements

### NFR-1: Performance
- Scan 10,000 files in under 30 seconds
- Hash computation using streaming for large files

### NFR-2: Safety
- No data loss under any circumstance
- Dry-run mode available for all operations
- Explicit user confirmation for deletions

### NFR-3: Usability
- Clear progress indicators
- Human-readable reports
- Helpful error messages

### NFR-4: Maintainability
- Modular architecture
- Pure functions where possible
- Comprehensive test coverage (>80%)
