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
  String get antiJapaneseWar => 'Guerra de Resistencia';

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

  @override
  String get basicInfo => 'Información básica';

  @override
  String get birthYearLabel => 'Año de nacimiento';

  @override
  String get deathYearLabel => 'Año de fallecimiento';

  @override
  String get yearExact => 'Exacto';

  @override
  String get birthPlaceLabel => 'Lugar de nacimiento';

  @override
  String get officialTitleLabel => 'Título oficial (régimen títere)';

  @override
  String get tagsLabel => 'Etiquetas';

  @override
  String get tagsHint => 'Separe las etiquetas con comas';

  @override
  String get rowYear => 'Año';

  @override
  String get rowEvent => 'Evento';

  @override
  String get rowTitle => 'Título';

  @override
  String get rowProcess => 'Proceso';

  @override
  String get rowHarm => 'Daño';

  @override
  String get rowSourceRef => 'Fuente';

  @override
  String get rowRemark => 'Observación';

  @override
  String get rowPlace => 'Lugar';

  @override
  String get rowPeriod => 'Período';

  @override
  String get rowCitation => 'Referencia';

  @override
  String get rowCredibility => 'Credibilidad (1-5)';

  @override
  String get rowCaption => 'Descripción de la imagen';

  @override
  String get addItem => 'Añadir';

  @override
  String get deleteItem => 'Eliminar';

  @override
  String get uploadPhoto => 'Subir foto';

  @override
  String get uploadEvidence => 'Subir evidencia';

  @override
  String get uploading => 'Subiendo…';

  @override
  String get summaryRequired => 'Ingrese el resumen';

  @override
  String get submitSuccess => 'Enviado, pendiente de revisión';

  @override
  String get submitFailed => 'Error al enviar';

  @override
  String get searchPrompt => 'Ingrese los criterios y pulse «Buscar»';

  @override
  String get settings => 'Configuración';

  @override
  String get editProfile => 'Editar perfil';

  @override
  String get profileUpdated => 'Perfil actualizado';

  @override
  String get editAvatar => 'Cambiar avatar';

  @override
  String get avatarUpdated => 'Avatar actualizado';

  @override
  String get notifications => 'Notificaciones';

  @override
  String get noNotifications => 'Sin notificaciones';

  @override
  String get markAllRead => 'Marcar todo como leído';

  @override
  String notificationApproved(String name) {
    return 'Su envío «$name» fue aprobado';
  }

  @override
  String notificationRejected(String name) {
    return 'Su envío «$name» fue rechazado';
  }

  @override
  String get theme => 'Tema';

  @override
  String get chooseTheme => 'Elegir tema';

  @override
  String get themeSystem => 'Seguir el sistema';

  @override
  String get themeDark => 'Oscuro';

  @override
  String get themeLight => 'Claro';

  @override
  String get traitorMap => 'Mapa de traidores';

  @override
  String get mapHint => 'Toque una provincia para ver la distribución';

  @override
  String get viewArchives => 'Ver archivos';

  @override
  String get gender => 'Género';

  @override
  String get genderMale => 'Hombre';

  @override
  String get genderFemale => 'Mujer';

  @override
  String get genderSecret => 'Prefiero no decirlo';

  @override
  String get birthday => 'Fecha de nacimiento';

  @override
  String get address => 'Dirección';

  @override
  String get phone => 'Teléfono';

  @override
  String get invalidPhone => 'Número de teléfono no válido';

  @override
  String get profileAccountFixed =>
      'El nombre de usuario y el correo no se pueden modificar';

  @override
  String get optional => 'Opcional';

  @override
  String get tapToChangeAvatar => 'Toque el avatar para cambiarlo';

  @override
  String get nickname => 'Apodo';

  @override
  String get signature => 'Firma';

  @override
  String get region => 'Región';

  @override
  String get myQrCode => 'Mi código QR';
}
