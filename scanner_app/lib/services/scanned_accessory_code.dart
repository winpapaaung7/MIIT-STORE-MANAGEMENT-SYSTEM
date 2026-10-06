/// Accept both legacy plain codes and the website's /scan/<code> labels.
/// The label's host is never used as the API server.
String accessoryCodeFromScan(String value) {
  final text = value.trim();
  final uri = Uri.tryParse(text);
  if (uri == null) return text;

  final isWebUrl =
      (uri.scheme == 'http' || uri.scheme == 'https') && uri.host.isNotEmpty;
  if (!isWebUrl && !text.startsWith('/scan/')) return text;

  try {
    final segments = uri.pathSegments;
    if (segments.length >= 2 &&
        segments[0] == 'scan' &&
        segments[1].isNotEmpty &&
        segments.skip(2).every((segment) => segment.isEmpty)) {
      return segments[1];
    }
  } on FormatException {
    return text;
  }
  return text;
}
