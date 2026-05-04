import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

export function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readJsonFile<T>(filename: string): T {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return {} as T;
  }
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

export function writeJsonFile(filename: string, data: any): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
}
