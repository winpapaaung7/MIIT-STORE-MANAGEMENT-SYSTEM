class ApiConfig {
  const ApiConfig._();

  /// Override when running the app, for example:
  /// flutter run --dart-define=API_BASE_URL=http://192.168.154.1:5000
  static const baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://192.168.168.208:5000',
  );
}
