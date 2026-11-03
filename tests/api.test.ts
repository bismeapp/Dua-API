import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import path from 'node:path';
import { createApiServer } from '../api/server.js';
import ashrakalBaithSource from '../data/duas/categories/mawlid/ashrakal_baith.json';
import adhkarSource from '../data/dhikr/daily-dhikir.json';
import dhikrIndex from '../data/dhikr/index.json';
import manqoosSource from '../data/duas/categories/mawlid/manqoos.json';
import burdahSource from '../data/duas/categories/qaseedah-burdah/content.json';
import rabbanaSource from '../data/duas/categories/rabbana-duas/duas.json';
import salawatSource from '../data/duas/categories/salawat/duas.json';
import rathibSource from '../data/rathib/index.json';

const server = createApiServer({ staticRoot: null });
let baseUrl = '';

beforeAll(async () => {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('API test server did not bind a TCP port.');
  baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
});

async function get(path: string) {
  const response = await fetch(`${baseUrl}${path}`);
  return { response, body: await response.json() };
}

describe('JSON collections API', () => {
  it('serves the seven main sections in the requested order', async () => {
    const { response, body } = await get('/manifest');
    expect(response.status).toBe(200);
    expect(body.main_sections.map((section: { id: string }) => section.id)).toEqual([
      'duas', 'dhikr', 'mawlid', 'baith', 'salawath', 'rathib', 'others',
    ]);
  });

  it('lists the supplied categories under each main section', async () => {
    const { response, body } = await get('/categories');
    expect(response.status).toBe(200);
    expect(body.categories.map((category: { id: string }) => category.id)).toEqual([
      'duas', 'dhikr', 'mawlid', 'baith', 'salawath', 'rathib', 'others',
    ]);
    expect(body.categories.find((category: { id: string }) => category.id === 'duas').categories).toHaveLength(33);
    expect(body.categories.find((category: { id: string }) => category.id === 'dhikr').categories).toHaveLength(10);
    expect(body.categories.find((category: { id: string }) => category.id === 'mawlid').categories.map(
      (collection: { id: string }) => collection.id
    )).toEqual(['manqoos-mawlid', 'subuhana-mawlid']);
    expect(body.categories.find((category: { id: string }) => category.id === 'baith').categories.map(
      (collection: { id: string }) => collection.id
    )).toEqual(['ashrakal-baith', 'qaseedah-burdah']);
    expect(body.categories.find((category: { id: string }) => category.id === 'salawath').categories).toHaveLength(11);
    expect(body.categories.find((category: { id: string }) => category.id === 'rathib').categories).toHaveLength(2);
    expect(body.categories.find((category: { id: string }) => category.id === 'others').categories).toHaveLength(3);
  });

  it('retains the complete Rabbana collection and supports category pagination', async () => {
    const { response, body } = await get('/collections/forty-rabbana');
    expect(response.status).toBe(200);
    expect(body).toEqual(rabbanaSource);

    const page = await get('/duas?category=forty-rabbana&page=2&limit=5');
    expect(page.response.status).toBe(200);
    expect(page.body.data).toHaveLength(5);
    expect(page.body.data[0].id).toBe(rabbanaSource.duas[5].id);
    expect(page.body.pagination).toEqual({ page: 2, limit: 5, total: 40, total_pages: 8 });
  });

  it('preserves existing Mawlid and Burdah JSON structures', async () => {
    const manqoos = await get('/mawlid?collection=manqoos-mawlid');
    expect(manqoos.response.status).toBe(200);
    expect(manqoos.body).toEqual(manqoosSource);

    const burdah = await get('/baith/qaseedah-burdah');
    expect(burdah.response.status).toBe(200);
    expect(burdah.body).toEqual(burdahSource);
  });

  it('serves Manqoos, Subuhana and restored Ashrakal content directly', async () => {
    const mawlid = await get('/mawlid/manqoos-mawlid');
    expect(mawlid.response.status).toBe(200);
    expect(mawlid.body).toEqual(manqoosSource);

    const subuhana = await get('/mawlid/subuhana-mawlid');
    expect(subuhana.response.status).toBe(200);
    expect(subuhana.body.id).toBe('subuhana-mawlid');

    const ashrakal = await get('/baith/ashrakal-baith');
    expect(ashrakal.response.status).toBe(200);
    expect(ashrakal.body).toEqual(ashrakalBaithSource);
  });

  it('lists all eleven Salawat records without the duplicate container', async () => {
    const index = await get('/salawath');
    expect(index.response.status).toBe(200);
    expect(index.body.collections).toHaveLength(11);
    expect(index.body.collections.map((entry: { record_id: string }) => entry.record_id)).toEqual(
      salawatSource.duas.map((record: { id: string }) => record.id)
    );
    for (const record of salawatSource.duas) {
      const response = await get(`/salawath/${record.id}`);
      expect(response.response.status).toBe(200);
      expect(response.body).toEqual(record);
    }
    expect(index.body.collections.map((entry: { record_id: string }) => entry.record_id))
      .toContain('alam-salawath');
    const alam = salawatSource.duas.find((record: { id: string }) => record.id === 'alam-salawath');
    expect(Object.keys(alam.title).sort()).toEqual(['ar', 'bn', 'en', 'fr', 'id', 'ml', 'ms', 'ta', 'tr', 'ur']);
    expect(Object.keys(alam.translation).sort()).toEqual(['ar', 'bn', 'en', 'fr', 'id', 'ml', 'ms', 'ta', 'tr', 'ur']);
    expect(alam.translation.ar).toBe(alam.arabic);
    expect(alam.translation_status).toContain('human review required');
  });

  it('lists Ratib al-Haddad as the Arabic PDF in the existing Rathib section', async () => {
    const { response, body } = await get('/rathib');
    expect(response.status).toBe(200);
    expect(body.collections).toHaveLength(2);
    expect(body.collections[0]).toEqual(rathibSource.collections[0]);
    expect(body.collections[1]).toEqual(rathibSource.collections[1]);
    expect(body.collections[1]).toMatchObject({
      id: 'rathib-haddad',
      status: 'available',
      pdf_file: '/rathib/ratib-al-haddad.pdf',
      metadata: {
        content_language: 'ar',
        translation_status: 'original_arabic_only',
      },
    });
    const supportedLanguages = ['ar', 'bn', 'en', 'fr', 'id', 'ml', 'ms', 'ta', 'tr', 'ur'];
    expect(Object.keys(body.collections[1].title).sort())
      .toEqual(supportedLanguages);
    expect(Object.keys(body.collections[1].metadata.description).sort())
      .toEqual(supportedLanguages);
    expect(body.collections[1].metadata.description.en).toContain('Original Arabic PDF');
  });

  it('serves the Ratib al-Haddad PDF with the PDF MIME type', async () => {
    const staticServer = createApiServer({ staticRoot: path.resolve('public') });
    await new Promise<void>(resolve => staticServer.listen(0, '127.0.0.1', resolve));
    const address = staticServer.address();
    if (!address || typeof address === 'string') throw new Error('Static test server did not bind a TCP port.');

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/rathib/ratib-al-haddad.pdf`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/pdf');
      const signature = Buffer.from(await response.arrayBuffer()).subarray(0, 5).toString('ascii');
      expect(signature).toBe('%PDF-');
    } finally {
      await new Promise<void>((resolve, reject) => {
        staticServer.close(error => error ? reject(error) : resolve());
      });
    }
  });

  it('returns the updated Day of Judgment label for every supported language', async () => {
    const { response, body } = await get('/categories?section=duas');
    expect(response.status).toBe(200);
    const category = body.categories.find((entry: { id: string }) => entry.id === 'hereafter');
    expect(category.metadata.name).toEqual({
      en: 'Day of Judgment',
      ta: 'மறுமை நாள்',
      ml: 'അന്ത്യദിനം',
      ar: 'يوم القيامة',
      ur: 'یومِ قیامت',
      fr: 'Jour du Jugement',
      tr: 'Kıyamet Günü',
      id: 'Hari Kiamat',
      bn: 'কিয়ামতের দিন',
      ms: 'Hari Kiamat',
    });
  });

  it('serves the ten Daily Dhikir records directly without duplicates', async () => {
    const { response, body } = await get('/dhikr');
    expect(response.status).toBe(200);
    expect(body.categories).toHaveLength(10);
    expect(body.data.map((record: { id: string }) => record.id)).toEqual(
      adhkarSource.adhkar.map((record: { id: string }) => record.id)
    );
    expect(body.status).toBe('available');

    const category = await get('/dhikr?category=subhanallah');
    expect(category.response.status).toBe(200);
    expect(category.body.data.map((record: { id: string }) => record.id)).toEqual(['subhanallah']);

    const detail = await get('/dhikr/subhanallah');
    expect(detail.response.status).toBe(200);
    expect(detail.body.id).toBe('subhanallah');

    for (const language of ['ar', 'en', 'ta', 'ml', 'ur', 'fr', 'tr', 'id', 'bn', 'ms']) {
      const localized = await get(`/dhikr?lang=${language}`);
      expect(localized.response.status).toBe(200);
      expect(localized.body.data).toHaveLength(10);
      for (const record of localized.body.data) {
        expect(record.translation[language]).toBeTruthy();
      }
    }

    expect(dhikrIndex.categories).toHaveLength(10);
    expect(dhikrIndex.categories.map((entry: { record_ids: string[] }) => entry.record_ids[0]))
      .toEqual(adhkarSource.adhkar.map((record: { id: string }) => record.id));
  });

  it('does not return records without a translation in the selected API language', async () => {
    const data = await get('/dhikr?lang=fr');
    expect(data.response.status).toBe(200);
    for (const record of data.body.data) {
      expect(record.translation.fr).toBeTruthy();
    }
  });

  it('serves the updated localized section labels', async () => {
    const manifest = await get('/manifest');
    const dhikr = manifest.body.main_sections.find((section: { id: string }) => section.id === 'dhikr');
    const mawlid = manifest.body.main_sections.find((section: { id: string }) => section.id === 'mawlid');
    expect(dhikr.title.en).toBe('Daily Dhikir');
    expect(mawlid.title.en).toBe('Moulid');
    expect(Object.keys(dhikr.title)).toHaveLength(10);
    expect(Object.keys(mawlid.title)).toHaveLength(10);
  });

  it('validates every supported translation and direct record mapping', async () => {
    const { response, body } = await get('/dhikr');
    expect(response.status).toBe(200);
    const mappedIds = dhikrIndex.categories.map((category: { record_ids: string[] }) => {
      expect(category.record_ids).toHaveLength(1);
      return category.record_ids[0];
    });
    expect(mappedIds).toEqual(adhkarSource.adhkar.map((record: { id: string }) => record.id));
    for (const record of body.data) {
      expect(record.category_ids).toEqual(['daily-dhikir']);
      expect(record.translation).toEqual(expect.objectContaining({
        ar: expect.any(String),
        en: expect.any(String),
        ta: expect.any(String),
        ml: expect.any(String),
        ur: expect.any(String),
        fr: expect.any(String),
        tr: expect.any(String),
        id: expect.any(String),
        bn: expect.any(String),
        ms: expect.any(String),
      }));
    }
  });

  it('ensures all index record references resolve to the source file', async () => {
    const records = new Set(adhkarSource.adhkar.map((record: { id: string }) => record.id));
    for (const category of dhikrIndex.categories) {
      for (const id of category.record_ids) {
        expect(records.has(id)).toBe(true);
      }
    }
    const { response, body } = await get('/dhikr?category=not-a-dhikr');
    expect(response.status).toBe(404);
    expect(body.data).toBeUndefined();
  });

  it('preserves direct collections after pagination', async () => {
    const page = await get('/dhikr?page=1&limit=3');
    expect(page.response.status).toBe(200);
    expect(page.body.data).toHaveLength(3);
    expect(page.body.pagination.total).toBe(10);
  });

  it('supports direct per-record reference lookups', async () => {
    for (const record of adhkarSource.adhkar) {
      const result = await get(`/dhikr/${record.id}`);
      expect(result.response.status).toBe(200);
      expect(result.body).toEqual(record);
    }
  });

  it('keeps the Dhikr source collection limited to the ten supplied entries', async () => {
    const response = await get('/dhikr');
    expect(response.body.data.map((record: { id: string }) => record.id)).toEqual(
      adhkarSource.adhkar.map((record: { id: string }) => record.id)
    );
    expect(response.body.data.some((record: { id: string }) => record.id === 'wake_up_praise')).toBe(false);
  });

  it('returns the daily section in localized collection listings', async () => {
    const { response, body } = await get('/categories');
    expect(response.status).toBe(200);
    const section = body.categories.find((category: { id: string }) => category.id === 'dhikr');
    expect(section.categories).toHaveLength(10);
    expect(section.title.en).toBe('Daily Dhikir');
  });

  it('serves each record through category filtering', async () => {
    const categoryResponses = await Promise.all(dhikrIndex.categories.map(async (category: { id: string }) => {
      const { response, body } = await get(`/dhikr?category=${category.id}`);
      expect(response.status).toBe(200);
      return body.data.map((record: { id: string }) => record.id);
    }));
    expect(categoryResponses).toEqual(adhkarSource.adhkar.map((record: { id: string }) => [record.id]));
  });

  it('rejects a language that is not supported by the app', async () => {
    const { response, body } = await get('/duas?category=forty-rabbana&lang=hi');
    expect(response.status).toBe(400);
    expect(body.error.message).toContain('Unsupported language');
  });

  it('searches Arabic, transliteration, and translations and validates pagination', async () => {
    const query = new URLSearchParams({ q: 'neighbours of Dhu Salam', limit: '1' });
    const result = await get(`/search?${query}`);
    expect(result.response.status).toBe(200);
    expect(result.body.data[0].arabic).toContain('أَمِنْ تَذَكُّرِ');
    expect(result.body.pagination.total).toBeGreaterThan(0);

    const invalid = await get('/duas?page=0');
    expect(invalid.response.status).toBe(400);
    expect(invalid.body.error.code).toBe('invalid_request');
  });

  it('returns explicit errors for missing resources and required search queries', async () => {
    const missing = await get('/duas/not-a-real-record');
    expect(missing.response.status).toBe(404);
    expect(missing.body.error.code).toBe('not_found');

    const search = await get('/search');
    expect(search.response.status).toBe(400);
  });

  it('provides a health check and CORS response', async () => {
    const health = await get('/health');
    expect(health.response.status).toBe(200);
    expect(health.body.status).toBe('ok');

    const cors = await fetch(`${baseUrl}/manifest`, { headers: { Origin: 'https://example.test' } });
    expect(cors.headers.get('access-control-allow-origin')).toBe('*');
  });
});