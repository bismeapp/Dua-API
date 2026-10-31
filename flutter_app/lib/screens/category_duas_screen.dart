import 'package:flutter/material.dart';

import '../models/dua_models.dart';
import '../services/dua_repository.dart';
import '../widgets/app_header.dart';
import '../widgets/dua_list_tile.dart';
import 'dua_detail_screen.dart';

class CategoryDuasScreen extends StatefulWidget {
  final CategoryMeta category;
  final DuaRepository repository;

  const CategoryDuasScreen({
    super.key,
    required this.category,
    required this.repository,
  });

  @override
  State<CategoryDuasScreen> createState() => _CategoryDuasScreenState();
}

class _CategoryDuasScreenState extends State<CategoryDuasScreen> {
  late Future<List<Dua>> _duas;

  @override
  void initState() {
    super.initState();
    _duas = widget.repository.loadDuas(widget.category.id);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppHeader(title: widget.category.nameFor('en')),
      body: FutureBuilder<List<Dua>>(
        future: _duas,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  'Could not load duas: ${snapshot.error}',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            );
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.data!.isEmpty) {
            return const Center(child: Text('No duas in this category.'));
          }

          final duas = snapshot.data!;
          return Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 760),
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 24,
                ),
                itemCount: duas.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final dua = duas[index];
                  return DuaListTile(
                    dua: dua,
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => DuaDetailScreen(
                            dua: dua,
                            category: widget.category,
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
