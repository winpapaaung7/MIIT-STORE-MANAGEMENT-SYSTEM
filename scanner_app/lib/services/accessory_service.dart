import 'dart:convert';
import 'dart:async';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/accessory.dart';

class AccessoryNotFoundException implements Exception {}

class AccessoryConnectionException implements Exception {}

class AccessoryServerException implements Exception {}

class AccessoryService {
  AccessoryService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<Accessory> getByCode(String code) async {
    final uri = Uri.parse(
      '${ApiConfig.baseUrl}/api/accessories/by-code/${Uri.encodeComponent(code)}',
    );
    late http.Response response;
    try {
      response = await _client.get(uri).timeout(const Duration(seconds: 10));
    } on SocketException {
      throw AccessoryConnectionException();
    } on http.ClientException {
      throw AccessoryConnectionException();
    } on TimeoutException {
      throw AccessoryConnectionException();
    }

    if (response.statusCode == 200) {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      final accessory = body['accessory'] as Map<String, dynamic>?;
      if (body['ok'] != true || accessory == null) {
        throw AccessoryServerException();
      }
      return Accessory.fromJson(accessory);
    }
    if (response.statusCode == 404) throw AccessoryNotFoundException();
    throw AccessoryServerException();
  }
}
