// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Chinese (`zh`).
class AppLocalizationsZh extends AppLocalizations {
  AppLocalizationsZh([String locale = 'zh']) : super(locale);

  @override
  String get appTitle => '汉奸档案 · HanJianNet';

  @override
  String get appLogoText => '汉奸\n档案';

  @override
  String get navHome => '首页';

  @override
  String get navSearch => '查询';

  @override
  String get navMine => '我的';

  @override
  String get networkError => '网络请求失败，请检查 API 地址与网络连接';

  @override
  String requestFailed(int statusCode) {
    return '请求失败（$statusCode）';
  }

  @override
  String uploadFailed(int statusCode) {
    return '上传失败（$statusCode）';
  }

  @override
  String get unknown => '不详';

  @override
  String get circa => '约';

  @override
  String get before => '前';

  @override
  String get after => '后';

  @override
  String get approved => '已通过';

  @override
  String get rejected => '已驳回';

  @override
  String get pending => '待审核';

  @override
  String get retry => '重试';

  @override
  String get noRecords => '暂无记录';

  @override
  String get archives => '汉奸档案';

  @override
  String get figures => '人物列表';

  @override
  String get totalArchives => '档案总数';

  @override
  String get apiSettings => 'API 设置';

  @override
  String get apiBaseUrlHint => 'Web API 基础地址（Android 模拟器访问宿主机请用 10.0.2.2）';

  @override
  String get cancel => '取消';

  @override
  String get save => '保存';

  @override
  String saved(String url) {
    return '已保存：$url';
  }

  @override
  String get login => '登录';

  @override
  String get emailOrUsername => '邮箱 / 用户名';

  @override
  String get password => '密码';

  @override
  String get loggingIn => '登录中…';

  @override
  String get loginButton => '登 录';

  @override
  String get noAccount => '没有账号？去注册';

  @override
  String get fillAllFields => '请填写完整信息';

  @override
  String get invalidEmail => '邮箱格式不正确';

  @override
  String get passwordTooShort => '密码至少 8 位';

  @override
  String get passwordMismatch => '两次输入的密码不一致';

  @override
  String get register => '注册';

  @override
  String get username => '用户名';

  @override
  String get email => '邮箱';

  @override
  String get passwordHint => '密码（至少 8 位）';

  @override
  String get confirmPassword => '确认密码';

  @override
  String get registering => '注册中…';

  @override
  String get registerButton => '注 册';

  @override
  String get hasAccount => '已有账号？去登录';

  @override
  String get allPeriods => '全部';

  @override
  String get lateSong => '宋末';

  @override
  String get lateMing => '明末';

  @override
  String get lateQing => '清末';

  @override
  String get republic => '民国';

  @override
  String get other => '其他';

  @override
  String get searchButton => '查 询';

  @override
  String get nameLabel => '姓名';

  @override
  String get nameHint => '按人物姓名模糊匹配';

  @override
  String get yearFrom => '年份从';

  @override
  String get yearFromHint => '如 1937';

  @override
  String get yearTo => '年份到';

  @override
  String get yearToHint => '如 1945';

  @override
  String get eventKeyword => '事件关键词';

  @override
  String get nativePlace => '籍贯';

  @override
  String get searching => '查询中…';

  @override
  String get noResults => '没有符合条件的档案';

  @override
  String get noPublishedArchives => '暂无已发布档案';

  @override
  String get personalCenter => '个人中心';

  @override
  String get exitButton => '退出';

  @override
  String get mySubmissions => '我的提交';

  @override
  String get mySubmissionsTitle => '我的提交记录';

  @override
  String get loginForSubmissions => '登录后可查看提交记录与审核状态';

  @override
  String get loginForMySubmissions => '登录后可查看本人提交记录与审核状态';

  @override
  String get goToLogin => '去登录';

  @override
  String get noSubmissions => '还没有提交过档案或修改';

  @override
  String get submitNewArchive => '提交新档案';

  @override
  String get modifyArchive => '修改档案';

  @override
  String changeContent(String summary) {
    return '修改内容：$summary';
  }

  @override
  String submittedAt(String time) {
    return '提交于 $time';
  }

  @override
  String reviewedAt(String time) {
    return '审核于 $time';
  }

  @override
  String reviewer(String name) {
    return ' · 审核人：$name';
  }

  @override
  String reviewComment(String comment) {
    return ' · 意见：$comment';
  }

  @override
  String get logout => '退出登录';

  @override
  String get editArchive => '编辑档案';

  @override
  String get pleaseLoginFirst => '请先登录';

  @override
  String get nameRequired => '姓名 *';

  @override
  String get nameInput => '请输入姓名';

  @override
  String get changeDescription => '修改说明 *';

  @override
  String get changeDescriptionInput => '请输入修改说明';

  @override
  String get submitButton => '提 交';

  @override
  String get archiveDetail => '档案详情';

  @override
  String courtesyName(String name) {
    return '字：$name';
  }

  @override
  String pseudonym(String name) {
    return '号：$name';
  }

  @override
  String get lifeSpan => '生卒';

  @override
  String get nativePlaceDetail => '籍贯';

  @override
  String get faction => '派系';

  @override
  String get aliases => '别名';

  @override
  String get summaryTitle => '人物概述';

  @override
  String get noSummary => '暂无概述';

  @override
  String get timeline => '生平时间线';

  @override
  String sourceRef(String source) {
    return '出处：$source';
  }

  @override
  String get criminalRecords => '犯罪记录';

  @override
  String process(String detail) {
    return '经过：$detail';
  }

  @override
  String harm(String detail) {
    return '危害：$detail';
  }

  @override
  String sourceMaterial(String reference) {
    return '史料出处：$reference';
  }

  @override
  String get familyAndResidence => '家族与居住';

  @override
  String get spouse => '配偶';

  @override
  String get children => '子女';

  @override
  String get genderLabel => '性别';

  @override
  String get whereabouts => '去向';

  @override
  String get residenceChanges => '居住地变迁';

  @override
  String get photos => '人物照片';

  @override
  String get evidence => '罪证材料';

  @override
  String get document => '文';

  @override
  String get revisionHistory => '修改历史';

  @override
  String reviewedBy(String name) {
    return ' · 审核：$name';
  }

  @override
  String get noRevisions => '暂无修改记录';

  @override
  String get editThisArchive => '修改此档案';

  @override
  String get sources => '史料来源';

  @override
  String get language => '语言';

  @override
  String get chooseLanguage => '选择语言';
}
