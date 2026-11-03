import 'package:flutter/material.dart';

import '../models/dua_models.dart';

class DuaListTile extends StatelessWidget {
  final Dua dua;
  final VoidCallback onTap;

  const DuaListTile({
    super.key,
    required this.dua,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final title = dua.titleFor('en') ?? 'Dua';
    final translation = dua.translationFor('en');

    return Material(
      color: colors.surface,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                title,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      height: 1.5,
                    ),
              ),
              if (translation != null && translation.trim().isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  translation,
                  textAlign: TextAlign.center,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: colors.onSurfaceVariant,
                        height: 1.6,
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
