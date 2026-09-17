import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import 'package:hanjian_mobileapp/l10n/app_localizations.dart';

import '../services/api_client.dart';
import '../services/session.dart';
import '../widgets/theme.dart';

/// 修改头像页：预览当前头像，选择图片上传后更新。
class EditAvatarScreen extends StatefulWidget {
  const EditAvatarScreen({super.key});

  @override
  State<EditAvatarScreen> createState() => _EditAvatarScreenState();
}

class _EditAvatarScreenState extends State<EditAvatarScreen> {
  bool _busy = false;
  String? _error;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final user = Session.instance.user;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.editAvatar)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _avatarPreview(user?.avatarUrl, user?.username),
              const SizedBox(height: 28),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(_error!,
                      style: const TextStyle(color: AppTheme.cinnabarLight, fontSize: 13)),
                ),
              FilledButton.icon(
                onPressed: _busy ? null : _pickAndUpload,
                icon: _busy
                    ? const SizedBox(
                        width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.photo_library_outlined),
                label: Text(_busy ? l10n.uploading : l10n.uploadPhoto),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _avatarPreview(String? avatarUrl, String? username) {
    final letter = (username != null && username.isNotEmpty)
        ? username.characters.first.toUpperCase()
        : '?';
    return CircleAvatar(
      radius: 64,
      backgroundColor: AppTheme.cinnabar.withValues(alpha: 0.3),
      backgroundImage: (avatarUrl != null && avatarUrl.isNotEmpty)
          ? NetworkImage(resolveAssetUrl(avatarUrl))
          : null,
      child: (avatarUrl == null || avatarUrl.isEmpty)
          ? Text(letter, style: TextStyle(fontSize: 40, color: AppTheme.paper))
          : null,
    );
  }

  Future<void> _pickAndUpload() async {
    final l10n = AppLocalizations.of(context)!;
    final picked = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      maxWidth: 512,
      maxHeight: 512,
      imageQuality: 85,
    );
    if (picked == null || !mounted) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final bytes = await picked.readAsBytes();
      final res = await ApiClient.instance
          .uploadBytes(bytes: bytes, filename: picked.name, kind: 'avatar');
      final user = await ApiClient.instance.updateAvatar(res['url'] as String);
      await Session.instance.updateUser(user);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.avatarUpdated)));
      Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _busy = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = l10n.submitFailed;
        _busy = false;
      });
    }
  }
}
