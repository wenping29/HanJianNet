// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for German (`de`).
class AppLocalizationsDe extends AppLocalizations {
  AppLocalizationsDe([String locale = 'de']) : super(locale);

  @override
  String get appTitle => 'Verräter-Akten · HanJianNet';

  @override
  String get appLogoText => 'Verräter\nAkten';

  @override
  String get navHome => 'Start';

  @override
  String get navSearch => 'Suche';

  @override
  String get navMine => 'Mein';

  @override
  String get networkError =>
      'Netzwerkanfrage fehlgeschlagen. Bitte prüfen Sie die API-Adresse und die Internetverbindung.';

  @override
  String requestFailed(int statusCode) {
    return 'Anfrage fehlgeschlagen ($statusCode)';
  }

  @override
  String uploadFailed(int statusCode) {
    return 'Upload fehlgeschlagen ($statusCode)';
  }

  @override
  String get unknown => 'Unbekannt';

  @override
  String get circa => 'ca.';

  @override
  String get before => ' v. Chr.';

  @override
  String get after => ' n. Chr.';

  @override
  String get approved => 'Genehmigt';

  @override
  String get rejected => 'Abgelehnt';

  @override
  String get pending => 'Ausstehend';

  @override
  String get retry => 'Erneut versuchen';

  @override
  String get noRecords => 'Keine Einträge';

  @override
  String get archives => 'Verräter-Akten';

  @override
  String get figures => 'Personen';

  @override
  String get totalArchives => 'Gesamtzahl der Akten';

  @override
  String get apiSettings => 'API-Einstellungen';

  @override
  String get apiBaseUrlHint =>
      'Web-API-Basisadresse (unter Android-Emulator 10.0.2.2 für den Host verwenden)';

  @override
  String get cancel => 'Abbrechen';

  @override
  String get save => 'Speichern';

  @override
  String saved(String url) {
    return 'Gespeichert: $url';
  }

  @override
  String get login => 'Anmeldung';

  @override
  String get emailOrUsername => 'E-Mail / Benutzername';

  @override
  String get password => 'Passwort';

  @override
  String get loggingIn => 'Anmeldung läuft…';

  @override
  String get loginButton => 'ANMELDEN';

  @override
  String get noAccount => 'Kein Konto? Registrieren';

  @override
  String get fillAllFields => 'Bitte alle Felder ausfüllen';

  @override
  String get invalidEmail => 'Ungültiges E-Mail-Format';

  @override
  String get passwordTooShort => 'Passwort mindestens 8 Zeichen';

  @override
  String get passwordMismatch => 'Die Passwörter stimmen nicht überein';

  @override
  String get register => 'Registrieren';

  @override
  String get username => 'Benutzername';

  @override
  String get email => 'E-Mail';

  @override
  String get passwordHint => 'Passwort (mindestens 8 Zeichen)';

  @override
  String get confirmPassword => 'Passwort bestätigen';

  @override
  String get registering => 'Registrierung läuft…';

  @override
  String get registerButton => 'REGISTRIEREN';

  @override
  String get hasAccount => 'Schon ein Konto? Anmelden';

  @override
  String get allPeriods => 'Alle';

  @override
  String get lateSong => 'Späte Song';

  @override
  String get lateMing => 'Späte Ming';

  @override
  String get lateQing => 'Späte Qing';

  @override
  String get republic => 'Republik';

  @override
  String get other => 'Andere';

  @override
  String get searchButton => 'SUCHEN';

  @override
  String get nameLabel => 'Name';

  @override
  String get nameHint => 'Unscharfe Suche nach Personenname';

  @override
  String get yearFrom => 'Jahr von';

  @override
  String get yearFromHint => 'z. B. 1937';

  @override
  String get yearTo => 'Jahr bis';

  @override
  String get yearToHint => 'z. B. 1945';

  @override
  String get eventKeyword => 'Ereignis-Schlüsselwort';

  @override
  String get nativePlace => 'Herkunftsort';

  @override
  String get searching => 'Suche läuft…';

  @override
  String get noResults => 'Keine passenden Akten gefunden';

  @override
  String get noPublishedArchives => 'Noch keine veröffentlichten Akten';

  @override
  String get personalCenter => 'Profil';

  @override
  String get exitButton => 'Abmelden';

  @override
  String get mySubmissions => 'MEINE EINREICHUNGEN';

  @override
  String get mySubmissionsTitle => 'MEINE EINREICHUNGEN';

  @override
  String get loginForSubmissions =>
      'Melden Sie sich an, um Einreichungen und Prüfstatus zu sehen';

  @override
  String get loginForMySubmissions =>
      'Melden Sie sich an, um Ihre Einreichungen und Prüfstatus zu sehen';

  @override
  String get goToLogin => 'Zur Anmeldung';

  @override
  String get noSubmissions => 'Noch keine Akten oder Änderungen eingereicht';

  @override
  String get submitNewArchive => 'Neue Akte einreichen';

  @override
  String get modifyArchive => 'Akte ändern';

  @override
  String changeContent(String summary) {
    return 'Änderungen: $summary';
  }

  @override
  String submittedAt(String time) {
    return 'Eingereicht am $time';
  }

  @override
  String reviewedAt(String time) {
    return 'Geprüft am $time';
  }

  @override
  String reviewer(String name) {
    return ' · Prüfer: $name';
  }

  @override
  String reviewComment(String comment) {
    return ' · Anmerkung: $comment';
  }

  @override
  String get logout => 'Abmelden';

  @override
  String get editArchive => 'Akte bearbeiten';

  @override
  String get pleaseLoginFirst => 'Bitte zuerst anmelden';

  @override
  String get nameRequired => 'Name *';

  @override
  String get nameInput => 'Bitte Namen eingeben';

  @override
  String get changeDescription => 'Änderungsbeschreibung *';

  @override
  String get changeDescriptionInput => 'Bitte Änderungsbeschreibung eingeben';

  @override
  String get submitButton => 'EINREICHEN';

  @override
  String get archiveDetail => 'Aktendetails';

  @override
  String courtesyName(String name) {
    return 'Höflichkeitsname: $name';
  }

  @override
  String pseudonym(String name) {
    return 'Pseudonym: $name';
  }

  @override
  String get lifeSpan => 'Lebensdaten';

  @override
  String get nativePlaceDetail => 'Herkunftsort';

  @override
  String get faction => 'Fraktion';

  @override
  String get aliases => 'Aliasse';

  @override
  String get summaryTitle => 'Überblick';

  @override
  String get noSummary => 'Kein Überblick';

  @override
  String get timeline => 'Chronologie';

  @override
  String sourceRef(String source) {
    return 'Quelle: $source';
  }

  @override
  String get criminalRecords => 'Straftaten';

  @override
  String process(String detail) {
    return 'Ablauf: $detail';
  }

  @override
  String harm(String detail) {
    return 'Schaden: $detail';
  }

  @override
  String sourceMaterial(String reference) {
    return 'Historische Quelle: $reference';
  }

  @override
  String get familyAndResidence => 'Familie & Wohnsitz';

  @override
  String get spouse => 'Ehepartner';

  @override
  String get children => 'Kinder';

  @override
  String get genderLabel => 'Geschlecht';

  @override
  String get whereabouts => 'Verbleib';

  @override
  String get residenceChanges => 'Wohnortwechsel';

  @override
  String get photos => 'Fotografien';

  @override
  String get evidence => 'Beweismaterial';

  @override
  String get document => 'Dok';

  @override
  String get revisionHistory => 'Revisionen';

  @override
  String reviewedBy(String name) {
    return ' · Geprüft von: $name';
  }

  @override
  String get noRevisions => 'Noch keine Revisionen';

  @override
  String get editThisArchive => 'Diese Akte ändern';

  @override
  String get sources => 'Quellen';

  @override
  String get language => 'Sprache';

  @override
  String get chooseLanguage => 'Sprache wählen';
}
