/// Data models for the FLUTTER-FRIENDLY-DUA-2 hierarchical JSON dataset.
///
/// Every field that the schema documents as optional is nullable here, and all
/// localized maps fall back to `en` via [localized] helpers. Missing optional
/// fields never throw — unknown values become null / empty maps.
library dua_models;

/// Safely pick a language from a localized map with English fallback.
String? localized(Map<String, dynamic>? map, String lang) {
  if (map == null) return null;
  final v = map[lang];
  if (v is String && v.trim().isNotEmpty) return v;
  final en = map['en'];
  if (en is String && en.trim().isNotEmpty) return en;
  return null;
}

Map<String, String> _stringMap(dynamic raw) {
  if (raw is Map) {
    return raw.map((k, v) => MapEntry(k.toString(), v?.toString() ?? ''));
  }
  return <String, String>{};
}

/// Reference object: `{ "source": ..., "reference_text": ... }` (either may be null).
class DuaReference {
  final String? source;
  final String? referenceText;
  const DuaReference({this.source, this.referenceText});

  factory DuaReference.fromJson(dynamic raw) {
    if (raw is Map) {
      return DuaReference(
        source: raw['source']?.toString(),
        referenceText: raw['reference_text']?.toString(),
      );
    }
    // Legacy string form tolerated for robustness.
    return DuaReference(referenceText: raw?.toString());
  }

  String get display => referenceText ?? source ?? '';
}

/// A single dua record (schema: schema/dua.schema.json).
class Dua {
  final String id;
  final String categoryId;
  final String? subcategoryId;
  final int order;
  final Map<String, String> title;
  final String arabic;
  final String? transliteration;
  final Map<String, String> translation;
  final DuaReference reference;
  final int? repetitionCount; // legacy `times`
  final String? context;
  final String? sourceText; // verbatim original block (duas1To103)
  final Map<String, String>? translationStatus;

  const Dua({
    required this.id,
    required this.categoryId,
    this.subcategoryId,
    required this.order,
    required this.title,
    required this.arabic,
    this.transliteration,
    required this.translation,
    required this.reference,
    this.repetitionCount,
    this.context,
    this.sourceText,
    this.translationStatus,
  });

  factory Dua.fromJson(Map<String, dynamic> j) => Dua(
        id: j['id'] as String,
        categoryId: (j['category_id'] ?? '') as String,
        subcategoryId: j['subcategory_id'] as String?,
        order: (j['order'] ?? 0) as int,
        title: _stringMap(j['title']),
        arabic: (j['arabic'] ?? '') as String,
        transliteration: j['transliteration'] as String?,
        translation: _stringMap(j['translation']),
        reference: DuaReference.fromJson(j['reference']),
        repetitionCount: j['repetition_count'] as int?,
        context: j['context'] as String?,
        sourceText: j['source_text'] as String?,
        translationStatus:
            j['translation_status'] == null ? null : _stringMap(j['translation_status']),
      );

  String? titleFor(String lang) => localized(title, lang);
  String? translationFor(String lang) => localized(translation, lang);
}

/// Category metadata (schema: schema/category.schema.json).
class CategoryMeta {
  final String id;
  final Map<String, String> name;
  final Map<String, String> description;
  final String? parentId;
  final int order;
  final String? icon;
  final int itemCount;
  final String dataFile;

  const CategoryMeta({
    required this.id,
    required this.name,
    required this.description,
    this.parentId,
    required this.order,
    this.icon,
    required this.itemCount,
    required this.dataFile,
  });

  factory CategoryMeta.fromJson(Map<String, dynamic> j) => CategoryMeta(
        id: j['id'] as String,
        name: _stringMap(j['name']),
        description: _stringMap(j['description']),
        parentId: j['parent_id'] as String?,
        order: (j['order'] ?? 0) as int,
        icon: j['icon'] as String?,
        itemCount: (j['item_count'] ?? 0) as int,
        dataFile: (j['data_file'] ?? 'duas.json') as String,
      );

  String nameFor(String lang) => localized(name, lang) ?? id;
}

/// Master manifest entry (metadata/manifest.json).
class Manifest {
  final String dataset;
  final String schemaVersion;
  final List<String> supportedLanguages;
  final List<CollectionRef> collections;

  const Manifest({
    required this.dataset,
    required this.schemaVersion,
    required this.supportedLanguages,
    required this.collections,
  });

  factory Manifest.fromJson(Map<String, dynamic> j) => Manifest(
        dataset: j['dataset'] as String,
        schemaVersion: j['schema_version'] as String,
        supportedLanguages:
            (j['supported_languages'] as List?)?.map((e) => e.toString()).toList() ?? [],
        collections: ((j['collections'] ?? []) as List)
            .map((e) => CollectionRef.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class CollectionRef {
  final String id;
  final Map<String, String> title;
  final int totalRecords;
  final int totalCategories;
  final String indexFile;
  final String? categoriesIndex;

  const CollectionRef({
    required this.id,
    required this.title,
    required this.totalRecords,
    required this.totalCategories,
    required this.indexFile,
    this.categoriesIndex,
  });

  factory CollectionRef.fromJson(Map<String, dynamic> j) => CollectionRef(
        id: j['id'] as String,
        title: _stringMap(j['title']),
        totalRecords: (j['total_records'] ?? 0) as int,
        totalCategories: (j['total_categories'] ?? 0) as int,
        indexFile: j['index_file'] as String,
        categoriesIndex: j['categories_index'] as String?,
      );
}
