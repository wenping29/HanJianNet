// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Korean (`ko`).
class AppLocalizationsKo extends AppLocalizations {
  AppLocalizationsKo([String locale = 'ko']) : super(locale);

  @override
  String get appTitle => '매국노 기록 · HanJianNet';

  @override
  String get appLogoText => '매국노\n기록';

  @override
  String get navHome => '홈';

  @override
  String get navSearch => '검색';

  @override
  String get navMine => '마이';

  @override
  String get networkError => '네트워크 요청에 실패했습니다. API 주소와 인터넷 연결을 확인하세요.';

  @override
  String requestFailed(int statusCode) {
    return '요청이 실패했습니다 ($statusCode)';
  }

  @override
  String uploadFailed(int statusCode) {
    return '업로드가 실패했습니다 ($statusCode)';
  }

  @override
  String get unknown => '미상';

  @override
  String get circa => '약';

  @override
  String get before => '전';

  @override
  String get after => '후';

  @override
  String get approved => '승인됨';

  @override
  String get rejected => '반려됨';

  @override
  String get pending => '검토 대기';

  @override
  String get retry => '재시도';

  @override
  String get noRecords => '기록 없음';

  @override
  String get archives => '매국노 기록';

  @override
  String get figures => '인물 목록';

  @override
  String get totalArchives => '총 기록 수';

  @override
  String get apiSettings => 'API 설정';

  @override
  String get apiBaseUrlHint =>
      'Web API 기본 주소 (Android 에뮬레이터에서 호스트에 접속할 때는 10.0.2.2 사용)';

  @override
  String get cancel => '취소';

  @override
  String get save => '저장';

  @override
  String saved(String url) {
    return '저장됨: $url';
  }

  @override
  String get login => '로그인';

  @override
  String get emailOrUsername => '이메일 / 사용자 이름';

  @override
  String get password => '비밀번호';

  @override
  String get loggingIn => '로그인 중…';

  @override
  String get loginButton => '로그인';

  @override
  String get noAccount => '계정이 없으신가요? 회원가입';

  @override
  String get fillAllFields => '모든 항목을 입력해 주세요';

  @override
  String get invalidEmail => '이메일 형식이 올바르지 않습니다';

  @override
  String get passwordTooShort => '비밀번호는 8자 이상이어야 합니다';

  @override
  String get passwordMismatch => '비밀번호가 일치하지 않습니다';

  @override
  String get register => '회원가입';

  @override
  String get username => '사용자 이름';

  @override
  String get email => '이메일';

  @override
  String get passwordHint => '비밀번호 (최소 8자)';

  @override
  String get confirmPassword => '비밀번호 확인';

  @override
  String get registering => '가입 중…';

  @override
  String get registerButton => '가입';

  @override
  String get hasAccount => '이미 계정이 있으신가요? 로그인';

  @override
  String get allPeriods => '전체';

  @override
  String get lateSong => '송말';

  @override
  String get lateMing => '명말';

  @override
  String get lateQing => '청말';

  @override
  String get republic => '민국';

  @override
  String get other => '기타';

  @override
  String get searchButton => '검색';

  @override
  String get nameLabel => '이름';

  @override
  String get nameHint => '인물 이름 부분 일치 검색';

  @override
  String get yearFrom => '연도 시작';

  @override
  String get yearFromHint => '예: 1937';

  @override
  String get yearTo => '연도 끝';

  @override
  String get yearToHint => '예: 1945';

  @override
  String get eventKeyword => '사건 키워드';

  @override
  String get nativePlace => '출신지';

  @override
  String get searching => '검색 중…';

  @override
  String get noResults => '조건에 맞는 기록이 없습니다';

  @override
  String get noPublishedArchives => '아직 공개된 기록이 없습니다';

  @override
  String get personalCenter => '마이페이지';

  @override
  String get exitButton => '로그아웃';

  @override
  String get mySubmissions => '제출 내역';

  @override
  String get mySubmissionsTitle => '제출 기록';

  @override
  String get loginForSubmissions => '로그인하면 제출 내역과 검토 상태를 볼 수 있습니다';

  @override
  String get loginForMySubmissions => '로그인하면 내 제출 기록과 검토 상태를 볼 수 있습니다';

  @override
  String get goToLogin => '로그인하러 가기';

  @override
  String get noSubmissions => '아직 제출한 기록이나 수정이 없습니다';

  @override
  String get submitNewArchive => '새 기록 제출';

  @override
  String get modifyArchive => '기록 수정';

  @override
  String changeContent(String summary) {
    return '수정 내용: $summary';
  }

  @override
  String submittedAt(String time) {
    return '제출일 $time';
  }

  @override
  String reviewedAt(String time) {
    return '검토일 $time';
  }

  @override
  String reviewer(String name) {
    return ' · 검토자: $name';
  }

  @override
  String reviewComment(String comment) {
    return ' · 의견: $comment';
  }

  @override
  String get logout => '로그아웃';

  @override
  String get editArchive => '기록 편집';

  @override
  String get pleaseLoginFirst => '먼저 로그인하세요';

  @override
  String get nameRequired => '이름 *';

  @override
  String get nameInput => '이름을 입력하세요';

  @override
  String get changeDescription => '수정 설명 *';

  @override
  String get changeDescriptionInput => '수정 설명을 입력하세요';

  @override
  String get submitButton => '제출';

  @override
  String get archiveDetail => '기록 상세';

  @override
  String courtesyName(String name) {
    return '자: $name';
  }

  @override
  String pseudonym(String name) {
    return '호: $name';
  }

  @override
  String get lifeSpan => '생몰';

  @override
  String get nativePlaceDetail => '출신지';

  @override
  String get faction => '파벌';

  @override
  String get aliases => '별명';

  @override
  String get summaryTitle => '인물 개요';

  @override
  String get noSummary => '개요 없음';

  @override
  String get timeline => '생애 연표';

  @override
  String sourceRef(String source) {
    return '출처: $source';
  }

  @override
  String get criminalRecords => '범죄 기록';

  @override
  String process(String detail) {
    return '경과: $detail';
  }

  @override
  String harm(String detail) {
    return '피해: $detail';
  }

  @override
  String sourceMaterial(String reference) {
    return '사료 출처: $reference';
  }

  @override
  String get familyAndResidence => '가족과 거주';

  @override
  String get spouse => '배우자';

  @override
  String get children => '자녀';

  @override
  String get genderLabel => '성별';

  @override
  String get whereabouts => '행방';

  @override
  String get residenceChanges => '거주지 변천';

  @override
  String get photos => '인물 사진';

  @override
  String get evidence => '죄증 자료';

  @override
  String get document => '문서';

  @override
  String get revisionHistory => '수정 이력';

  @override
  String reviewedBy(String name) {
    return ' · 심사: $name';
  }

  @override
  String get noRevisions => '수정 이력 없음';

  @override
  String get editThisArchive => '이 기록 수정';

  @override
  String get sources => '참고 자료';

  @override
  String get language => '언어';

  @override
  String get chooseLanguage => '언어 선택';
}
