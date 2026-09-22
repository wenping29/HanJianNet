import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:qr_flutter/qr_flutter.dart';

import 'package:hanjian_mobileapp/l10n/app_localizations.dart';

import '../services/api_client.dart';
import '../services/session.dart';
import '../widgets/theme.dart';

/// 编辑个人信息页：用户名与邮箱只读；可修改头像、昵称、性别、生日、地区、地址、手机号、签名；
/// 并可查看个人二维码。
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  /// 省级地区选项（与地图数据口径一致）。
  static const _kRegions = [
    '北京市', '天津市', '上海市', '重庆市',
    '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
    '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省',
    '河南省', '湖北省', '湖南省', '广东省', '海南省',
    '四川省', '贵州省', '云南省', '陕西省', '甘肃省', '青海省', '台湾省',
    '内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区',
    '香港特别行政区', '澳门特别行政区',
  ];

  final _formKey = GlobalKey<FormState>();
  final _nicknameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _signatureCtrl = TextEditingController();

  String _gender = 'secret';
  String? _birthday; // yyyy-MM-dd
  String _region = ''; // 空串表示未设置

  bool _busy = false;
  bool _avatarBusy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final user = Session.instance.user;
    _nicknameCtrl.text = user?.nickname ?? '';
    _phoneCtrl.text = user?.phone ?? '';
    _addressCtrl.text = user?.address ?? '';
    _signatureCtrl.text = user?.signature ?? '';
    _gender = switch (user?.gender) {
      'male' || 'female' => user!.gender!,
      _ => 'secret',
    };
    _birthday = (user?.birthday?.isNotEmpty == true) ? user!.birthday : null;
    _region = user?.region ?? '';
  }

  @override
  void dispose() {
    _nicknameCtrl.dispose();
    _phoneCtrl.dispose();
    _addressCtrl.dispose();
    _signatureCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final user = Session.instance.user;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.editProfile)),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(12),
          children: [
            _avatarSection(l10n, user?.avatarUrl, user?.username),
            const SizedBox(height: 12),
            Card(
              child: ListTile(
                leading: const Icon(Icons.qr_code_2, color: AppTheme.cinnabarLight),
                title: Text(l10n.myQrCode,
                    style: const TextStyle(fontSize: 15, letterSpacing: 2)),
                trailing: const Icon(Icons.chevron_right, size: 20),
                onTap: () => _showQrCode(l10n),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    TextFormField(
                      initialValue: user?.username ?? '',
                      enabled: false,
                      decoration: InputDecoration(labelText: l10n.username),
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      initialValue: user?.email ?? '',
                      enabled: false,
                      decoration: InputDecoration(
                        labelText: l10n.email,
                        helperText: l10n.profileAccountFixed,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    TextFormField(
                      controller: _nicknameCtrl,
                      maxLength: 32,
                      decoration: InputDecoration(labelText: l10n.nickname),
                    ),
                    const SizedBox(height: 14),
                    DropdownButtonFormField<String>(
                      initialValue: _gender,
                      decoration: InputDecoration(labelText: l10n.gender),
                      items: [
                        DropdownMenuItem(value: 'secret', child: Text(l10n.genderSecret)),
                        DropdownMenuItem(value: 'male', child: Text(l10n.genderMale)),
                        DropdownMenuItem(value: 'female', child: Text(l10n.genderFemale)),
                      ],
                      onChanged: (v) => setState(() => _gender = v ?? 'secret'),
                    ),
                    const SizedBox(height: 14),
                    InkWell(
                      onTap: _pickBirthday,
                      borderRadius: BorderRadius.circular(4),
                      child: InputDecorator(
                        decoration: InputDecoration(
                          labelText: l10n.birthday,
                          suffixIcon: const Icon(Icons.cake_outlined, size: 20),
                        ),
                        child: Text(
                          _birthday ?? l10n.optional,
                          style: TextStyle(
                            fontSize: 15,
                            color: _birthday != null
                                ? null
                                : Theme.of(context).hintColor,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    DropdownButtonFormField<String>(
                      initialValue: _region,
                      decoration: InputDecoration(labelText: l10n.region),
                      items: [
                        DropdownMenuItem(value: '', child: Text(l10n.optional)),
                        // 兼容历史保存的非标准地区值
                        if (_region.isNotEmpty && !_kRegions.contains(_region))
                          DropdownMenuItem(value: _region, child: Text(_region)),
                        ..._kRegions.map((r) => DropdownMenuItem(value: r, child: Text(r))),
                      ],
                      onChanged: (v) => setState(() => _region = v ?? ''),
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _phoneCtrl,
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(labelText: l10n.phone),
                      validator: (v) {
                        final value = v?.trim() ?? '';
                        if (value.isEmpty) return null;
                        if (!RegExp(r'^[0-9+\-\s]{5,20}$').hasMatch(value)) {
                          return l10n.invalidPhone;
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _addressCtrl,
                      maxLength: 200,
                      decoration: InputDecoration(labelText: l10n.address),
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _signatureCtrl,
                      maxLength: 200,
                      maxLines: 2,
                      decoration: InputDecoration(labelText: l10n.signature),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(_error!,
                    style: const TextStyle(color: AppTheme.cinnabarLight, fontSize: 13)),
              ),
            FilledButton(
              onPressed: (_busy || _avatarBusy) ? null : _save,
              child: _busy
                  ? const SizedBox(
                      width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text(l10n.save),
            ),
          ],
        ),
      ),
    );
  }

  /// 顶部头像：点击直接换头像（选择图片→上传→更新），无需进入二级页面。
  Widget _avatarSection(AppLocalizations l10n, String? avatarUrl, String? username) {
    final letter = (username != null && username.isNotEmpty)
        ? username.characters.first.toUpperCase()
        : '?';
    return Column(
      children: [
        GestureDetector(
          onTap: _avatarBusy ? null : _changeAvatar,
          child: Stack(
            children: [
              CircleAvatar(
                radius: 44,
                backgroundColor: AppTheme.cinnabar.withValues(alpha: 0.3),
                backgroundImage: (avatarUrl != null && avatarUrl.isNotEmpty)
                    ? NetworkImage(resolveAssetUrl(avatarUrl))
                    : null,
                child: (avatarUrl == null || avatarUrl.isEmpty)
                    ? Text(letter, style: TextStyle(fontSize: 28, color: AppTheme.paper))
                    : null,
              ),
              if (_avatarBusy)
                const Positioned.fill(
                  child: Center(
                    child: SizedBox(
                        width: 24, height: 24,
                        child: CircularProgressIndicator(strokeWidth: 2)),
                  ),
                )
              else
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: AppTheme.cinnabarLight,
                      shape: BoxShape.circle,
                      border: Border.all(color: Theme.of(context).scaffoldBackgroundColor, width: 2),
                    ),
                    child: const Icon(Icons.photo_camera_outlined,
                        size: 14, color: Color(0xFFF2EAD8)),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Text(l10n.tapToChangeAvatar,
            style: TextStyle(fontSize: 12, color: AppTheme.paperDim)),
      ],
    );
  }

  /// 个人二维码：内容为用户标识，供其他端扫码识别。
  void _showQrCode(AppLocalizations l10n) {
    final user = Session.instance.user;
    if (user == null) return;
    final displayName =
        (user.nickname?.isNotEmpty == true) ? user.nickname! : user.username;
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.myQrCode, textAlign: TextAlign.center),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              color: Colors.white,
              padding: const EdgeInsets.all(12),
              child: QrImageView(
                data: 'hanjiannet://u/${user.id}',
                version: QrVersions.auto,
                size: 220,
              ),
            ),
            const SizedBox(height: 12),
            Text(displayName,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
            Text('@${user.username}',
                style: TextStyle(fontSize: 12, color: AppTheme.paperDim)),
          ],
        ),
      ),
    );
  }

  Future<void> _changeAvatar() async {
    final l10n = AppLocalizations.of(context)!;
    final picked = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      maxWidth: 512,
      maxHeight: 512,
      imageQuality: 85,
    );
    if (picked == null || !mounted) return;
    setState(() {
      _avatarBusy = true;
      _error = null;
    });
    try {
      final bytes = await picked.readAsBytes();
      final res = await ApiClient.instance
          .uploadBytes(bytes: bytes, filename: picked.name, kind: 'avatar');
      final user = await ApiClient.instance.updateAvatar(res['url'] as String);
      await Session.instance.updateUser(user);
      if (!mounted) return;
      setState(() => _avatarBusy = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.avatarUpdated)));
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _avatarBusy = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = l10n.submitFailed;
        _avatarBusy = false;
      });
    }
  }

  Future<void> _pickBirthday() async {
    final initial = DateTime.tryParse(_birthday ?? '') ?? DateTime(1990);
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (picked == null || !mounted) return;
    setState(() {
      _birthday =
          '${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
    });
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final l10n = AppLocalizations.of(context)!;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final user = await ApiClient.instance.updateProfile(
        nickname: _nicknameCtrl.text.trim(),
        gender: _gender,
        birthday: _birthday ?? '',
        phone: _phoneCtrl.text.trim(),
        address: _addressCtrl.text.trim(),
        signature: _signatureCtrl.text.trim(),
        region: _region,
      );
      await Session.instance.updateUser(user);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.profileUpdated)));
      Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _busy = false;
      });
    }
  }
}
