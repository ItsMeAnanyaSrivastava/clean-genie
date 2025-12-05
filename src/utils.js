/**
 * Utility functions for CleanGenie
 * Provides file system helpers, hashing, and logging
 */

import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import { readdir, stat, mkdir, rename, unlink, copyFile } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';

/**
 * Recursively get all files in a directory
 * @param {string} dirPath - Directory to scan
 * @param {Array} fileList - Accumulator for recursive calls
 * @returns {Promise<Array<string>>} List of file paths
 */
export async function getAllFiles(dirPath, fileList = []) {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        await getAllFiles(fullPath, fileList);
      } else if (entry.isFile()) {
        fileList.push(fullPath);
      }
    }
    
    return fileList;
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
    return fileList;
  }
}

/**
 * Compute SHA-256 hash of a file using streaming
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} Hex hash string
 */
export async function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Get file size in bytes
 * @param {string} filePath - Path to file
 * @returns {Promise<number>} File size
 */
export async function getFileSize(filePath) {
  try {
    const stats = await stat(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Get file stats including access time
 * @param {string} filePath - Path to file
 * @returns {Promise<Object>} File stats
 */
export async function getFileStats(filePath) {
  try {
    return await stat(filePath);
  } catch (error) {
    return null;
  }
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Ensure directory exists, create if not
 * @param {string} dirPath - Directory path
 */
export async function ensureDir(dirPath) {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Safe file move with collision detection
 * @param {string} source - Source file path
 * @param {string} destination - Destination file path
 * @returns {Promise<string>} Final destination path
 */
export async function safeMove(source, destination) {
  await ensureDir(dirname(destination));
  
  // Check for collision
  let finalDest = destination;
  let counter = 1;
  
  while (true) {
    try {
      await stat(finalDest);
      // File exists, try next name
      const ext = extname(destination);
      const base = basename(destination, ext);
      const dir = dirname(destination);
      finalDest = join(dir, `${base}_${counter}${ext}`);
      counter++;
    } catch (error) {
      // File doesn't exist, safe to use
      break;
    }
  }
  
  await rename(source, finalDest);
  return finalDest;
}

/**
 * Clean filename by removing special characters
 * @param {string} filename - Original filename
 * @returns {string} Cleaned filename
 */
export function cleanFilename(filename) {
  const ext = extname(filename);
  const base = basename(filename, ext);
  
  // Remove special chars, normalize spaces, trim
  const cleaned = base
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
  
  return cleaned + ext;
}

/**
 * Get file extension category
 * @param {string} filePath - File path
 * @returns {string} Category name
 */
export function getFileCategory(filePath) {
  const ext = extname(filePath).toLowerCase();
  
  const categories = {
    Documents: ['.pdf', '.doc', '.docx', '.txt', '.md', '.xlsx', '.pptx', '.odt', '.rtf'],
    Images: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.ico'],
    Videos: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'],
    Audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'],
    Archives: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'],
    Code: ['.js', '.py', '.java', '.cpp', '.c', '.h', '.html', '.css', '.json', '.xml', '.ts', '.go', '.rs'],
  };
  
  for (const [category, extensions] of Object.entries(categories)) {
    if (extensions.includes(ext)) {
      return category;
    }
  }
  
  return 'Others';
}

/**
 * Simple logger for operations
 */
export class Logger {
  constructor() {
    this.logs = [];
  }
  
  log(level, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    this.logs.push(entry);
    
    if (level === 'error') {
      console.error(`[${level.toUpperCase()}]`, message, data);
    } else {
      console.log(`[${level.toUpperCase()}]`, message);
    }
  }
  
  info(message, data) {
    this.log('info', message, data);
  }
  
  error(message, data) {
    this.log('error', message, data);
  }
  
  warn(message, data) {
    this.log('warn', message, data);
  }
  
  getLogs() {
    return this.logs;
  }
  
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}
