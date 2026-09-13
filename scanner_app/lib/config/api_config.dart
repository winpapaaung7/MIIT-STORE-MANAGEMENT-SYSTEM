class ApiConfig {
  const ApiConfig._();

  /// Override when running the app, for example:
  /// flutter run --dart-define=API_BASE_URL=http://YOUR_SERVER_IP:5000
  ///
  /// The fallback is suitable only when the API and app run on the same
  /// machine (for example, Flutter desktop). A physical phone must receive
  /// the server's reachable LAN URL through --dart-define.
  static const baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:5000',
  );
}
