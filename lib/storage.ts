import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BUNDLED_DATA_DIR = path.join(process.cwd(), 'data');
const RUNTIME_DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'apisaurus-data')
  : BUNDLED_DATA_DIR;

function ensureRuntimeDataDir() {
  if (!fs.existsSync(RUNTIME_DATA_DIR)) {
    fs.mkdirSync(RUNTIME_DATA_DIR, { recursive: true });
  }
}

function getRuntimeFilePath(filename: string) {
  return path.join(RUNTIME_DATA_DIR, filename);
}

function getBundledFilePath(filename: string) {
  return path.join(BUNDLED_DATA_DIR, filename);
}

function ensureSeedFile<T>(filename: string, defaultValue: T) {
  ensureRuntimeDataDir();

  const runtimeFilePath = getRuntimeFilePath(filename);
  if (fs.existsSync(runtimeFilePath)) {
    return runtimeFilePath;
  }

  const bundledFilePath = getBundledFilePath(filename);
  if (bundledFilePath !== runtimeFilePath && fs.existsSync(bundledFilePath)) {
    fs.copyFileSync(bundledFilePath, runtimeFilePath);
    return runtimeFilePath;
  }

  fs.writeFileSync(runtimeFilePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
  return runtimeFilePath;
}

export function ensureDataDir() {
  ensureRuntimeDataDir();
}

export function readJsonFile<T>(filename: string, defaultValue: T): T {
  const filePath = ensureSeedFile(filename, defaultValue);

  try {
    const data = fs.readFileSync(filePath, 'utf-8').trim();
    return data ? JSON.parse(data) as T : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function writeJsonFile(filename: string, data: unknown): void {
  ensureRuntimeDataDir();
  const filePath = getRuntimeFilePath(filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
}
