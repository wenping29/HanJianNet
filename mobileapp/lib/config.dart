import 'dart:io' show Platform;

/// 默认 API 地址：按平台区分。
/// Android 模拟器访问宿主机用 10.0.2.2；iOS 模拟器用 127.0.0.1。
String get kDefaultApiBaseUrl {
  if (Platform.isAndroid) return 'http://10.0.2.2:3000';
  if (Platform.isIOS) return 'http://127.0.0.1:3000';
  return 'http://localhost:3000';
}
