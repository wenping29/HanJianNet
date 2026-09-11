import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_de.dart';
import 'app_localizations_en.dart';
import 'app_localizations_es.dart';
import 'app_localizations_fr.dart';
import 'app_localizations_ja.dart';
import 'app_localizations_ko.dart';
import 'app_localizations_ru.dart';
import 'app_localizations_zh.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('de'),
    Locale('en'),
    Locale('es'),
    Locale('fr'),
    Locale('ja'),
    Locale('ko'),
    Locale('ru'),
    Locale('zh'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In zh, this message translates to:
  /// **'汉奸档案 · HanJianNet'**
  String get appTitle;

  /// No description provided for @appLogoText.
  ///
  /// In zh, this message translates to:
  /// **'汉奸\n档案'**
  String get appLogoText;

  /// No description provided for @navHome.
  ///
  /// In zh, this message translates to:
  /// **'首页'**
  String get navHome;

  /// No description provided for @navSearch.
  ///
  /// In zh, this message translates to:
  /// **'查询'**
  String get navSearch;

  /// No description provided for @navMine.
  ///
  /// In zh, this message translates to:
  /// **'我的'**
  String get navMine;

  /// No description provided for @networkError.
  ///
  /// In zh, this message translates to:
  /// **'网络请求失败，请检查 API 地址与网络连接'**
  String get networkError;

  /// Error message with HTTP status code
  ///
  /// In zh, this message translates to:
  /// **'请求失败（{statusCode}）'**
  String requestFailed(int statusCode);

  /// File upload failed with HTTP status code
  ///
  /// In zh, this message translates to:
  /// **'上传失败（{statusCode}）'**
  String uploadFailed(int statusCode);

  /// No description provided for @unknown.
  ///
  /// In zh, this message translates to:
  /// **'不详'**
  String get unknown;

  /// No description provided for @circa.
  ///
  /// In zh, this message translates to:
  /// **'约'**
  String get circa;

  /// No description provided for @before.
  ///
  /// In zh, this message translates to:
  /// **'前'**
  String get before;

  /// No description provided for @after.
  ///
  /// In zh, this message translates to:
  /// **'后'**
  String get after;

  /// No description provided for @approved.
  ///
  /// In zh, this message translates to:
  /// **'已通过'**
  String get approved;

  /// No description provided for @rejected.
  ///
  /// In zh, this message translates to:
  /// **'已驳回'**
  String get rejected;

  /// No description provided for @pending.
  ///
  /// In zh, this message translates to:
  /// **'待审核'**
  String get pending;

  /// No description provided for @retry.
  ///
  /// In zh, this message translates to:
  /// **'重试'**
  String get retry;

  /// No description provided for @noRecords.
  ///
  /// In zh, this message translates to:
  /// **'暂无记录'**
  String get noRecords;

  /// No description provided for @archives.
  ///
  /// In zh, this message translates to:
  /// **'汉奸档案'**
  String get archives;

  /// No description provided for @figures.
  ///
  /// In zh, this message translates to:
  /// **'人物列表'**
  String get figures;

  /// No description provided for @totalArchives.
  ///
  /// In zh, this message translates to:
  /// **'档案总数'**
  String get totalArchives;

  /// No description provided for @apiSettings.
  ///
  /// In zh, this message translates to:
  /// **'API 设置'**
  String get apiSettings;

  /// No description provided for @apiBaseUrlHint.
  ///
  /// In zh, this message translates to:
  /// **'Web API 基础地址（Android 模拟器访问宿主机请用 10.0.2.2）'**
  String get apiBaseUrlHint;

  /// No description provided for @cancel.
  ///
  /// In zh, this message translates to:
  /// **'取消'**
  String get cancel;

  /// No description provided for @save.
  ///
  /// In zh, this message translates to:
  /// **'保存'**
  String get save;

  /// No description provided for @saved.
  ///
  /// In zh, this message translates to:
  /// **'已保存：{url}'**
  String saved(String url);

  /// No description provided for @login.
  ///
  /// In zh, this message translates to:
  /// **'登录'**
  String get login;

  /// No description provided for @emailOrUsername.
  ///
  /// In zh, this message translates to:
  /// **'邮箱 / 用户名'**
  String get emailOrUsername;

  /// No description provided for @password.
  ///
  /// In zh, this message translates to:
  /// **'密码'**
  String get password;

  /// No description provided for @loggingIn.
  ///
  /// In zh, this message translates to:
  /// **'登录中…'**
  String get loggingIn;

  /// No description provided for @loginButton.
  ///
  /// In zh, this message translates to:
  /// **'登 录'**
  String get loginButton;

  /// No description provided for @noAccount.
  ///
  /// In zh, this message translates to:
  /// **'没有账号？去注册'**
  String get noAccount;

  /// No description provided for @fillAllFields.
  ///
  /// In zh, this message translates to:
  /// **'请填写完整信息'**
  String get fillAllFields;

  /// No description provided for @invalidEmail.
  ///
  /// In zh, this message translates to:
  /// **'邮箱格式不正确'**
  String get invalidEmail;

  /// No description provided for @passwordTooShort.
  ///
  /// In zh, this message translates to:
  /// **'密码至少 8 位'**
  String get passwordTooShort;

  /// No description provided for @passwordMismatch.
  ///
  /// In zh, this message translates to:
  /// **'两次输入的密码不一致'**
  String get passwordMismatch;

  /// No description provided for @register.
  ///
  /// In zh, this message translates to:
  /// **'注册'**
  String get register;

  /// No description provided for @username.
  ///
  /// In zh, this message translates to:
  /// **'用户名'**
  String get username;

  /// No description provided for @email.
  ///
  /// In zh, this message translates to:
  /// **'邮箱'**
  String get email;

  /// No description provided for @passwordHint.
  ///
  /// In zh, this message translates to:
  /// **'密码（至少 8 位）'**
  String get passwordHint;

  /// No description provided for @confirmPassword.
  ///
  /// In zh, this message translates to:
  /// **'确认密码'**
  String get confirmPassword;

  /// No description provided for @registering.
  ///
  /// In zh, this message translates to:
  /// **'注册中…'**
  String get registering;

  /// No description provided for @registerButton.
  ///
  /// In zh, this message translates to:
  /// **'注 册'**
  String get registerButton;

  /// No description provided for @hasAccount.
  ///
  /// In zh, this message translates to:
  /// **'已有账号？去登录'**
  String get hasAccount;

  /// No description provided for @allPeriods.
  ///
  /// In zh, this message translates to:
  /// **'全部'**
  String get allPeriods;

  /// No description provided for @lateSong.
  ///
  /// In zh, this message translates to:
  /// **'宋末'**
  String get lateSong;

  /// No description provided for @lateMing.
  ///
  /// In zh, this message translates to:
  /// **'明末'**
  String get lateMing;

  /// No description provided for @lateQing.
  ///
  /// In zh, this message translates to:
  /// **'清末'**
  String get lateQing;

  /// No description provided for @republic.
  ///
  /// In zh, this message translates to:
  /// **'民国'**
  String get republic;

  /// No description provided for @other.
  ///
  /// In zh, this message translates to:
  /// **'其他'**
  String get other;

  /// No description provided for @searchButton.
  ///
  /// In zh, this message translates to:
  /// **'查 询'**
  String get searchButton;

  /// No description provided for @nameLabel.
  ///
  /// In zh, this message translates to:
  /// **'姓名'**
  String get nameLabel;

  /// No description provided for @nameHint.
  ///
  /// In zh, this message translates to:
  /// **'按人物姓名模糊匹配'**
  String get nameHint;

  /// No description provided for @yearFrom.
  ///
  /// In zh, this message translates to:
  /// **'年份从'**
  String get yearFrom;

  /// No description provided for @yearFromHint.
  ///
  /// In zh, this message translates to:
  /// **'如 1937'**
  String get yearFromHint;

  /// No description provided for @yearTo.
  ///
  /// In zh, this message translates to:
  /// **'年份到'**
  String get yearTo;

  /// No description provided for @yearToHint.
  ///
  /// In zh, this message translates to:
  /// **'如 1945'**
  String get yearToHint;

  /// No description provided for @eventKeyword.
  ///
  /// In zh, this message translates to:
  /// **'事件关键词'**
  String get eventKeyword;

  /// No description provided for @nativePlace.
  ///
  /// In zh, this message translates to:
  /// **'籍贯'**
  String get nativePlace;

  /// No description provided for @searching.
  ///
  /// In zh, this message translates to:
  /// **'查询中…'**
  String get searching;

  /// No description provided for @noResults.
  ///
  /// In zh, this message translates to:
  /// **'没有符合条件的档案'**
  String get noResults;

  /// No description provided for @noPublishedArchives.
  ///
  /// In zh, this message translates to:
  /// **'暂无已发布档案'**
  String get noPublishedArchives;

  /// No description provided for @personalCenter.
  ///
  /// In zh, this message translates to:
  /// **'个人中心'**
  String get personalCenter;

  /// No description provided for @exitButton.
  ///
  /// In zh, this message translates to:
  /// **'退出'**
  String get exitButton;

  /// No description provided for @mySubmissions.
  ///
  /// In zh, this message translates to:
  /// **'我的提交'**
  String get mySubmissions;

  /// No description provided for @mySubmissionsTitle.
  ///
  /// In zh, this message translates to:
  /// **'我的提交记录'**
  String get mySubmissionsTitle;

  /// No description provided for @loginForSubmissions.
  ///
  /// In zh, this message translates to:
  /// **'登录后可查看提交记录与审核状态'**
  String get loginForSubmissions;

  /// No description provided for @loginForMySubmissions.
  ///
  /// In zh, this message translates to:
  /// **'登录后可查看本人提交记录与审核状态'**
  String get loginForMySubmissions;

  /// No description provided for @goToLogin.
  ///
  /// In zh, this message translates to:
  /// **'去登录'**
  String get goToLogin;

  /// No description provided for @noSubmissions.
  ///
  /// In zh, this message translates to:
  /// **'还没有提交过档案或修改'**
  String get noSubmissions;

  /// No description provided for @submitNewArchive.
  ///
  /// In zh, this message translates to:
  /// **'提交新档案'**
  String get submitNewArchive;

  /// No description provided for @modifyArchive.
  ///
  /// In zh, this message translates to:
  /// **'修改档案'**
  String get modifyArchive;

  /// No description provided for @changeContent.
  ///
  /// In zh, this message translates to:
  /// **'修改内容：{summary}'**
  String changeContent(String summary);

  /// No description provided for @submittedAt.
  ///
  /// In zh, this message translates to:
  /// **'提交于 {time}'**
  String submittedAt(String time);

  /// No description provided for @reviewedAt.
  ///
  /// In zh, this message translates to:
  /// **'审核于 {time}'**
  String reviewedAt(String time);

  /// No description provided for @reviewer.
  ///
  /// In zh, this message translates to:
  /// **' · 审核人：{name}'**
  String reviewer(String name);

  /// No description provided for @reviewComment.
  ///
  /// In zh, this message translates to:
  /// **' · 意见：{comment}'**
  String reviewComment(String comment);

  /// No description provided for @logout.
  ///
  /// In zh, this message translates to:
  /// **'退出登录'**
  String get logout;

  /// No description provided for @editArchive.
  ///
  /// In zh, this message translates to:
  /// **'编辑档案'**
  String get editArchive;

  /// No description provided for @pleaseLoginFirst.
  ///
  /// In zh, this message translates to:
  /// **'请先登录'**
  String get pleaseLoginFirst;

  /// No description provided for @nameRequired.
  ///
  /// In zh, this message translates to:
  /// **'姓名 *'**
  String get nameRequired;

  /// No description provided for @nameInput.
  ///
  /// In zh, this message translates to:
  /// **'请输入姓名'**
  String get nameInput;

  /// No description provided for @changeDescription.
  ///
  /// In zh, this message translates to:
  /// **'修改说明 *'**
  String get changeDescription;

  /// No description provided for @changeDescriptionInput.
  ///
  /// In zh, this message translates to:
  /// **'请输入修改说明'**
  String get changeDescriptionInput;

  /// No description provided for @submitButton.
  ///
  /// In zh, this message translates to:
  /// **'提 交'**
  String get submitButton;

  /// No description provided for @archiveDetail.
  ///
  /// In zh, this message translates to:
  /// **'档案详情'**
  String get archiveDetail;

  /// No description provided for @courtesyName.
  ///
  /// In zh, this message translates to:
  /// **'字：{name}'**
  String courtesyName(String name);

  /// No description provided for @pseudonym.
  ///
  /// In zh, this message translates to:
  /// **'号：{name}'**
  String pseudonym(String name);

  /// No description provided for @lifeSpan.
  ///
  /// In zh, this message translates to:
  /// **'生卒'**
  String get lifeSpan;

  /// No description provided for @nativePlaceDetail.
  ///
  /// In zh, this message translates to:
  /// **'籍贯'**
  String get nativePlaceDetail;

  /// No description provided for @faction.
  ///
  /// In zh, this message translates to:
  /// **'派系'**
  String get faction;

  /// No description provided for @aliases.
  ///
  /// In zh, this message translates to:
  /// **'别名'**
  String get aliases;

  /// No description provided for @summaryTitle.
  ///
  /// In zh, this message translates to:
  /// **'人物概述'**
  String get summaryTitle;

  /// No description provided for @noSummary.
  ///
  /// In zh, this message translates to:
  /// **'暂无概述'**
  String get noSummary;

  /// No description provided for @timeline.
  ///
  /// In zh, this message translates to:
  /// **'生平时间线'**
  String get timeline;

  /// No description provided for @sourceRef.
  ///
  /// In zh, this message translates to:
  /// **'出处：{source}'**
  String sourceRef(String source);

  /// No description provided for @criminalRecords.
  ///
  /// In zh, this message translates to:
  /// **'犯罪记录'**
  String get criminalRecords;

  /// No description provided for @process.
  ///
  /// In zh, this message translates to:
  /// **'经过：{detail}'**
  String process(String detail);

  /// No description provided for @harm.
  ///
  /// In zh, this message translates to:
  /// **'危害：{detail}'**
  String harm(String detail);

  /// No description provided for @sourceMaterial.
  ///
  /// In zh, this message translates to:
  /// **'史料出处：{reference}'**
  String sourceMaterial(String reference);

  /// No description provided for @familyAndResidence.
  ///
  /// In zh, this message translates to:
  /// **'家族与居住'**
  String get familyAndResidence;

  /// No description provided for @spouse.
  ///
  /// In zh, this message translates to:
  /// **'配偶'**
  String get spouse;

  /// No description provided for @children.
  ///
  /// In zh, this message translates to:
  /// **'子女'**
  String get children;

  /// No description provided for @genderLabel.
  ///
  /// In zh, this message translates to:
  /// **'性别'**
  String get genderLabel;

  /// No description provided for @whereabouts.
  ///
  /// In zh, this message translates to:
  /// **'去向'**
  String get whereabouts;

  /// No description provided for @residenceChanges.
  ///
  /// In zh, this message translates to:
  /// **'居住地变迁'**
  String get residenceChanges;

  /// No description provided for @photos.
  ///
  /// In zh, this message translates to:
  /// **'人物照片'**
  String get photos;

  /// No description provided for @evidence.
  ///
  /// In zh, this message translates to:
  /// **'罪证材料'**
  String get evidence;

  /// No description provided for @document.
  ///
  /// In zh, this message translates to:
  /// **'文'**
  String get document;

  /// No description provided for @revisionHistory.
  ///
  /// In zh, this message translates to:
  /// **'修改历史'**
  String get revisionHistory;

  /// No description provided for @reviewedBy.
  ///
  /// In zh, this message translates to:
  /// **' · 审核：{name}'**
  String reviewedBy(String name);

  /// No description provided for @noRevisions.
  ///
  /// In zh, this message translates to:
  /// **'暂无修改记录'**
  String get noRevisions;

  /// No description provided for @editThisArchive.
  ///
  /// In zh, this message translates to:
  /// **'修改此档案'**
  String get editThisArchive;

  /// No description provided for @sources.
  ///
  /// In zh, this message translates to:
  /// **'史料来源'**
  String get sources;

  /// No description provided for @language.
  ///
  /// In zh, this message translates to:
  /// **'语言'**
  String get language;

  /// No description provided for @chooseLanguage.
  ///
  /// In zh, this message translates to:
  /// **'选择语言'**
  String get chooseLanguage;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) => <String>[
    'de',
    'en',
    'es',
    'fr',
    'ja',
    'ko',
    'ru',
    'zh',
  ].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'de':
      return AppLocalizationsDe();
    case 'en':
      return AppLocalizationsEn();
    case 'es':
      return AppLocalizationsEs();
    case 'fr':
      return AppLocalizationsFr();
    case 'ja':
      return AppLocalizationsJa();
    case 'ko':
      return AppLocalizationsKo();
    case 'ru':
      return AppLocalizationsRu();
    case 'zh':
      return AppLocalizationsZh();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
