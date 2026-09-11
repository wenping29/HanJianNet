// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Traitor Files · HanJianNet';

  @override
  String get appLogoText => 'Traitor\nFiles';

  @override
  String get navHome => 'Home';

  @override
  String get navSearch => 'Search';

  @override
  String get navMine => 'Mine';

  @override
  String get networkError =>
      'Network request failed. Please check the API URL and internet connection.';

  @override
  String requestFailed(int statusCode) {
    return 'Request failed ($statusCode)';
  }

  @override
  String uploadFailed(int statusCode) {
    return 'Upload failed ($statusCode)';
  }

  @override
  String get unknown => 'Unknown';

  @override
  String get circa => 'c.';

  @override
  String get before => ' BC';

  @override
  String get after => ' AD';

  @override
  String get approved => 'Approved';

  @override
  String get rejected => 'Rejected';

  @override
  String get pending => 'Pending';

  @override
  String get retry => 'Retry';

  @override
  String get noRecords => 'No records';

  @override
  String get archives => 'Traitor Files';

  @override
  String get figures => 'Figures';

  @override
  String get totalArchives => 'Total Files';

  @override
  String get apiSettings => 'API Settings';

  @override
  String get apiBaseUrlHint =>
      'Web API base URL (use 10.0.2.2 on Android emulator to reach the host)';

  @override
  String get cancel => 'Cancel';

  @override
  String get save => 'Save';

  @override
  String saved(String url) {
    return 'Saved: $url';
  }

  @override
  String get login => 'Login';

  @override
  String get emailOrUsername => 'Email / Username';

  @override
  String get password => 'Password';

  @override
  String get loggingIn => 'Logging in…';

  @override
  String get loginButton => 'LOG IN';

  @override
  String get noAccount => 'No account? Register';

  @override
  String get fillAllFields => 'Please fill in all fields';

  @override
  String get invalidEmail => 'Invalid email format';

  @override
  String get passwordTooShort => 'Password must be at least 8 characters';

  @override
  String get passwordMismatch => 'The two passwords do not match';

  @override
  String get register => 'Register';

  @override
  String get username => 'Username';

  @override
  String get email => 'Email';

  @override
  String get passwordHint => 'Password (at least 8 characters)';

  @override
  String get confirmPassword => 'Confirm password';

  @override
  String get registering => 'Registering…';

  @override
  String get registerButton => 'REGISTER';

  @override
  String get hasAccount => 'Already have an account? Log in';

  @override
  String get allPeriods => 'All';

  @override
  String get lateSong => 'Late Song';

  @override
  String get lateMing => 'Late Ming';

  @override
  String get lateQing => 'Late Qing';

  @override
  String get republic => 'Republic';

  @override
  String get other => 'Other';

  @override
  String get searchButton => 'SEARCH';

  @override
  String get nameLabel => 'Name';

  @override
  String get nameHint => 'Fuzzy match by person\'s name';

  @override
  String get yearFrom => 'Year from';

  @override
  String get yearFromHint => 'e.g. 1937';

  @override
  String get yearTo => 'Year to';

  @override
  String get yearToHint => 'e.g. 1945';

  @override
  String get eventKeyword => 'Event keyword';

  @override
  String get nativePlace => 'Native place';

  @override
  String get searching => 'Searching…';

  @override
  String get noResults => 'No matching files found';

  @override
  String get noPublishedArchives => 'No published files yet';

  @override
  String get personalCenter => 'Profile';

  @override
  String get exitButton => 'Logout';

  @override
  String get mySubmissions => 'MY SUBMISSIONS';

  @override
  String get mySubmissionsTitle => 'MY SUBMISSIONS';

  @override
  String get loginForSubmissions =>
      'Log in to view your submissions and review status';

  @override
  String get loginForMySubmissions =>
      'Log in to view your personal submissions and review status';

  @override
  String get goToLogin => 'Go to login';

  @override
  String get noSubmissions => 'No archives or revisions submitted yet';

  @override
  String get submitNewArchive => 'Submit New Archive';

  @override
  String get modifyArchive => 'Modify Archive';

  @override
  String changeContent(String summary) {
    return 'Change details: $summary';
  }

  @override
  String submittedAt(String time) {
    return 'Submitted at $time';
  }

  @override
  String reviewedAt(String time) {
    return 'Reviewed at $time';
  }

  @override
  String reviewer(String name) {
    return ' · Reviewer: $name';
  }

  @override
  String reviewComment(String comment) {
    return ' · Comment: $comment';
  }

  @override
  String get logout => 'Log out';

  @override
  String get editArchive => 'Edit Archive';

  @override
  String get pleaseLoginFirst => 'Please log in first';

  @override
  String get nameRequired => 'Name *';

  @override
  String get nameInput => 'Please enter the name';

  @override
  String get changeDescription => 'Change description *';

  @override
  String get changeDescriptionInput => 'Please enter a change description';

  @override
  String get submitButton => 'SUBMIT';

  @override
  String get archiveDetail => 'Archive Details';

  @override
  String courtesyName(String name) {
    return 'Courtesy name: $name';
  }

  @override
  String pseudonym(String name) {
    return 'Pseudonym: $name';
  }

  @override
  String get lifeSpan => 'Life span';

  @override
  String get nativePlaceDetail => 'Native place';

  @override
  String get faction => 'Faction';

  @override
  String get aliases => 'Aliases';

  @override
  String get summaryTitle => 'Summary';

  @override
  String get noSummary => 'No summary';

  @override
  String get timeline => 'Chronology';

  @override
  String sourceRef(String source) {
    return 'Source: $source';
  }

  @override
  String get criminalRecords => 'Criminal Records';

  @override
  String process(String detail) {
    return 'Process: $detail';
  }

  @override
  String harm(String detail) {
    return 'Harm: $detail';
  }

  @override
  String sourceMaterial(String reference) {
    return 'Historical source: $reference';
  }

  @override
  String get familyAndResidence => 'Family & Residence';

  @override
  String get spouse => 'Spouses';

  @override
  String get children => 'Children';

  @override
  String get genderLabel => 'Gender';

  @override
  String get whereabouts => 'Whereabouts';

  @override
  String get residenceChanges => 'Residence changes';

  @override
  String get photos => 'Photographs';

  @override
  String get evidence => 'Evidence';

  @override
  String get document => 'Doc';

  @override
  String get revisionHistory => 'Revisions';

  @override
  String reviewedBy(String name) {
    return ' · Reviewed by: $name';
  }

  @override
  String get noRevisions => 'No revisions yet';

  @override
  String get editThisArchive => 'Edit this archive';

  @override
  String get sources => 'References';

  @override
  String get language => 'Language';

  @override
  String get chooseLanguage => 'Choose language';
}
