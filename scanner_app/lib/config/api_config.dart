import 'package:flutter/foundation.dart';

class ApiConfig {
  const ApiConfig._();

  /// Set this at build or run time, for example:
  /// flutter build appbundle --release --dart-define=API_BASE_URL=https://api.example.edu.mm
  static const _configuredBaseUrl = String.fromEnvironment('API_BASE_URL');

  static String get baseUrl => _configuredBaseUrl.isNotEmpty
      ? _configuredBaseUrl.replaceFirst(RegExp(r'/+$'), '')
      : kReleaseMode
          ? ''
          : 'http://localhost:5000';

  static String? get configurationError {
    if (baseUrl.isEmpty) {
      return 'This release build does not have an API server URL.';
    }

    final uri = Uri.tryParse(baseUrl);
    if (uri == null || !uri.hasScheme || uri.host.isEmpty) {
      return 'The API server URL is invalid.';
    }
    if (kReleaseMode && uri.scheme != 'https') {
      return 'This release build requires an HTTPS API server URL.';
    }
    if (!kReleaseMode && uri.scheme != 'http' && uri.scheme != 'https') {
      return 'The API server URL must begin with http:// or https://.';
    }
    return null;
  }
}
