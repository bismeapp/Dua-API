import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = path.join(root, 'data');
const errors = [];
const warnings = [];
const missingFiles = [];
const recordIds = new Map();
const languageCounts = new Map();
const ajv = new Ajv2020({ allErrors: true, strict: false });

async function readJson(file) {
  const resolved = path.resolve(dataRoot, file.replace(/^data[\\/]/, ''));
  if (resolved !== dataRoot && !resolved.startsWith(`${dataRoot}${path.sep}`)) {
    throw new Error(`Data path escapes the data directory: ${file}`);
  }
  return JSON.parse(await readFile(resolved, 'utf8'));
}

async function exists(file) {
  try {
    return (await stat(path.resolve(dataRoot, file.replace(/^data[\\/]/, '')))).isFile();
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function walkJson(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkJson(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(fullPath);
  }
  return files;
}

function validateWithSchema(validate, value, label) {
  if (validate(value)) return;
  for (const issue of validate.errors || []) {
    errors.push(`${label}${issue.instancePath || ''}: ${issue.message}`);
  }
}

function getRecords(payload) {
  for (const key of ['duas', 'dhikr', 'records', 'names', 'prophets']) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

function getTranslations(record) {
  return record.translations || record.translation || record.meaning || record.name || {};
}

function recordOrder(record) {
  return record.sequence ?? record.order ?? record.number ?? record.verse_number;
}

async function validateIndexFiles(section, index) {
  for (const entry of [...(index.collections || []), ...(index.categories || [])]) {
    for (const field of ['metadata_file', 'data_file', 'record_file']) {
      const file = entry[field];
      if (typeof file === 'string' && !(await exists(file))) {
        missingFiles.push(`${section.id}.${entry.id}.${field}: ${file}`);
      }
    }
  }
}

async function main() {
  const manifestSchema = await readJsonFromRoot('schemas/manifest.schema.json');
  const duaSchema = await readJsonFromRoot('schemas/dua-record.schema.json');
  const dhikrSchema = await readJsonFromRoot('schemas/dhikr-index.schema.json');
  const validateManifest = ajv.compile(manifestSchema);
  const validateDua = ajv.compile(duaSchema);
  const validateDhikr = ajv.compile(dhikrSchema);

  const jsonFiles = await walkJson(dataRoot);
  for (const file of jsonFiles) {
    try {
      JSON.parse(await readFile(file, 'utf8'));
    } catch (error) {
      errors.push(`${path.relative(root, file)}: ${error.message}`);
    }
  }

  const manifest = await readJson('manifest.json');
  validateWithSchema(validateManifest, manifest, 'data/manifest.json');
  const expectedSections = ['duas', 'dhikr', 'mawlid', 'baith', 'salawath', 'rathib', 'others'];
  if (JSON.stringify(manifest.main_sections.map(section => section.id)) !== JSON.stringify(expectedSections)) {
    errors.push(`Main sections must be registered in this order: ${expectedSections.join(', ')}.`);
  }
  for (const section of manifest.main_sections) {
    if (!(await exists(section.index_file))) missingFiles.push(`${section.id}.index_file: ${section.index_file}`);
  }

  const legacyCategories = await readJson('duas/categories/index.json');
  const publicCategories = await readJson('duas/public-categories.json');
  const legacyById = new Map(legacyCategories.categories.map(category => [category.id, category]));
  const publicIds = new Set();
  const allDuas = [];
  const categoryIds = new Set();

  for (const category of publicCategories.categories) {
    if (publicIds.has(category.id)) errors.push(`Duplicate public category ID: ${category.id}`);
    publicIds.add(category.id);
    const source = legacyById.get(category.source_category_id);
    if (!source) {
      errors.push(`Public category ${category.id} has no source category ${category.source_category_id}.`);
      continue;
    }
    categoryIds.add(source.id);
  }
  if (publicCategories.categories.length !== 33) {
    errors.push(`Expected 33 public Dua categories; found ${publicCategories.categories.length}.`);
  }

  const validateCategory = async category => {
    for (const field of ['metadata_file', 'data_file']) {
      if (!(await exists(category[field]))) {
        missingFiles.push(`Dua category ${category.id}.${field}: ${category[field]}`);
      }
    }
    const content = await readJson(category.data_file);
    for (const record of getRecords(content)) {
      allDuas.push(record);
      if (!record.id) errors.push(`Dua category ${category.id} contains a record without an ID.`);
      else if (recordIds.has(record.id)) errors.push(`Duplicate Dua record ID: ${record.id}`);
      else recordIds.set(record.id, category.id);
      validateWithSchema(validateDua, record, `${category.id}/${record.id || 'unknown'}`);
      if (!record.arabic?.trim()) warnings.push(`${category.id}/${record.id}: Arabic text is empty; verify this is an explanatory entry.`);
      if (record.category_id !== category.id) {
        errors.push(`${category.id}/${record.id}: category_id is ${record.category_id}.`);
      }
      const translations = getTranslations(record);
      for (const code of manifest.supported_languages) {
        const present = typeof translations[code] === 'string' && translations[code].trim().length > 0;
        languageCounts.set(code, (languageCounts.get(code) || 0) + Number(present));
      }
    }
  };

  for (const category of legacyCategories.categories) await validateCategory(category);
  if (legacyCategories.total_categories !== legacyCategories.categories.length) {
    errors.push(`Dua category count says ${legacyCategories.total_categories} but index has ${legacyCategories.categories.length}.`);
  }
  if (legacyCategories.total_records !== allDuas.length) {
    errors.push(`Dua record count says ${legacyCategories.total_records} but files contain ${allDuas.length}.`);
  }

  const missingReferences = allDuas.filter(record => !record.reference ||
    (typeof record.reference === 'object' && !record.reference.source && !record.reference.reference_text)).length;
  const repeatedArabic = new Map();
  for (const record of allDuas) {
    if (typeof record.arabic !== 'string' || !record.arabic.trim()) continue;
    const normalized = record.arabic.replace(/\s+/g, ' ').trim();
    repeatedArabic.set(normalized, (repeatedArabic.get(normalized) || 0) + 1);
  }
  const repeatedArabicGroupCount = [...repeatedArabic.values()].filter(count => count > 1).length;

  const rabbana = getRecords(await readJson('duas/categories/rabbana-duas/duas.json'));
  if (rabbana.length !== 40 || new Set(rabbana.map(record => record.id)).size !== 40) {
    errors.push(`The Rabbana collection must contain 40 distinct records; found ${rabbana.length}.`);
  }
  const rabbanaSequence = rabbana.map(recordOrder);
  if (rabbanaSequence.some((value, index) => value !== index + 1)) {
    errors.push('Rabbana sequence must be numbered 1 through 40.');
  }

  const dhikr = await readJson('dhikr/index.json');
  validateWithSchema(validateDhikr, dhikr, 'data/dhikr/index.json');
  if (dhikr.record_count !== 0 || dhikr.categories.some(category => category.record_ids.length > 0)) {
    warnings.push('Dhikr records are indexed; verify each record and its source before marking it verified.');
  } else {
    warnings.push(`Dhikr content is pending verification (${dhikr.categories.length} categories catalogued, 0 records published).`);
  }

  const sectionIndexes = new Map();
  for (const section of manifest.main_sections) {
    const index = await readJson(section.index_file);
    sectionIndexes.set(section.id, index);
    if (section.id !== 'duas') await validateIndexFiles(section, index);
  }
  const mawlid = sectionIndexes.get('mawlid');
  const baith = sectionIndexes.get('baith');
  const salawath = sectionIndexes.get('salawath');
  const rathib = sectionIndexes.get('rathib');
  const others = sectionIndexes.get('others');

  const qaseedah = await readJson('duas/categories/qaseedah-burdah/content.json');
  const qaseedahCount = qaseedah.sections.reduce((sum, section) => sum + section.verses.length, 0);
  const asmaHusnaCount = getRecords(await readJson('asma-ul-husna/names.json')).length;
  const asmaAnbiyaCount = getRecords(await readJson('asma-ul-anbiya/prophets.json')).length;
  const asmaNabiCount = getRecords(await readJson('duas/categories/asma-un-nabi/duas.json')).length;

  if (qaseedahCount !== 167) errors.push(`Qaseedah Burdah expected 167 verses; found ${qaseedahCount}.`);
  if (asmaHusnaCount !== 99) errors.push(`Asma Ul Husna expected 99 names; found ${asmaHusnaCount}.`);
  if (asmaAnbiyaCount !== 25) errors.push(`Asma Ul Anbiya expected 25 names; found ${asmaAnbiyaCount}.`);
  if (missingFiles.length) errors.push(`${missingFiles.length} indexed files are missing.`);

  const availableDhikrCategories = dhikr.categories.filter(category => category.record_ids.length > 0).length;
  const complete = errors.length === 0 &&
    availableDhikrCategories >= 20 &&
    !manifest.main_sections.some(section => ['partial', 'pending_verified_content'].includes(section.status));
  if (!complete) warnings.push('The API/data structure is valid, but the requested collection set is not fully populated and verified.');

  const report = {
    status: errors.length ? 'invalid' : (complete ? 'complete' : 'valid_but_incomplete'),
    schema_version: manifest.schema_version,
    json_files_validated: jsonFiles.length,
    main_sections: manifest.main_sections.length,
    dua_categories: publicCategories.categories.length,
    legacy_dua_categories: legacyCategories.categories.length,
    dua_records: allDuas.length,
    rabbana_records: rabbana.length,
    dhikr_categories: dhikr.categories.length,
    populated_dhikr_categories: availableDhikrCategories,
    dhikr_records: dhikr.record_count,
    mawlid_collections: mawlid.collections.length,
    baith_collections: baith.collections.length,
    qaseedah_burdah_verses: qaseedahCount,
    salawath_collections: salawath.collections.length,
    rathib_collections: rathib.collections.length,
    asma_ul_husna: asmaHusnaCount,
    asma_ul_anbiya: asmaAnbiyaCount,
    asma_un_nabi: asmaNabiCount,
    records_missing_arabic: warnings.filter(warning => warning.includes('Arabic text is empty')).length,
    records_missing_references: missingReferences,
    possible_repeated_arabic_groups: repeatedArabicGroupCount,
    translations_available_by_language: Object.fromEntries(
      manifest.supported_languages.map(code => [code, languageCounts.get(code) || 0])
    ),
    collection_status: Object.fromEntries(manifest.main_sections.map(section => [section.id, section.status])),
    errors,
    warnings,
  };
  console.log(JSON.stringify(report, null, 2));
  if (errors.length) process.exitCode = 1;
}

async function readJsonFromRoot(file) {
  return JSON.parse(await readFile(path.resolve(root, file), 'utf8'));
}

main().catch(error => {
  console.error('Database validation failed:', error);
  process.exitCode = 1;
});