import 'package:flutter/material.dart';

import '../models/dua_models.dart';
import '../widgets/app_header.dart';

class DuaDetailScreen extends StatelessWidget {
  final Dua dua;
  final CategoryMeta category;

  const DuaDetailScreen({
    super.key,
    required this.dua,
    required this.category,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final title = dua.titleFor('en') ?? category.nameFor('en');
    final translation = dua.translationFor('en');

    return Scaffold(
      appBar: AppHeader(title: title),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 760),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(24, 28, 24, 40),
            children: [
              Text(
                category.nameFor('en'),
                textAlign: TextAlign.center,
                style: theme.textTheme.labelLarge?.copyWith(
                  color: theme.colorScheme.primary,
                  letterSpacing: 0.4,
                ),
              ),
              const SizedBox(height: 28),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 32,
                ),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: theme.colorScheme.outlineVariant),
                ),
                child: Text(
                  dua.arabic,
                  textAlign: TextAlign.center,
                  textDirection: TextDirection.rtl,
                  style: theme.textTheme.headlineMedium?.copyWith(
                    color: theme.colorScheme.onSurface,
                    height: 1.9,
                  ),
                ),
              ),
              if (dua.transliteration != null &&
                  dua.transliteration!.trim().isNotEmpty) ...[
                const SizedBox(height: 28),
                Text(
                  dua.transliteration!,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyLarge?.copyWith(height: 1.8),
                ),
              ],
              if (translation != null && translation.trim().isNotEmpty) ...[
                const SizedBox(height: 24),
                Text(
                  translation,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.titleMedium?.copyWith(height: 1.8),
                ),
              ],
              if (dua.reference.display.trim().isNotEmpty) ...[
                const SizedBox(height: 28),
                Text(
                  dua.reference.display,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                    height: 1.6,
                  ),
                ),
              ],
              if (dua.repetitionCount != null && dua.repetitionCount! > 1) ...[
                const SizedBox(height: 16),
                Text(
                  'Repeat ${dua.repetitionCount} times',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.labelLarge?.copyWith(
                    color: theme.colorScheme.primary,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
