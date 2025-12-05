# 🧞 CleanGenie - Your Personal Digital Cleaning AI

**Automate the tedious task of cleaning your messy laptop with AI-powered intelligence.**

CleanGenie is a command-line tool that helps you organize, clean, and maintain a healthy file system. Say goodbye to duplicate files, junk clutter, and chaotic downloads folders.

## 🎯 Problem

We all struggle with:
- **Duplicate files** wasting precious storage space
- **Badly named files** making retrieval impossible
- **Downloads folder chaos** with hundreds of random files
- **Junk files** consuming 10+ GB without us knowing
- **Manual cleanup** being slow, boring, and error-prone

## ✨ Solution

CleanGenie automates your entire digital cleanup workflow:

1. **Duplicate Finder** - Hash-based detection, saves gigabytes
2. **Smart Organizer** - Categorizes files by type automatically
3. **AI Renamer** - Cleans messy filenames intelligently
4. **Junk Cleaner** - Removes temporary and stale files
5. **Health Score** - Tracks your directory health (0-100)
6. **One-Click Mode** - Full cleanup in a single command

## 🚀 Installation

```bash
cd clean-genie
npm install
npm link
```

## 📖 Usage

### Scan Directory
```bash
clean-genie scan ~/Downloads
```

### Organize Files
```bash
clean-genie organize ~/Downloads
clean-genie organize ~/Downloads --dry-run  # Preview first
```

### Rename Files
```bash
clean-genie rename ~/Downloads --pattern clean
clean-genie rename ~/Documents --pattern date-prefix
clean-genie rename ~/Photos --pattern sequential
```

### Clean Junk
```bash
clean-genie junkclean ~/Downloads
clean-genie junkclean ~/Downloads --dry-run
```

### One-Click Cleanup
```bash
clean-genie oneclick ~/Downloads
clean-genie oneclick ~/Downloads --dry-run
```

### Generate Report
```bash
clean-genie report ~/Downloads
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLI Interface                        │
│                    (commander.js)                        │
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
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run property-based tests
npm run test:properties

# Watch mode
npm run test:watch
```

## 📊 Features

### Duplicate Detection
- SHA-256 hash-based comparison
- Streaming for large files
- Configurable keep strategy (first, last, largest)
- Detailed wasted space calculation

### Smart Organization
- 7 categories: Documents, Images, Videos, Audio, Archives, Code, Others
- Safe move with collision detection
- Before/after snapshots
- Dry-run mode

### Intelligent Renaming
- Pattern-based: clean, date-prefix, sequential, lowercase
- Preserves file extensions
- Collision-free renaming
- Operation logging for rollback

### Junk Cleaning
- Temporary files (.tmp, .cache, .log)
- Large files (>100MB flagged for review)
- Stale files (not accessed in 180+ days)
- Safe deletion with confirmation

### Health Scoring
- Overall score (0-100)
- Duplicate percentage
- Junk percentage
- Organization grade
- Actionable recommendations

## 🎬 Demo

### Before
```
~/Downloads/
├── IMG_1234.jpg
├── IMG_1234 (1).jpg
├── document!!!.pdf
├── temp_file.tmp
├── random.zip
└── video.mp4
```

### After One-Click
```
~/Downloads/
├── Documents/
│   └── document.pdf
├── Images/
│   └── img_1234.jpg
├── Videos/
│   └── video.mp4
└── Archives/
    └── random.zip
```

**Health Score: 45 → 95** ✨

## 🛡️ Safety Features

- **Dry-run mode** - Preview all changes
- **No overwrites** - Collision detection with auto-renaming
- **Operation logs** - Full audit trail
- **Confirmation prompts** - For destructive operations
- **Rollback support** - Via detailed logs

## 🏆 Built with Kiro

This project was built entirely with Kiro AI assistance, showcasing:
- Specification-driven development
- Design documentation
- Modular architecture
- Comprehensive testing (unit + property-based)
- Production-ready code

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! This is a Kiro Heroes Week 2 challenge submission.

---

**Made with ❤️ and Kiro AI**
