// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get appTitle => 'Archives des traîtres · HanJianNet';

  @override
  String get appLogoText => 'Archives\ndes traîtres';

  @override
  String get navHome => 'Accueil';

  @override
  String get navSearch => 'Recherche';

  @override
  String get navMine => 'Moi';

  @override
  String get networkError =>
      'Échec de la requête réseau. Vérifiez l\'adresse de l\'API et la connexion Internet.';

  @override
  String requestFailed(int statusCode) {
    return 'Échec de la requête ($statusCode)';
  }

  @override
  String uploadFailed(int statusCode) {
    return 'Échec du téléversement ($statusCode)';
  }

  @override
  String get unknown => 'Inconnu';

  @override
  String get circa => 'vers ';

  @override
  String get before => ' av. J.-C.';

  @override
  String get after => ' ap. J.-C.';

  @override
  String get approved => 'Approuvé';

  @override
  String get rejected => 'Rejeté';

  @override
  String get pending => 'En attente';

  @override
  String get retry => 'Réessayer';

  @override
  String get noRecords => 'Aucun enregistrement';

  @override
  String get archives => 'Archives des traîtres';

  @override
  String get figures => 'Personnes';

  @override
  String get totalArchives => 'Total des archives';

  @override
  String get apiSettings => 'Paramètres de l\'API';

  @override
  String get apiBaseUrlHint =>
      'Adresse de base de l\'API Web (utilisez 10.0.2.2 sur l\'émulateur Android pour accéder à l\'hôte)';

  @override
  String get cancel => 'Annuler';

  @override
  String get save => 'Enregistrer';

  @override
  String saved(String url) {
    return 'Enregistré : $url';
  }

  @override
  String get login => 'Connexion';

  @override
  String get emailOrUsername => 'E-mail / Nom d\'utilisateur';

  @override
  String get password => 'Mot de passe';

  @override
  String get loggingIn => 'Connexion…';

  @override
  String get loginButton => 'CONNEXION';

  @override
  String get noAccount => 'Pas de compte ? S\'inscrire';

  @override
  String get fillAllFields => 'Veuillez remplir tous les champs';

  @override
  String get invalidEmail => 'Format d\'e-mail invalide';

  @override
  String get passwordTooShort =>
      'Le mot de passe doit contenir au moins 8 caractères';

  @override
  String get passwordMismatch => 'Les deux mots de passe ne correspondent pas';

  @override
  String get register => 'S\'inscrire';

  @override
  String get username => 'Nom d\'utilisateur';

  @override
  String get email => 'E-mail';

  @override
  String get passwordHint => 'Mot de passe (au moins 8 caractères)';

  @override
  String get confirmPassword => 'Confirmer le mot de passe';

  @override
  String get registering => 'Inscription…';

  @override
  String get registerButton => 'S\'INSCRIRE';

  @override
  String get hasAccount => 'Déjà un compte ? Se connecter';

  @override
  String get allPeriods => 'Tous';

  @override
  String get lateSong => 'Fin des Song';

  @override
  String get lateMing => 'Fin des Ming';

  @override
  String get lateQing => 'Fin des Qing';

  @override
  String get republic => 'République';

  @override
  String get other => 'Autre';

  @override
  String get searchButton => 'RECHERCHER';

  @override
  String get nameLabel => 'Nom';

  @override
  String get nameHint => 'Correspondance floue par nom';

  @override
  String get yearFrom => 'Année de';

  @override
  String get yearFromHint => 'ex. 1937';

  @override
  String get yearTo => 'Année à';

  @override
  String get yearToHint => 'ex. 1945';

  @override
  String get eventKeyword => 'Mot-clé d\'événement';

  @override
  String get nativePlace => 'Lieu d\'origine';

  @override
  String get searching => 'Recherche…';

  @override
  String get noResults => 'Aucune archive correspondante';

  @override
  String get noPublishedArchives => 'Aucune archive publiée';

  @override
  String get personalCenter => 'Profil';

  @override
  String get exitButton => 'Déconnexion';

  @override
  String get mySubmissions => 'MES SOUMISSIONS';

  @override
  String get mySubmissionsTitle => 'MES SOUMISSIONS';

  @override
  String get loginForSubmissions =>
      'Connectez-vous pour voir vos soumissions et leur statut';

  @override
  String get loginForMySubmissions =>
      'Connectez-vous pour voir vos soumissions personnelles et leur statut';

  @override
  String get goToLogin => 'Aller à la connexion';

  @override
  String get noSubmissions => 'Aucune archive ou modification soumise';

  @override
  String get submitNewArchive => 'Soumettre une nouvelle archive';

  @override
  String get modifyArchive => 'Modifier l\'archive';

  @override
  String changeContent(String summary) {
    return 'Modifications : $summary';
  }

  @override
  String submittedAt(String time) {
    return 'Soumise le $time';
  }

  @override
  String reviewedAt(String time) {
    return 'Examinée le $time';
  }

  @override
  String reviewer(String name) {
    return ' · Examinateur : $name';
  }

  @override
  String reviewComment(String comment) {
    return ' · Avis : $comment';
  }

  @override
  String get logout => 'Se déconnecter';

  @override
  String get editArchive => 'Modifier l\'archive';

  @override
  String get pleaseLoginFirst => 'Connectez-vous d\'abord';

  @override
  String get nameRequired => 'Nom *';

  @override
  String get nameInput => 'Veuillez saisir le nom';

  @override
  String get changeDescription => 'Description des modifications *';

  @override
  String get changeDescriptionInput =>
      'Veuillez saisir une description des modifications';

  @override
  String get submitButton => 'SOUMETTRE';

  @override
  String get archiveDetail => 'Détails de l\'archive';

  @override
  String courtesyName(String name) {
    return 'Nom de courtoisie : $name';
  }

  @override
  String pseudonym(String name) {
    return 'Pseudonyme : $name';
  }

  @override
  String get lifeSpan => 'Vie';

  @override
  String get nativePlaceDetail => 'Lieu d\'origine';

  @override
  String get faction => 'Faction';

  @override
  String get aliases => 'Alias';

  @override
  String get summaryTitle => 'Résumé';

  @override
  String get noSummary => 'Aucun résumé';

  @override
  String get timeline => 'Chronologie';

  @override
  String sourceRef(String source) {
    return 'Source : $source';
  }

  @override
  String get criminalRecords => 'Antécédents criminels';

  @override
  String process(String detail) {
    return 'Processus : $detail';
  }

  @override
  String harm(String detail) {
    return 'Préjudice : $detail';
  }

  @override
  String sourceMaterial(String reference) {
    return 'Source historique : $reference';
  }

  @override
  String get familyAndResidence => 'Famille & résidence';

  @override
  String get spouse => 'Époux(se)';

  @override
  String get children => 'Enfants';

  @override
  String get genderLabel => 'Sexe';

  @override
  String get whereabouts => 'Devenir';

  @override
  String get residenceChanges => 'Changements de résidence';

  @override
  String get photos => 'Photographies';

  @override
  String get evidence => 'Preuves';

  @override
  String get document => 'Doc';

  @override
  String get revisionHistory => 'Révisions';

  @override
  String reviewedBy(String name) {
    return ' · Examiné par : $name';
  }

  @override
  String get noRevisions => 'Aucune révision';

  @override
  String get editThisArchive => 'Modifier cette archive';

  @override
  String get sources => 'Références';

  @override
  String get language => 'Langue';

  @override
  String get chooseLanguage => 'Choisir la langue';
}
