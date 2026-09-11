// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Spanish Castilian (`es`).
class AppLocalizationsEs extends AppLocalizations {
  AppLocalizationsEs([String locale = 'es']) : super(locale);

  @override
  String get appTitle => 'Archivo de traidores · HanJianNet';

  @override
  String get appLogoText => 'Archivo\nde traidores';

  @override
  String get navHome => 'Inicio';

  @override
  String get navSearch => 'Búsqueda';

  @override
  String get navMine => 'Mi';

  @override
  String get networkError =>
      'Error en la solicitud de red. Comprueba la dirección de la API y la conexión a Internet.';

  @override
  String requestFailed(int statusCode) {
    return 'La solicitud falló ($statusCode)';
  }

  @override
  String uploadFailed(int statusCode) {
    return 'La carga falló ($statusCode)';
  }

  @override
  String get unknown => 'Desconocido';

  @override
  String get circa => 'c.';

  @override
  String get before => ' a. C.';

  @override
  String get after => ' d. C.';

  @override
  String get approved => 'Aprobado';

  @override
  String get rejected => 'Rechazado';

  @override
  String get pending => 'Pendiente';

  @override
  String get retry => 'Reintentar';

  @override
  String get noRecords => 'Sin registros';

  @override
  String get archives => 'Archivo de traidores';

  @override
  String get figures => 'Personas';

  @override
  String get totalArchives => 'Total de archivos';

  @override
  String get apiSettings => 'Configuración de la API';

  @override
  String get apiBaseUrlHint =>
      'Dirección base de la API web (usa 10.0.2.2 en el emulador de Android para acceder al host)';

  @override
  String get cancel => 'Cancelar';

  @override
  String get save => 'Guardar';

  @override
  String saved(String url) {
    return 'Guardado: $url';
  }

  @override
  String get login => 'Iniciar sesión';

  @override
  String get emailOrUsername => 'Correo / Usuario';

  @override
  String get password => 'Contraseña';

  @override
  String get loggingIn => 'Iniciando sesión…';

  @override
  String get loginButton => 'ENTRAR';

  @override
  String get noAccount => '¿Sin cuenta? Regístrate';

  @override
  String get fillAllFields => 'Completa todos los campos';

  @override
  String get invalidEmail => 'Formato de correo no válido';

  @override
  String get passwordTooShort =>
      'La contraseña debe tener al menos 8 caracteres';

  @override
  String get passwordMismatch => 'Las contraseñas no coinciden';

  @override
  String get register => 'Registro';

  @override
  String get username => 'Usuario';

  @override
  String get email => 'Correo';

  @override
  String get passwordHint => 'Contraseña (al menos 8 caracteres)';

  @override
  String get confirmPassword => 'Confirmar contraseña';

  @override
  String get registering => 'Registrando…';

  @override
  String get registerButton => 'REGISTRARSE';

  @override
  String get hasAccount => '¿Ya tienes cuenta? Inicia sesión';

  @override
  String get allPeriods => 'Todos';

  @override
  String get lateSong => 'Final Song';

  @override
  String get lateMing => 'Final Ming';

  @override
  String get lateQing => 'Final Qing';

  @override
  String get republic => 'República';

  @override
  String get other => 'Otro';

  @override
  String get searchButton => 'BUSCAR';

  @override
  String get nameLabel => 'Nombre';

  @override
  String get nameHint => 'Coincidencia difusa por nombre';

  @override
  String get yearFrom => 'Año desde';

  @override
  String get yearFromHint => 'p. ej. 1937';

  @override
  String get yearTo => 'Año hasta';

  @override
  String get yearToHint => 'p. ej. 1945';

  @override
  String get eventKeyword => 'Palabra clave de evento';

  @override
  String get nativePlace => 'Lugar de origen';

  @override
  String get searching => 'Buscando…';

  @override
  String get noResults => 'No se encontraron archivos coincidentes';

  @override
  String get noPublishedArchives => 'Aún no hay archivos publicados';

  @override
  String get personalCenter => 'Perfil';

  @override
  String get exitButton => 'Salir';

  @override
  String get mySubmissions => 'MIS ENVÍOS';

  @override
  String get mySubmissionsTitle => 'MIS ENVÍOS';

  @override
  String get loginForSubmissions =>
      'Inicia sesión para ver tus envíos y su estado de revisión';

  @override
  String get loginForMySubmissions =>
      'Inicia sesión para ver tus envíos personales y su estado de revisión';

  @override
  String get goToLogin => 'Ir a iniciar sesión';

  @override
  String get noSubmissions => 'Aún no has enviado archivos ni modificaciones';

  @override
  String get submitNewArchive => 'Enviar nuevo archivo';

  @override
  String get modifyArchive => 'Modificar archivo';

  @override
  String changeContent(String summary) {
    return 'Cambios: $summary';
  }

  @override
  String submittedAt(String time) {
    return 'Enviado el $time';
  }

  @override
  String reviewedAt(String time) {
    return 'Revisado el $time';
  }

  @override
  String reviewer(String name) {
    return ' · Revisor: $name';
  }

  @override
  String reviewComment(String comment) {
    return ' · Opinión: $comment';
  }

  @override
  String get logout => 'Cerrar sesión';

  @override
  String get editArchive => 'Editar archivo';

  @override
  String get pleaseLoginFirst => 'Inicia sesión primero';

  @override
  String get nameRequired => 'Nombre *';

  @override
  String get nameInput => 'Introduce el nombre';

  @override
  String get changeDescription => 'Descripción de cambios *';

  @override
  String get changeDescriptionInput =>
      'Introduce una descripción de los cambios';

  @override
  String get submitButton => 'ENVIAR';

  @override
  String get archiveDetail => 'Detalles del archivo';

  @override
  String courtesyName(String name) {
    return 'Nombre de cortesía: $name';
  }

  @override
  String pseudonym(String name) {
    return 'Seudónimo: $name';
  }

  @override
  String get lifeSpan => 'Vida';

  @override
  String get nativePlaceDetail => 'Lugar de origen';

  @override
  String get faction => 'Facción';

  @override
  String get aliases => 'Alias';

  @override
  String get summaryTitle => 'Resumen';

  @override
  String get noSummary => 'Sin resumen';

  @override
  String get timeline => 'Cronología';

  @override
  String sourceRef(String source) {
    return 'Fuente: $source';
  }

  @override
  String get criminalRecords => 'Antecedentes penales';

  @override
  String process(String detail) {
    return 'Proceso: $detail';
  }

  @override
  String harm(String detail) {
    return 'Daño: $detail';
  }

  @override
  String sourceMaterial(String reference) {
    return 'Fuente histórica: $reference';
  }

  @override
  String get familyAndResidence => 'Familia y residencia';

  @override
  String get spouse => 'Cónyuge';

  @override
  String get children => 'Hijos';

  @override
  String get genderLabel => 'Sexo';

  @override
  String get whereabouts => 'Paradero';

  @override
  String get residenceChanges => 'Cambios de residencia';

  @override
  String get photos => 'Fotografías';

  @override
  String get evidence => 'Pruebas';

  @override
  String get document => 'Doc';

  @override
  String get revisionHistory => 'Revisiones';

  @override
  String reviewedBy(String name) {
    return ' · Revisado por: $name';
  }

  @override
  String get noRevisions => 'Sin revisiones';

  @override
  String get editThisArchive => 'Modificar este archivo';

  @override
  String get sources => 'Referencias';

  @override
  String get language => 'Idioma';

  @override
  String get chooseLanguage => 'Elegir idioma';
}
