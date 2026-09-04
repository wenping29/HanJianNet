import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config.dart';
import '../models/models.dart';

class ApiException implements Exception {
  final int? status;
  final String message;

  ApiException(this.message, [this.status]);

  @override
  String toString() => message;
}

/// Web API 客户端：REST + JWT。
class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  String _baseUrl = kDefaultApiBaseUrl;
  String? _token;

  String get baseUrl => _baseUrl;
  String? get token => _token;
  bool get hasToken => _token != null && _token!.isNotEmpty;

  void configure({String? baseUrl, String? token}) {
    if (baseUrl != null && baseUrl.isNotEmpty) {
      _baseUrl = baseUrl.endsWith('/')
          ? baseUrl.substring(0, baseUrl.length - 1)
          : baseUrl;
    }
    _token = token;
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (hasToken) 'Authorization': 'Bearer $_token',
      };

  Future<dynamic> _run(Future<http.Response> Function() fn) async {
    http.Response res;
    try {
      res = await fn().timeout(const Duration(seconds: 15));
    } catch (_) {
      throw ApiException('网络请求失败，请检查 API 地址与网络连接');
    }
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (res.body.isEmpty) return null;
      return jsonDecode(utf8.decode(res.bodyBytes));
    }
    String message = '请求失败（${res.statusCode}）';
    try {
      final body = jsonDecode(utf8.decode(res.bodyBytes));
      if (body is Map) {
        message = (body['message'] ?? body['error'] ?? message).toString();
      }
    } catch (_) {}
    throw ApiException(message, res.statusCode);
  }

  // ---- 认证 ----

  Future<({String token, User user})> register({
    required String username,
    required String email,
    required String password,
  }) async {
    final data = await _run(() => http.post(
          Uri.parse('$_baseUrl/api/auth/register'),
          headers: _headers,
          body: jsonEncode({'username': username, 'email': email, 'password': password}),
        )) as Map<String, dynamic>;
    return (token: data['token'] as String, user: User.fromJson(data['user'] as Map<String, dynamic>));
  }

  Future<({String token, User user})> login({
    required String account,
    required String password,
  }) async {
    final data = await _run(() => http.post(
          Uri.parse('$_baseUrl/api/auth/login'),
          headers: _headers,
          body: jsonEncode({'account': account, 'password': password}),
        )) as Map<String, dynamic>;
    return (token: data['token'] as String, user: User.fromJson(data['user'] as Map<String, dynamic>));
  }

  Future<User> me() async {
    final data = await _run(() => http.get(
          Uri.parse('$_baseUrl/api/auth/me'),
          headers: _headers,
        )) as Map<String, dynamic>;
    return User.fromJson(data['user'] as Map<String, dynamic>);
  }

  // ---- 档案（公开） ----

  Future<PaginatedTraitors> listTraitors({
    String? name,
    int? yearFrom,
    int? yearTo,
    String? event,
    String? period,
    String? nativePlace,
    int page = 1,
    int pageSize = 20,
  }) async {
    final q = <String, String>{
      if (name != null && name.isNotEmpty) 'name': name,
      if (yearFrom != null) 'yearFrom': '$yearFrom',
      if (yearTo != null) 'yearTo': '$yearTo',
      if (event != null && event.isNotEmpty) 'event': event,
      if (period != null && period.isNotEmpty) 'period': period,
      if (nativePlace != null && nativePlace.isNotEmpty) 'nativePlace': nativePlace,
      'page': '$page',
      'pageSize': '$pageSize',
    };
    final uri = Uri.parse('$_baseUrl/api/traitors').replace(queryParameters: q);
    final data = await _run(() => http.get(uri, headers: _headers)) as Map<String, dynamic>;
    return PaginatedTraitors.fromJson(data);
  }

  Future<Traitor> getTraitor(String id) async {
    final data = await _run(() => http.get(
          Uri.parse('$_baseUrl/api/traitors/$id'),
          headers: _headers,
        )) as Map<String, dynamic>;
    return Traitor.fromJson(data['traitor'] as Map<String, dynamic>);
  }

  Future<List<Revision>> getRevisions(String traitorId) async {
    final data = await _run(() => http.get(
          Uri.parse('$_baseUrl/api/traitors/$traitorId/revisions'),
          headers: _headers,
        )) as Map<String, dynamic>;
    final items = (data['items'] as List?) ?? const [];
    return items.map((e) => Revision.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<TraitorStats> getStats() async {
    final data = await _run(() => http.get(
          Uri.parse('$_baseUrl/api/traitors/stats'),
          headers: _headers,
        )) as Map<String, dynamic>;
    return TraitorStats.fromJson(data);
  }

  Future<List<TimelineNode>> getTimeline() async {
    final data = await _run(() => http.get(
          Uri.parse('$_baseUrl/api/traitors/timeline'),
          headers: _headers,
        )) as Map<String, dynamic>;
    final items = (data['items'] as List?) ?? const [];
    return items.map((e) => TimelineNode.fromJson(e as Map<String, dynamic>)).toList();
  }

  // ---- 个人中心（需登录） ----

  Future<List<Revision>> mySubmissions() async {
    final data = await _run(() => http.get(
          Uri.parse('$_baseUrl/api/me/submissions'),
          headers: _headers,
        )) as Map<String, dynamic>;
    final items = (data['items'] as List?) ?? const [];
    return items.map((e) => Revision.fromJson(e as Map<String, dynamic>)).toList();
  }

  // ---- 档案提交（需登录） ----

  Future<String> createTraitor(Map<String, dynamic> body) async {
    final data = await _run(() => http.post(
          Uri.parse('$_baseUrl/api/traitors'),
          headers: _headers,
          body: jsonEncode(body),
        )) as Map<String, dynamic>;
    return data['revisionId'] as String;
  }

  Future<String> updateTraitor(String id, Map<String, dynamic> body) async {
    final data = await _run(() => http.put(
          Uri.parse('$_baseUrl/api/traitors/$id'),
          headers: _headers,
          body: jsonEncode(body),
        )) as Map<String, dynamic>;
    return data['revisionId'] as String;
  }

  Future<Map<String, dynamic>> uploadFile({
    required String filePath,
    required String kind,
  }) async {
    final uri = Uri.parse('$_baseUrl/api/uploads');
    final request = http.MultipartRequest('POST', uri)
      ..headers.addAll({
        if (hasToken) 'Authorization': 'Bearer $_token',
      })
      ..files.add(await http.MultipartFile.fromPath('file', filePath))
      ..fields['kind'] = kind;
    final streamed = await request.send().timeout(const Duration(seconds: 30));
    final response = await http.Response.fromStream(streamed);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
    }
    String message = '上传失败（${response.statusCode}）';
    try {
      final body = jsonDecode(utf8.decode(response.bodyBytes));
      if (body is Map) {
        message = (body['message'] ?? body['error'] ?? message).toString();
      }
    } catch (_) {}
    throw ApiException(message, response.statusCode);
  }
}
