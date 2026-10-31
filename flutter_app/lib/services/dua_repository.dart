/// On-demand loader for the hierarchical dataset bundled under `assets/json/`.
///
/// Design notes:
///  * Only the manifest and the small category indexes are read at startup.
///  * Individual `duas.json` files are loaded lazily per category, so the whole
///    dataset is never held in memory at once.
///  * Works with any asset backend; the default reads from rootBundle paths of
///    the form `assets/json/<repo-relative path>`.
library dua_repository;

import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

import '../models/dua_models.dart';

typedef AssetReader = Future<String> Function(String assetPath);

class DuaRepository {
  final String assetRoot;
  final AssetReader _read;
  final Map<String, List<Dua>> _categoryCache = {};

  DuaRepository({this.assetRoot = 'assets/json', AssetReader? reader})
      : _read = reader ?? ((path) => rootBundle.loadString(path));

  Future<Map<String, dynamic>> _json(String relPath) async {
    final text = await _read('$assetRoot/$relPath');
    return jsonDecode(text) as Map<String, dynamic>;
  }

  /// Master manifest — entry point for discovery (metadata/manifest.json).
  Future<Manifest> loadManifest() async =>
      Manifest.fromJson(await _json('metadata/manifest.json'));

  /// Category metadata for one duas category.
  Future<CategoryMeta> loadCategoryMeta(String categoryId) async => CategoryMeta.fromJson(
      await _json('data/duas/categories/$categoryId/metadata.json'));

  /// Duas of one category, loaded on demand and cached.
  Future<List<Dua>> loadDuas(String categoryId) async {
    final cached = _categoryCache[categoryId];
    if (cached != null) return cached;
    final file = await _json('data/duas/categories/$categoryId/duas.json');
    final list = ((file['duas'] ?? []) as List)
        .map((e) => Dua.fromJson(e as Map<String, dynamic>))
        .toList()
      ..sort((a, b) => a.order.compareTo(b.order));
    _categoryCache[categoryId] = list;
    return list;
  }

  /// All category ids of the `duas` collection in display order.
  Future<List<String>> categoryIds() async {
    final index = await _json('data/duas/categories/index.json');
    final cats = ((index['categories'] ?? []) as List)
        .map((e) => e as Map<String, dynamic>)
        .toList()
      ..sort((a, b) => (a['order'] as int).compareTo(b['order'] as int));
    return cats.map((e) => e['id'] as String).toList();
  }

  Future<List<CategoryMeta>> loadCategories() async {
    final ids = await categoryIds();
    return Future.wait(ids.map(loadCategoryMeta));
  }

  // --- Non-dua collections -------------------------------------------------

  Future<List<Map<String, dynamic>>> loadHusnaNames() async {
    final f = await _json('data/asma-ul-husna/names.json');
    return (f['names'] as List).cast<Map<String, dynamic>>();
  }

  Future<List<Map<String, dynamic>>> loadAnbiyaProphets() async {
    final f = await _json('data/asma-ul-anbiya/prophets.json');
    return (f['prophets'] as List).cast<Map<String, dynamic>>();
  }

  Future<List<Dua>> loadRabbanaDuas() => loadDuas('rabbana-duas');

  void clearCache() => _categoryCache.clear();
}
