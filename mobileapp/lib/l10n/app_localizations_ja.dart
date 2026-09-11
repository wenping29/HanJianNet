// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Japanese (`ja`).
class AppLocalizationsJa extends AppLocalizations {
  AppLocalizationsJa([String locale = 'ja']) : super(locale);

  @override
  String get appTitle => '売国奴ファイル · HanJianNet';

  @override
  String get appLogoText => '売国奴\nファイル';

  @override
  String get navHome => 'ホーム';

  @override
  String get navSearch => '検索';

  @override
  String get navMine => 'マイ';

  @override
  String get networkError => 'ネットワークリクエストに失敗しました。API アドレスとインターネット接続を確認してください。';

  @override
  String requestFailed(int statusCode) {
    return 'リクエストに失敗しました（$statusCode）';
  }

  @override
  String uploadFailed(int statusCode) {
    return 'アップロードに失敗しました（$statusCode）';
  }

  @override
  String get unknown => '不明';

  @override
  String get circa => '約';

  @override
  String get before => '前';

  @override
  String get after => '後';

  @override
  String get approved => '承認済み';

  @override
  String get rejected => '却下';

  @override
  String get pending => '審査待ち';

  @override
  String get retry => '再試行';

  @override
  String get noRecords => '記録なし';

  @override
  String get archives => '売国奴ファイル';

  @override
  String get figures => '人物一覧';

  @override
  String get totalArchives => 'ファイル総数';

  @override
  String get apiSettings => 'API 設定';

  @override
  String get apiBaseUrlHint =>
      'Web API ベースアドレス（Android エミュレーターからホストへは 10.0.2.2 を使用）';

  @override
  String get cancel => 'キャンセル';

  @override
  String get save => '保存';

  @override
  String saved(String url) {
    return '保存しました：$url';
  }

  @override
  String get login => 'ログイン';

  @override
  String get emailOrUsername => 'メール / ユーザー名';

  @override
  String get password => 'パスワード';

  @override
  String get loggingIn => 'ログイン中…';

  @override
  String get loginButton => 'ログイン';

  @override
  String get noAccount => 'アカウントをお持ちでない方は登録';

  @override
  String get fillAllFields => 'すべての項目を入力してください';

  @override
  String get invalidEmail => 'メールアドレスの形式が正しくありません';

  @override
  String get passwordTooShort => 'パスワードは8文字以上必要です';

  @override
  String get passwordMismatch => 'パスワードが一致しません';

  @override
  String get register => '登録';

  @override
  String get username => 'ユーザー名';

  @override
  String get email => 'メール';

  @override
  String get passwordHint => 'パスワード（8文字以上）';

  @override
  String get confirmPassword => 'パスワード（確認）';

  @override
  String get registering => '登録中…';

  @override
  String get registerButton => '登録';

  @override
  String get hasAccount => 'アカウントをお持ちですか？ログイン';

  @override
  String get allPeriods => 'すべて';

  @override
  String get lateSong => '宋末';

  @override
  String get lateMing => '明末';

  @override
  String get lateQing => '清末';

  @override
  String get republic => '民国';

  @override
  String get other => 'その他';

  @override
  String get searchButton => '検索';

  @override
  String get nameLabel => '姓名';

  @override
  String get nameHint => '人物名によるあいまい検索';

  @override
  String get yearFrom => '年（始まり）';

  @override
  String get yearFromHint => '例 1937';

  @override
  String get yearTo => '年（終わり）';

  @override
  String get yearToHint => '例 1945';

  @override
  String get eventKeyword => '事件キーワード';

  @override
  String get nativePlace => '出身地';

  @override
  String get searching => '検索中…';

  @override
  String get noResults => '該当するファイルがありません';

  @override
  String get noPublishedArchives => '公開されたファイルはまだありません';

  @override
  String get personalCenter => 'マイページ';

  @override
  String get exitButton => 'ログアウト';

  @override
  String get mySubmissions => 'マイ投稿';

  @override
  String get mySubmissionsTitle => 'マイ投稿履歴';

  @override
  String get loginForSubmissions => 'ログインすると投稿履歴と審査状況を確認できます';

  @override
  String get loginForMySubmissions => 'ログインすると自分の投稿履歴と審査状況を確認できます';

  @override
  String get goToLogin => 'ログインへ';

  @override
  String get noSubmissions => 'まだ投稿や修正はありません';

  @override
  String get submitNewArchive => '新しいファイルを投稿';

  @override
  String get modifyArchive => 'ファイルを修正';

  @override
  String changeContent(String summary) {
    return '修正内容：$summary';
  }

  @override
  String submittedAt(String time) {
    return '投稿日時 $time';
  }

  @override
  String reviewedAt(String time) {
    return '審査日時 $time';
  }

  @override
  String reviewer(String name) {
    return ' · 審査人：$name';
  }

  @override
  String reviewComment(String comment) {
    return ' · 意見：$comment';
  }

  @override
  String get logout => 'ログアウト';

  @override
  String get editArchive => 'ファイルを編集';

  @override
  String get pleaseLoginFirst => '先にログインしてください';

  @override
  String get nameRequired => '姓名 *';

  @override
  String get nameInput => '姓名を入力してください';

  @override
  String get changeDescription => '修正説明 *';

  @override
  String get changeDescriptionInput => '修正の説明を入力してください';

  @override
  String get submitButton => '送信';

  @override
  String get archiveDetail => 'ファイルの詳細';

  @override
  String courtesyName(String name) {
    return '字：$name';
  }

  @override
  String pseudonym(String name) {
    return '号：$name';
  }

  @override
  String get lifeSpan => '生没年';

  @override
  String get nativePlaceDetail => '出身地';

  @override
  String get faction => '派閥';

  @override
  String get aliases => '別名';

  @override
  String get summaryTitle => '人物概要';

  @override
  String get noSummary => '概要なし';

  @override
  String get timeline => '年表';

  @override
  String sourceRef(String source) {
    return '出典：$source';
  }

  @override
  String get criminalRecords => '犯罪記録';

  @override
  String process(String detail) {
    return '経過：$detail';
  }

  @override
  String harm(String detail) {
    return '危害：$detail';
  }

  @override
  String sourceMaterial(String reference) {
    return '史料出典：$reference';
  }

  @override
  String get familyAndResidence => '家族と居住';

  @override
  String get spouse => '配偶者';

  @override
  String get children => '子女';

  @override
  String get genderLabel => '性別';

  @override
  String get whereabouts => '去向';

  @override
  String get residenceChanges => '居住地の変遷';

  @override
  String get photos => '人物写真';

  @override
  String get evidence => '罪証資料';

  @override
  String get document => '文書';

  @override
  String get revisionHistory => '修正履歴';

  @override
  String reviewedBy(String name) {
    return ' · 審査：$name';
  }

  @override
  String get noRevisions => '修正履歴なし';

  @override
  String get editThisArchive => 'このファイルを修正';

  @override
  String get sources => '参考文献';

  @override
  String get language => '言語';

  @override
  String get chooseLanguage => '言語を選択';
}
