import 'package:flutter/material.dart';

import '../models/dua_models.dart';
import '../services/dua_repository.dart';
import '../widgets/app_header.dart';
import '../widgets/category_card.dart';
import 'category_duas_screen.dart';

class CategoryListScreen extends StatefulWidget {
  final DuaRepository repository;

  const CategoryListScreen({super.key, required this.repository});

  @override
  State<CategoryListScreen> createState() => _CategoryListScreenState();
}

class _CategoryListScreenState extends State<CategoryListScreen> {
  late Future<List<CategoryMeta>> _categories;

  @override
  void initState() {
    super.initState();
    _categories = widget.repository.loadCategories();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const AppHeader(title: 'Categories'),
      body: FutureBuilder<List<CategoryMeta>>(
        future: _categories,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return _LoadError(message: 'Could not load categories: ${snapshot.error}');
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.data!.isEmpty) {
            return const Center(child: Text('No categories available.'));
          }

          final categories = snapshot.data!;
          return Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 760),
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 28,
                ),
                itemCount: categories.length,
                separatorBuilder: (_, __) => const SizedBox(height: 14),
                itemBuilder: (context, index) {
                  final category = categories[index];
                  return CategoryCard(
                    name: category.nameFor('en'),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => CategoryDuasScreen(
                            category: category,
                            repository: widget.repository,
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          );
        },
      ),
    );
  }
}

class _LoadError extends StatelessWidget {
  final String message;

  const _LoadError({required this.message});

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            message,
            textAlign: TextAlign.center,
            style: TextStyle(color: Theme.of(context).colorScheme.error),
          ),
        ),
      );
}
