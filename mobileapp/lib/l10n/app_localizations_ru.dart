// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Russian (`ru`).
class AppLocalizationsRu extends AppLocalizations {
  AppLocalizationsRu([String locale = 'ru']) : super(locale);

  @override
  String get appTitle => 'Архив предателей · HanJianNet';

  @override
  String get appLogoText => 'Архив\nпредателей';

  @override
  String get navHome => 'Главная';

  @override
  String get navSearch => 'Поиск';

  @override
  String get navMine => 'Моё';

  @override
  String get networkError =>
      'Сбой сетевого запроса. Проверьте адрес API и подключение к интернету.';

  @override
  String requestFailed(int statusCode) {
    return 'Запрос не удался ($statusCode)';
  }

  @override
  String uploadFailed(int statusCode) {
    return 'Загрузка не удалась ($statusCode)';
  }

  @override
  String get unknown => 'Неизвестно';

  @override
  String get circa => 'ок. ';

  @override
  String get before => ' до н.э.';

  @override
  String get after => ' н.э.';

  @override
  String get approved => 'Одобрено';

  @override
  String get rejected => 'Отклонено';

  @override
  String get pending => 'На рассмотрении';

  @override
  String get retry => 'Повторить';

  @override
  String get noRecords => 'Нет записей';

  @override
  String get archives => 'Архив предателей';

  @override
  String get figures => 'Персоны';

  @override
  String get totalArchives => 'Всего архивов';

  @override
  String get apiSettings => 'Настройки API';

  @override
  String get apiBaseUrlHint =>
      'Базовый адрес Web API (на эмуляторе Android используйте 10.0.2.2 для доступа к хосту)';

  @override
  String get cancel => 'Отмена';

  @override
  String get save => 'Сохранить';

  @override
  String saved(String url) {
    return 'Сохранено: $url';
  }

  @override
  String get login => 'Вход';

  @override
  String get emailOrUsername => 'Почта / Имя пользователя';

  @override
  String get password => 'Пароль';

  @override
  String get loggingIn => 'Вход…';

  @override
  String get loginButton => 'ВОЙТИ';

  @override
  String get noAccount => 'Нет аккаунта? Регистрация';

  @override
  String get fillAllFields => 'Заполните все поля';

  @override
  String get invalidEmail => 'Некорректный формат почты';

  @override
  String get passwordTooShort => 'Пароль не короче 8 символов';

  @override
  String get passwordMismatch => 'Пароли не совпадают';

  @override
  String get register => 'Регистрация';

  @override
  String get username => 'Имя пользователя';

  @override
  String get email => 'Почта';

  @override
  String get passwordHint => 'Пароль (не менее 8 символов)';

  @override
  String get confirmPassword => 'Подтвердите пароль';

  @override
  String get registering => 'Регистрация…';

  @override
  String get registerButton => 'ЗАРЕГИСТРИРОВАТЬ';

  @override
  String get hasAccount => 'Уже есть аккаунт? Войти';

  @override
  String get allPeriods => 'Все';

  @override
  String get lateSong => 'Конец Сун';

  @override
  String get lateMing => 'Конец Мин';

  @override
  String get lateQing => 'Конец Цин';

  @override
  String get republic => 'Республика';

  @override
  String get other => 'Другое';

  @override
  String get searchButton => 'НАЙТИ';

  @override
  String get nameLabel => 'Имя';

  @override
  String get nameHint => 'Нечёткий поиск по имени';

  @override
  String get yearFrom => 'Год с';

  @override
  String get yearFromHint => 'напр. 1937';

  @override
  String get yearTo => 'Год по';

  @override
  String get yearToHint => 'напр. 1945';

  @override
  String get eventKeyword => 'Ключевое слово события';

  @override
  String get nativePlace => 'Родной край';

  @override
  String get searching => 'Поиск…';

  @override
  String get noResults => 'Подходящих архивов нет';

  @override
  String get noPublishedArchives => 'Опубликованных архивов пока нет';

  @override
  String get personalCenter => 'Профиль';

  @override
  String get exitButton => 'Выйти';

  @override
  String get mySubmissions => 'МОИ ЗАЯВКИ';

  @override
  String get mySubmissionsTitle => 'МОИ ЗАЯВКИ';

  @override
  String get loginForSubmissions =>
      'Войдите, чтобы видеть свои заявки и статус проверки';

  @override
  String get loginForMySubmissions =>
      'Войдите, чтобы видеть личные заявки и статус проверки';

  @override
  String get goToLogin => 'Перейти к входу';

  @override
  String get noSubmissions => 'Пока нет поданных архивов или правок';

  @override
  String get submitNewArchive => 'Подать новый архив';

  @override
  String get modifyArchive => 'Изменить архив';

  @override
  String changeContent(String summary) {
    return 'Изменения: $summary';
  }

  @override
  String submittedAt(String time) {
    return 'Подано $time';
  }

  @override
  String reviewedAt(String time) {
    return 'Проверено $time';
  }

  @override
  String reviewer(String name) {
    return ' · Проверяющий: $name';
  }

  @override
  String reviewComment(String comment) {
    return ' · Мнение: $comment';
  }

  @override
  String get logout => 'Выйти';

  @override
  String get editArchive => 'Редактировать архив';

  @override
  String get pleaseLoginFirst => 'Сначала войдите';

  @override
  String get nameRequired => 'Имя *';

  @override
  String get nameInput => 'Введите имя';

  @override
  String get changeDescription => 'Описание изменений *';

  @override
  String get changeDescriptionInput => 'Введите описание изменений';

  @override
  String get submitButton => 'ОТПРАВИТЬ';

  @override
  String get archiveDetail => 'Детали архива';

  @override
  String courtesyName(String name) {
    return 'Прозвище: $name';
  }

  @override
  String pseudonym(String name) {
    return 'Псевдоним: $name';
  }

  @override
  String get lifeSpan => 'Годы жизни';

  @override
  String get nativePlaceDetail => 'Родной край';

  @override
  String get faction => 'Фракция';

  @override
  String get aliases => 'Псевдонимы';

  @override
  String get summaryTitle => 'Обзор';

  @override
  String get noSummary => 'Нет обзора';

  @override
  String get timeline => 'Хронология';

  @override
  String sourceRef(String source) {
    return 'Источник: $source';
  }

  @override
  String get criminalRecords => 'Преступления';

  @override
  String process(String detail) {
    return 'Ход: $detail';
  }

  @override
  String harm(String detail) {
    return 'Вред: $detail';
  }

  @override
  String sourceMaterial(String reference) {
    return 'Исторический источник: $reference';
  }

  @override
  String get familyAndResidence => 'Семья и место жительства';

  @override
  String get spouse => 'Супруг(а)';

  @override
  String get children => 'Дети';

  @override
  String get genderLabel => 'Пол';

  @override
  String get whereabouts => 'Местонахождение';

  @override
  String get residenceChanges => 'Переезды';

  @override
  String get photos => 'Фотографии';

  @override
  String get evidence => 'Улики';

  @override
  String get document => 'Док';

  @override
  String get revisionHistory => 'Ревизии';

  @override
  String reviewedBy(String name) {
    return ' · Проверил: $name';
  }

  @override
  String get noRevisions => 'Пока нет ревизий';

  @override
  String get editThisArchive => 'Изменить этот архив';

  @override
  String get sources => 'Источники';

  @override
  String get language => 'Язык';

  @override
  String get chooseLanguage => 'Выбрать язык';

  @override
  String get basicInfo => 'Основная информация';

  @override
  String get birthYearLabel => 'Год рождения';

  @override
  String get deathYearLabel => 'Год смерти';

  @override
  String get yearExact => 'Точно';

  @override
  String get birthPlaceLabel => 'Место рождения';

  @override
  String get officialTitleLabel => 'Должность (марионеточный режим)';

  @override
  String get tagsLabel => 'Метки';

  @override
  String get tagsHint => 'Перечисляйте метки через запятую';

  @override
  String get rowYear => 'Год';

  @override
  String get rowEvent => 'Событие';

  @override
  String get rowTitle => 'Заголовок';

  @override
  String get rowProcess => 'Ход событий';

  @override
  String get rowHarm => 'Ущерб';

  @override
  String get rowSourceRef => 'Источник';

  @override
  String get rowRemark => 'Примечание';

  @override
  String get rowPlace => 'Место';

  @override
  String get rowPeriod => 'Период';

  @override
  String get rowCitation => 'Цитата';

  @override
  String get rowCredibility => 'Достоверность (1-5)';

  @override
  String get rowCaption => 'Подпись к фото';

  @override
  String get addItem => 'Добавить';

  @override
  String get deleteItem => 'Удалить';

  @override
  String get uploadPhoto => 'Загрузить фото';

  @override
  String get uploadEvidence => 'Загрузить улику';

  @override
  String get uploading => 'Загрузка…';

  @override
  String get summaryRequired => 'Введите описание личности';

  @override
  String get submitSuccess => 'Отправлено, ожидает проверки';

  @override
  String get submitFailed => 'Ошибка отправки';

  @override
  String get searchPrompt => 'Введите условия и нажмите «Поиск»';

  @override
  String get settings => 'Настройки';

  @override
  String get editProfile => 'Редактировать профиль';

  @override
  String get profileUpdated => 'Профиль обновлён';

  @override
  String get editAvatar => 'Изменить аватар';

  @override
  String get avatarUpdated => 'Аватар обновлён';

  @override
  String get notifications => 'Уведомления';

  @override
  String get noNotifications => 'Нет уведомлений';

  @override
  String get markAllRead => 'Отметить все прочитанными';

  @override
  String notificationApproved(String name) {
    return 'Ваша заявка «$name» одобрена';
  }

  @override
  String notificationRejected(String name) {
    return 'Ваша заявка «$name» отклонена';
  }
}
