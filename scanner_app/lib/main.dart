import 'package:flutter/material.dart';

import 'screens/scanner_screen.dart';

void main() {
  runApp(const MiitStoreScannerApp());
}

class MiitStoreScannerApp extends StatelessWidget {
  const MiitStoreScannerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MIIT Store Scanner',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0F172A)),
        useMaterial3: true,
      ),
      home: const ScannerScreen(),
    );
  }
}
