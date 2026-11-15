import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDataStore, dataStore, DataStoreError } from './data-store.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultStaticRoot = path.join(root, 'dist');
const apiPrefix = '/api/v1';
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;

class ApiError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function jsonResponse(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
    ...headers,
  });
  response.end(JSON.stringify(body));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function collectionEntries(index) {
  return [...asArray(index.collections), ...asArray(index.categories)];
}

function getRecords(payload, fields = ['duas', 'dhikr', 'records', 'names', 'prophets', 'parts', 'verses']) {
  if (Array.isArray(payload)) return payload;
  for (const field of fields) {
    if (Array.isArray(payload?.[field])) return payload[field];
  }
  return [];
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/['’‘ʿʻ`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSearchableText(record, language) {
  const texts = [];
  const visit = value => {
    if (typeof value === 'string') {
      texts.push(value);
    } else if (Array.isArray(value)) {
      value.forEach(visit);
    } else if (value && typeof value === 'object') {
      for (const [key, nested] of Object.entries(value)) {
        if (key === 'reference' && nested && typeof nested === 'object') {
          visit(nested);
        } else if (key === language || key === 'ar' || key === 'arabic' || key === 'title' ||
          key === 'translation' || key === 'translations' || key === 'transliteration' ||
          key === 'meaning' || key === 'name' || key === 'text' || key === 'reference') {
          visit(nested);
        }
      }
    }
  };
  visit(record);
  return normalizeText(texts.join(' '));
}

function paginate(items, searchParams) {
  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || DEFAULT_PAGE_SIZE);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
    throw new ApiError('page and limit must be positive integers.');
  }
  const pageSize = Math.min(limit, MAX_PAGE_SIZE);
  const start = (page - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    pagination: {
      page,
      limit: pageSize,
      total: items.length,
      total_pages: Math.ceil(items.length / pageSize),
    },
  };
}

function filterLanguage(records, language) {
  if (!language) return records;
  return records.filter(record => {
    if (language === 'ar' && typeof record?.arabic === 'string') return true;
    const translations = record?.translations || record?.translation || record?.meaning || record?.name;
    return !translations || typeof translations !== 'object' || Object.hasOwn(translations, language);
  });
}

export function createApiServer({
  store = dataStore,
  staticRoot = defaultStaticRoot,
  corsOrigin = process.env.CORS_ORIGIN || '*',
} = {}) {
  const resolvedStaticRoot = staticRoot ? path.resolve(staticRoot) : null;

  async function loadPublicCategories() {
    const [publicIndex, legacyIndex] = await Promise.all([
      store.readJson('duas/public-categories.json'),
      store.readJson('duas/categories/index.json'),
    ]);
    const legacyById = new Map(legacyIndex.categories.map(category => [category.id, category]));
    return publicIndex.categories.map(publicCategory => {
      const source = legacyById.get(publicCategory.source_category_id);
      if (!source) throw new DataStoreError(`Unknown source category: ${publicCategory.source_category_id}`);
      return { ...publicCategory, source };
    });
  }

  async function loadDuaRecords(categoryId) {
    const categories = await loadPublicCategories();
    const selected = categoryId
      ? categories.filter(category => category.id === categoryId || category.source_category_id === categoryId)
      : categories;
    if (categoryId && !selected.length) return null;

    const groups = await Promise.all(selected.map(async category => {
      const payload = await store.readJson(category.source.data_file);
      return getRecords(payload);
    }));
    return groups.flat();
  }

  async function loadSectionEntries(sectionId) {
    const section = await store.loadSectionIndex(sectionId);
    if (!section) return null;
    return { ...section, entries: collectionEntries(section.index) };
  }

  async function loadSectionCategories(sectionId) {
    if (sectionId === 'duas') {
      const categories = await loadPublicCategories();
      return Promise.all(categories.map(async category => ({
        id: category.id,
        source_category_id: category.source_category_id,
        order: category.order,
        collection_id: category.collection_id || null,
        metadata: await store.readJson(category.source.metadata_file),
        item_count: getRecords(await store.readJson(category.source.data_file)).length,
      })));
    }

    const loaded = await loadSectionEntries(sectionId);
    if (!loaded) return null;
    return loaded.entries;
  }

  async function findCollection(collectionId) {
    const manifest = await store.loadManifest();
    for (const section of manifest.main_sections) {
      const loaded = await loadSectionEntries(section.id);
      if (!loaded) continue;
      const entry = loaded.entries.find(item => item.id === collectionId);
      if (entry) return { section: loaded.section, index: loaded.index, entry };

      if (section.id === 'duas') {
        const category = (await loadPublicCategories())
          .find(item => item.id === collectionId || item.source_category_id === collectionId);
        if (category) {
          return {
            section: loaded.section,
            index: loaded.index,
            entry: {
              ...category.source,
              id: category.id,
              source_category_id: category.source_category_id,
              status: 'available',
            },
          };
        }
        const separate = await store.readJson('duas/collections-index.json');
        const standalone = collectionEntries(separate).find(item => item.id === collectionId);
        if (standalone) return { section: loaded.section, index: separate, entry: standalone };
      }
    }
    return null;
  }

  async function loadEntryContent(entry) {
    const payload = await store.readJson(entry.data_file);
    if (!entry.record_id) return payload;
    const record = getRecords(payload).find(item => item.id === entry.record_id);
    if (!record) throw new ApiError('Collection record not found.', 404);
    return record;
  }

  async function validateLanguage(language) {
    if (!language) return null;
    const manifest = await store.loadManifest();
    if (!manifest.supported_languages.includes(language)) {
      throw new ApiError(`Unsupported language: ${language}.`, 400);
    }
    return language;
  }

  async function loadDhikrRecords(categoryId) {
    const loaded = await loadSectionEntries('dhikr');
    if (!loaded) return null;
    const categories = loaded.entries.filter(item => !categoryId || item.id === categoryId);
    if (categoryId && !categories.length) return null;
    const dataFile = categories.find(category => category.data_file)?.data_file;
    if (dataFile && categories.every(category => Array.isArray(category.record_ids))) {
      const sourceRecords = getRecords(await store.readJson(dataFile), ['adhkar', 'dhikr', 'records']);
      const recordIds = new Set(categories.flatMap(category => category.record_ids));
      const records = sourceRecords.filter(record => recordIds.has(record.id));
      return { index: loaded.index, categories, records };
    }
    const recordGroups = await Promise.all(categories.map(async category => {
      if (!category.data_file) return [];
      const records = getRecords(await store.readJson(category.data_file), ['adhkar', 'dhikr', 'records']);
      const recordIds = new Set(category.record_ids || []);
      return recordIds.size ? records.filter(record => recordIds.has(record.id)) : records;
    }));
    const recordsById = new Map(recordGroups.flat().map(record => [record.id, record]));
    return { index: loaded.index, categories, records: [...recordsById.values()] };
  }

  async function searchRecords(query, language) {
    const normalizedQuery = normalizeText(query);
    const collected = [];
    const seenIds = new Set();
    const addRecords = records => {
      for (const record of records) {
        if (!record || typeof record !== 'object') continue;
        const key = record.id ? `${record.collection_id || record.category_id || ''}:${record.id}` : null;
        if (key && seenIds.has(key)) continue;
        if (key) seenIds.add(key);
        if (getSearchableText(record, language).includes(normalizedQuery)) collected.push(record);
      }
    };

    addRecords(await loadDuaRecords());
    const manifest = await store.loadManifest();
    for (const section of manifest.main_sections) {
      if (section.id === 'duas' || section.id === 'dhikr') continue;
      const loaded = await loadSectionEntries(section.id);
      if (!loaded) continue;
      for (const entry of loaded.entries) {
        if (!entry.data_file) continue;
        addRecords(extractRecords(await store.readJson(entry.data_file)));
      }
    }
    const dhikr = await loadDhikrRecords();
    if (dhikr) addRecords(dhikr.records);
    return collected;
  }

  function extractRecords(payload) {
    const records = [];
    const visited = new Set();
    const walk = value => {
      if (!value || typeof value !== 'object' || visited.has(value)) return;
      visited.add(value);
      if (!Array.isArray(value) && value.id && (value.arabic || value.text)) {
        records.push(value);
        return;
      }
      if (Array.isArray(value)) value.forEach(walk);
      else Object.values(value).forEach(walk);
    };
    walk(payload);
    return records;
  }

  async function readStaticFile(requestPath, spaFallback = true) {
    if (!resolvedStaticRoot) return null;
    const decoded = decodeURIComponent(requestPath);
    const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
    const candidate = path.resolve(resolvedStaticRoot, relative);
    if (candidate !== resolvedStaticRoot && !candidate.startsWith(`${resolvedStaticRoot}${path.sep}`)) {
      return null;
    }

    try {
      const info = await stat(candidate);
      if (!info.isFile()) return null;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      if (!spaFallback) return null;
      const indexPath = path.join(resolvedStaticRoot, 'index.html');
      try {
        await stat(indexPath);
        return { file: indexPath, type: 'text/html; charset=utf-8' };
      } catch (indexError) {
        if (indexError.code === 'ENOENT') return null;
        throw indexError;
      }
    }

    const extension = path.extname(candidate).toLowerCase();
    const types = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.woff2': 'font/woff2',
      '.otf': 'font/otf',
    };
    return { file: candidate, type: types[extension] || 'application/octet-stream' };
  }

  async function handleApi(request, response, url) {
    const pathParts = url.pathname.slice(apiPrefix.length).split('/').filter(Boolean).map(decodeURIComponent);
    const [resource, id] = pathParts;
    const language = await validateLanguage(url.searchParams.get('lang'));

    if (resource === 'manifest' && !id) {
      return jsonResponse(response, 200, await store.loadManifest());
    }
    if (resource === 'health' && !id) {
      const manifest = await store.loadManifest();
      return jsonResponse(response, 200, {
        status: 'ok',
        schema_version: manifest.schema_version,
        sections: manifest.main_sections.length,
      });
    }
    if (resource === 'collections' && !id) {
      const manifest = await store.loadManifest();
      const sections = await Promise.all(manifest.main_sections.map(async section => {
        const loaded = await loadSectionEntries(section.id);
        const categories = await loadSectionCategories(section.id);
        const standalone = section.id === 'duas'
          ? collectionEntries(await store.readJson('duas/collections-index.json'))
          : [];
        return { ...section, collections: [...(loaded?.entries || []), ...standalone], categories: categories || [] };
      }));
      return jsonResponse(response, 200, {
        count: sections.reduce((total, section) => total + section.collections.length, 0),
        sections,
      });
    }
    if (resource === 'collections' && id) {
      const result = await findCollection(id);
      if (!result) throw new ApiError('Collection not found.', 404);
      if (!result.entry.data_file) {
        return jsonResponse(response, 200, {
          collection: result.entry,
          content: null,
        });
      }
      return jsonResponse(response, 200, await loadEntryContent(result.entry));
    }
    if (resource === 'categories' && !id) {
      const manifest = await store.loadManifest();
      const sectionId = url.searchParams.get('section');
      if (sectionId) {
        const section = manifest.main_sections.find(item => item.id === sectionId);
        if (!section) throw new ApiError('Section not found.', 404);
        const categories = await loadSectionCategories(sectionId);
        return jsonResponse(response, 200, {
          section: sectionId,
          count: categories.length,
          categories,
        });
      }

      const categories = await Promise.all(manifest.main_sections.map(async section => ({
        ...section,
        categories: await loadSectionCategories(section.id),
      })));
      return jsonResponse(response, 200, { count: categories.length, categories });
    }
    if (resource === 'categories' && id) {
      const section = await store.loadSectionIndex(id);
      if (section) {
        const categories = await loadSectionCategories(id);
        return jsonResponse(response, 200, { ...section.index, categories });
      }
      const categories = await loadPublicCategories();
      const category = categories.find(item => item.id === id || item.source_category_id === id);
      if (category) return jsonResponse(response, 200, await store.readJson(category.source.data_file));
      const collection = await findCollection(id);
      if (!collection) throw new ApiError('Category or collection not found.', 404);
      if (!collection.entry.data_file) {
        return jsonResponse(response, 200, { collection: collection.entry, content: null });
      }
      return jsonResponse(response, 200, await loadEntryContent(collection.entry));
    }
    if (resource === 'duas' && id === 'categories' && pathParts.length === 2) {
      const categories = await loadSectionCategories('duas');
      return jsonResponse(response, 200, { count: categories.length, categories });
    }
    if (resource === 'duas' && !id) {
      const categoryId = url.searchParams.get('category');
      const collectionId = url.searchParams.get('collection');
      const records = await loadDuaRecords(categoryId || (collectionId === 'forty-rabbana' ? 'forty-rabbana' : null));
      if (records === null) throw new ApiError('Category not found.', 404);
      const filtered = filterLanguage(records, language);
      return jsonResponse(response, 200, paginate(filtered, url.searchParams));
    }
    if (resource === 'duas' && id) {
      const records = await loadDuaRecords();
      const record = records.find(item => item.id === id);
      if (!record) throw new ApiError('Dua not found.', 404);
      return jsonResponse(response, 200, record);
    }
    if (resource === 'dhikr') {
      const requestedCategory = id ? null : url.searchParams.get('category');
      const result = await loadDhikrRecords(requestedCategory);
      if (!result) throw new ApiError('Dhikr collection not found.', 404);
      if (id) {
        const record = result.records.find(item => item.id === id);
        if (record) return jsonResponse(response, 200, record);
        const category = result.categories.find(item => item.id === id);
        if (!category) throw new ApiError('Dhikr record or collection not found.', 404);
        const recordIds = new Set(category.record_ids || []);
        const records = result.records.filter(record => recordIds.has(record.id));
        return jsonResponse(response, 200, { ...category, records });
      }
      const paged = paginate(filterLanguage(result.records, language), url.searchParams);
      return jsonResponse(response, 200, {
        section_id: 'dhikr',
        status: result.index.status,
        categories: result.categories,
        ...paged,
      });
    }
    if (['mawlid', 'baith', 'salawath', 'rathib'].includes(resource)) {
      const loaded = await loadSectionEntries(resource);
      if (!loaded) throw new ApiError('Collection section not found.', 404);
      const collectionId = id || url.searchParams.get('collection');
      if (collectionId) {
        const entry = loaded.entries.find(item => item.id === collectionId);
        if (!entry) throw new ApiError('Collection not found.', 404);
        return jsonResponse(response, 200, entry.data_file
          ? await loadEntryContent(entry)
          : { collection: entry, content: null });
      }
      return jsonResponse(response, 200, loaded.index);
    }
    if (['asma-ul-husna', 'asma-ul-anbiya', 'asma-un-nabi'].includes(resource) && !id) {
      const result = await findCollection(resource);
      if (!result || !result.entry.data_file) throw new ApiError('Collection not found.', 404);
      return jsonResponse(response, 200, await store.readJson(result.entry.data_file));
    }
    if (resource === 'search' && !id) {
      const query = url.searchParams.get('q')?.trim();
      if (!query) throw new ApiError('A non-empty q query parameter is required.');
      const results = await searchRecords(query, language || 'en');
      return jsonResponse(response, 200, paginate(results, url.searchParams));
    }

    throw new ApiError('API endpoint not found.', 404);
  }

  return createServer(async (request, response) => {
    const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());
    const requestOrigin = request.headers.origin;
    const allowOrigin = allowedOrigins.includes('*')
      ? '*'
      : (allowedOrigins.includes(requestOrigin) ? requestOrigin : null);
    const corsHeaders = allowOrigin ? {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin',
    } : {};
    for (const [name, value] of Object.entries(corsHeaders)) {
      response.setHeader(name, value);
    }

    if (request.method === 'OPTIONS') {
      response.writeHead(204, corsHeaders);
      response.end();
      return;
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      return jsonResponse(response, 405, { error: { code: 'method_not_allowed', message: 'Use GET.' } }, {
        ...corsHeaders,
        Allow: 'GET, HEAD, OPTIONS',
      });
    }

    let url;
    try {
      url = new URL(request.url, 'http://localhost');
      if (url.pathname === '/health' || url.pathname === `${apiPrefix}/health`) {
        const manifest = await store.loadManifest();
        return jsonResponse(response, 200, {
          status: 'ok',
          schema_version: manifest.schema_version,
          sections: manifest.main_sections.length,
        }, corsHeaders);
      }

      if (url.pathname === apiPrefix || url.pathname.startsWith(`${apiPrefix}/`)) {
        if (url.pathname.endsWith('.json')) {
          const legacyFile = await readStaticFile(url.pathname, false);
          if (!legacyFile) {
            return jsonResponse(response, 404, {
              error: { code: 'not_found', message: 'Legacy JSON resource not found.' },
            }, corsHeaders);
          }
          response.writeHead(200, {
            'Content-Type': legacyFile.type,
            'X-Content-Type-Options': 'nosniff',
            ...corsHeaders,
          });
          if (request.method === 'HEAD') return response.end();
          response.end(await readFile(legacyFile.file));
          return;
        }
        await handleApi(request, response, url);
        return;
      }

      const file = await readStaticFile(url.pathname);
      if (!file) return jsonResponse(response, 404, { error: { code: 'not_found', message: 'Not found.' } }, corsHeaders);
      response.writeHead(200, {
        'Content-Type': file.type,
        'X-Content-Type-Options': 'nosniff',
        ...corsHeaders,
      });
      if (request.method === 'HEAD') return response.end();
      response.end(await readFile(file.file));
    } catch (error) {
      if (error instanceof URIError) {
        return jsonResponse(response, 400, { error: { code: 'invalid_path', message: 'Malformed URL path.' } }, corsHeaders);
      }
      if (error instanceof ApiError || error instanceof DataStoreError) {
        return jsonResponse(response, error.statusCode, {
          error: {
            code: error.statusCode === 404 ? 'not_found' : 'invalid_request',
            message: error.message,
          },
        }, corsHeaders);
      }
      console.error('API request failed:', request.url, error);
      return jsonResponse(response, 500, {
        error: { code: 'internal_error', message: 'The request could not be completed.' },
      }, corsHeaders);
    }
  });
}

const server = createApiServer();
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 10000);
  const host = process.env.HOST || '0.0.0.0';
  server.listen(port, host, () => {
    console.log(`Bismi Radio API listening on http://${host}:${port}`);
  });
}