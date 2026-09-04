import 'package:flutter/foundation.dart';

/// 默认 API 地址：按平台区分。
/// Web 使用 localhost；Android 模拟器用 10.0.2.2；iOS 模拟器用 127.0.0.1。
String get kDefaultApiBaseUrl {
  if (kIsWeb) return 'http://localhost:3000';
  switch (defaultTargetPlatform) {
    case TargetPlatform.android:
      return 'http://10.0.2.2:3000';
    case TargetPlatform.iOS:
      return 'http://127.0.0.1:3000';
    default:
      return 'http://localhost:3000';
  }
}
