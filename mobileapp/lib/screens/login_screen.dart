import 'package:flutter/material.dart';

import '../services/api_client.dart';
import '../services/session.dart';
import '../widgets/theme.dart';
import 'register_screen.dart';

/// API 地址设置对话框（移动端 API 地址可配置）。
Future<void> showApiSettingsDialog(BuildContext context) async {
  final ctrl = TextEditingController(text: Session.instance.baseUrl);
  final ok = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: AppTheme.inkCard,
      title: const Text('API 设置', style: TextStyle(fontSize: 16, letterSpacing: 2)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('Web API 基础地址（Android 模拟器访问宿主机请用 10.0.2.2）',
              style: TextStyle(fontSize: 12)),
          const SizedBox(height: 12),
          TextField(
            controller: ctrl,
            keyboardType: TextInputType.url,
            decoration: const InputDecoration(hintText: 'http://10.0.2.2:3000'),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')),
        FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('保存')),
      ],
    ),
  );
  if (ok == true) {
    await Session.instance.updateBaseUrl(ctrl.text);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('已保存：${Session.instance.baseUrl}')),
      );
    }
  }
}

class LoginScreen extends StatefulWidget {
  final String? redirect;

  const LoginScreen({super.key, this.redirect});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _accountCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _accountCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await Session.instance.login(_accountCtrl.text.trim(), _passwordCtrl.text);
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _busy = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('登录'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, size: 20),
            tooltip: 'API 设置',
            onPressed: () => showApiSettingsDialog(context),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 24),
          Center(
            child: Container(
              width: 64,
              height: 64,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                border: Border.all(color: AppTheme.cinnabar, width: 2),
                borderRadius: BorderRadius.circular(3),
                color: AppTheme.cinnabar.withValues(alpha: 0.15),
              ),
              child: const Text('汉奸\n档案',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, height: 1.2, letterSpacing: 2, color: AppTheme.cinnabarLight)),
            ),
          ),
          const SizedBox(height: 32),
          TextField(
            controller: _accountCtrl,
            decoration: const InputDecoration(labelText: '邮箱 / 用户名'),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _passwordCtrl,
            obscureText: true,
            decoration: const InputDecoration(labelText: '密码'),
            onSubmitted: (_) => _submit(),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Text(_error!, style: const TextStyle(color: AppTheme.cinnabarLight, fontSize: 13)),
            ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _busy ? null : _submit,
            child: Text(_busy ? '登录中…' : '登 录'),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: _busy
                ? null
                : () async {
                    final navigator = Navigator.of(context);
                    final ok = await navigator.push<bool>(
                      MaterialPageRoute(builder: (_) => const RegisterScreen()),
                    );
                    if (ok == true && mounted) {
                      navigator.pop(true);
                    }
                  },
            child: const Text('没有账号？去注册'),
          ),
        ],
      ),
    );
  }
}
