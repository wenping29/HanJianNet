import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config.dart';
import '../models/models.dart';
import 'api_client.dart';

/// 会话状态：token / 用户信息 / API 地址，均持久化到本地。
class Session extends ChangeNotifier {
  Session._();
  static final Session instance = Session._();

  static const _kToken = 'hanjian.token';
  static const _kUser = 'hanjian.user';
  static const _kBaseUrl = 'hanjian.baseUrl';

  String? token;
  User? user;
  String baseUrl = kDefaultApiBaseUrl;

  bool get isLogin => token != null && token!.isNotEmpty;
  bool get isAdmin => user?.role == 'admin';

  Future<void> load() async {
    final sp = await SharedPreferences.getInstance();
    baseUrl = sp.getString(_kBaseUrl) ?? kDefaultApiBaseUrl;
    token = sp.getString(_kToken);
    final userJson = sp.getString(_kUser);
    if (userJson != null) {
      try {
        user = User.fromJson(jsonDecode(userJson) as Map<String, dynamic>);
      } catch (_) {
        user = null;
      }
    }
    _applyToClient();
    if (isLogin) {
      // 静默校验 token 是否仍有效
      try {
        user = await ApiClient.instance.me();
        await _persistUser();
      } on ApiException catch (e) {
        if (e.status == 401) await logout(persist: false);
      } catch (_) {}
    }
    notifyListeners();
  }

  Future<void> login(String account, String password) async {
    final r = await ApiClient.instance.login(account: account, password: password);
    token = r.token;
    user = r.user;
    await _persistAll();
    notifyListeners();
  }

  Future<void> register(String username, String email, String password) async {
    final r = await ApiClient.instance.register(
      username: username,
      email: email,
      password: password,
    );
    token = r.token;
    user = r.user;
    await _persistAll();
    notifyListeners();
  }

  Future<void> logout({bool persist = true}) async {
    token = null;
    user = null;
    if (persist) {
      final sp = await SharedPreferences.getInstance();
      await sp.remove(_kToken);
      await sp.remove(_kUser);
    }
    _applyToClient();
    notifyListeners();
  }

  Future<void> updateBaseUrl(String url) async {
    final trimmed = url.trim();
    baseUrl = trimmed.isEmpty ? kDefaultApiBaseUrl : trimmed;
    final sp = await SharedPreferences.getInstance();
    await sp.setString(_kBaseUrl, baseUrl);
    _applyToClient();
    notifyListeners();
  }

  void _applyToClient() {
    ApiClient.instance.configure(baseUrl: baseUrl, token: token);
  }

  Future<void> _persistAll() async {
    final sp = await SharedPreferences.getInstance();
    await sp.setString(_kToken, token!);
    await sp.setString(_kUser, jsonEncode({'id': user!.id, 'username': user!.username, 'email': user!.email, 'role': user!.role}));
    await sp.setString(_kBaseUrl, baseUrl);
    _applyToClient();
  }

  Future<void> _persistUser() async {
    final sp = await SharedPreferences.getInstance();
    await sp.setString(_kUser, jsonEncode({'id': user!.id, 'username': user!.username, 'email': user!.email, 'role': user!.role}));
  }
}
