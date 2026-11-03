import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultDataRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const cache = new Map();

export class DataStoreError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'DataStoreError';
    this.statusCode = statusCode;
  }
}

export function createDataStore(dataRoot = defaultDataRoot) {
  const root = path.resolve(dataRoot);

  function resolveFile(file) {
    if (typeof file !== 'string' || !file.trim()) {
      throw new DataStoreError('A data file path is required.');
    }

    const relative = file.replace(/^data[\\/]/, '');
    const resolved = path.resolve(root, relative);
    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
      throw new DataStoreError('The requested data file is outside the data directory.', 400);
    }
    return resolved;
  }

  async function readJson(file) {
    const resolved = resolveFile(file);
    let fileStats;
    try {
      fileStats = await stat(resolved);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new DataStoreError(`Data file not found: ${file}`, 404);
      }
      throw error;
    }

    if (!fileStats.isFile()) {
      throw new DataStoreError(`Data path is not a file: ${file}`, 404);
    }

    const cached = cache.get(resolved);
    if (cached && cached.mtimeMs === fileStats.mtimeMs && cached.size === fileStats.size) {
      return cached.value;
    }

    let value;
    try {
      value = JSON.parse(await readFile(resolved, 'utf8'));
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new DataStoreError(`Invalid JSON in data file: ${file}`);
      }
      throw error;
    }

    cache.set(resolved, { mtimeMs: fileStats.mtimeMs, size: fileStats.size, value });
    return value;
  }

  return {
    root,
    readJson,
    loadManifest: () => readJson('manifest.json'),
    loadSectionIndex: async sectionId => {
      const manifest = await readJson('manifest.json');
      const section = manifest.main_sections.find(item => item.id === sectionId);
      if (!section) return null;
      return { section, index: await readJson(section.index_file) };
    },
  };
}

export const dataStore = createDataStore();