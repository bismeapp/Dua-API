import 'package:flutter/material.dart';

import 'screens/home_screen.dart';
import 'services/dua_repository.dart';

void main() {
  runApp(const DuaApp());
}

class DuaApp extends StatelessWidget {
  const DuaApp({super.key});

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF005A3C);
    const goldColor = Color(0xFFC9A34A);
    const lightSurface = Color(0xFFF3F7F3);
    final colorScheme = ColorScheme.fromSeed(
      seedColor: primaryColor,
      surface: lightSurface,
    ).copyWith(secondary: goldColor);

    return MaterialApp(
      title: 'Dua Library',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: colorScheme,
        scaffoldBackgroundColor: lightSurface,
      ),
      home: HomeScreen(repository: DuaRepository()),
    );
  }
}
