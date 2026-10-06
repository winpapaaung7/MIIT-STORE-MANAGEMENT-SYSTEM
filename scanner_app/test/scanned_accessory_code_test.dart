import 'package:flutter_test/flutter_test.dart';
import 'package:scanner_app/services/scanned_accessory_code.dart';

void main() {
  test('preserves legacy plain codes', () {
    expect(accessoryCodeFromScan(' 0001-000001 '), '0001-000001');
  });
  test('extracts codes from local and deployed QR URLs', () {
    for (final host in ['http://localhost:5173', 'https://store.example.com']) {
      expect(accessoryCodeFromScan('$host/scan/0001-000001'), '0001-000001');
    }
    expect(accessoryCodeFromScan('/scan/0001-000001'), '0001-000001');
  });
  test('decodes codes and ignores query, fragment and trailing slash', () {
    expect(
      accessoryCodeFromScan(
        'https://store.example.com/scan/A%20B/?x=1#details',
      ),
      'A B',
    );
  });
  test('preserves unrelated and incomplete URLs', () {
    for (final value in [
      'https://store.example.com/other/0001-000001',
      'https://store.example.com/scan/',
      'https://store.example.com/scan/0001-000001/extra',
    ]) {
      expect(accessoryCodeFromScan(value), value);
    }
  });
}
