/// 与 Web API DTO 对齐的数据模型（camelCase JSON）。
library;

typedef Json = Map<String, dynamic>;

class User {
  final String id;
  final String username;
  final String email;
  final String role;
  final String? avatarUrl;
  final String? gender; // male / female / secret
  final String? birthday; // yyyy-MM-dd
  final String? address;
  final String? phone;
  final String? createdAt;

  const User({
    required this.id,
    required this.username,
    required this.email,
    required this.role,
    this.avatarUrl,
    this.gender,
    this.birthday,
    this.address,
    this.phone,
    this.createdAt,
  });

  factory User.fromJson(Json j) => User(
        id: j['id'] as String,
        username: j['username'] as String,
        email: (j['email'] as String?) ?? '',
        role: (j['role'] as String?) ?? 'user',
        avatarUrl: j['avatarUrl'] as String?,
        gender: j['gender'] as String?,
        birthday: j['birthday'] as String?,
        address: j['address'] as String?,
        phone: j['phone'] as String?,
        createdAt: j['createdAt'] as String?,
      );
}

/// 站内通知（避免与 Flutter 框架的 Notification 类同名，命名为 NoticeItem）。
class NoticeItem {
  final String id;
  final String type; // revision_approved / revision_rejected
  final String referenceName;
  final String? comment;
  final String? revisionId;
  final bool isRead;
  final String? createdAt;

  const NoticeItem({
    required this.id,
    required this.type,
    required this.referenceName,
    this.comment,
    this.revisionId,
    required this.isRead,
    this.createdAt,
  });

  factory NoticeItem.fromJson(Json j) => NoticeItem(
        id: j['id'] as String,
        type: (j['type'] as String?) ?? '',
        referenceName: (j['referenceName'] as String?) ?? '',
        comment: j['comment'] as String?,
        revisionId: j['revisionId'] as String?,
        isRead: (j['isRead'] as bool?) ?? false,
        createdAt: j['createdAt'] as String?,
      );

  NoticeItem copyWith({bool? isRead}) => NoticeItem(
        id: id,
        type: type,
        referenceName: referenceName,
        comment: comment,
        revisionId: revisionId,
        isRead: isRead ?? this.isRead,
        createdAt: createdAt,
      );
}

class NotificationListResult {
  final List<NoticeItem> items;
  final int unreadCount;

  const NotificationListResult({required this.items, required this.unreadCount});
}

/// 分省统计项：province 为简称（如「河南」），fullName 与地图 GeoJSON 名称一致（如「河南省」）。
class ProvinceStat {
  final String province;
  final String fullName;
  final int count;

  const ProvinceStat({required this.province, required this.fullName, required this.count});

  factory ProvinceStat.fromJson(Json j) => ProvinceStat(
        province: (j['province'] as String?) ?? '',
        fullName: (j['fullName'] as String?) ?? '',
        count: (j['count'] as num?)?.toInt() ?? 0,
      );
}

class ProvinceStatsResult {
  final List<ProvinceStat> items;
  final int total;
  final int matched;

  const ProvinceStatsResult({required this.items, required this.total, required this.matched});
}

class Spouse {
  final String name;
  final String? remark;

  const Spouse({required this.name, this.remark});

  factory Spouse.fromJson(Json j) => Spouse(
        name: (j['name'] as String?) ?? '',
        remark: j['remark'] as String?,
      );
}

class Child {
  final String name;
  final String? gender;
  final String? whereabouts;
  final String? remark;

  const Child({required this.name, this.gender, this.whereabouts, this.remark});

  factory Child.fromJson(Json j) => Child(
        name: (j['name'] as String?) ?? '',
        gender: j['gender'] as String?,
        whereabouts: j['whereabouts'] as String?,
        remark: j['remark'] as String?,
      );
}

class Residence {
  final String place;
  final String? period;
  final String? remark;

  const Residence({required this.place, this.period, this.remark});

  factory Residence.fromJson(Json j) => Residence(
        place: (j['place'] as String?) ?? '',
        period: j['period'] as String?,
        remark: j['remark'] as String?,
      );
}

class CrimeRecord {
  final int? year;
  final String title;
  final String? process;
  final String? harm;
  final String? sourceRef;

  const CrimeRecord({this.year, required this.title, this.process, this.harm, this.sourceRef});

  factory CrimeRecord.fromJson(Json j) => CrimeRecord(
        year: j['year'] as int?,
        title: (j['title'] as String?) ?? '',
        process: j['process'] as String?,
        harm: j['harm'] as String?,
        sourceRef: j['sourceRef'] as String?,
      );
}

class LifeEvent {
  final int? year;
  final String event;
  final String? sourceRef;

  const LifeEvent({this.year, required this.event, this.sourceRef});

  factory LifeEvent.fromJson(Json j) => LifeEvent(
        year: j['year'] as int?,
        event: (j['event'] as String?) ?? '',
        sourceRef: j['sourceRef'] as String?,
      );
}

class Attachment {
  final String id;
  final String url;
  final String kind; // photo | evidence
  final String fileType;
  final String? caption;

  const Attachment({
    required this.id,
    required this.url,
    required this.kind,
    required this.fileType,
    this.caption,
  });

  bool get isPhoto => kind == 'photo';

  factory Attachment.fromJson(Json j) => Attachment(
        id: (j['id'] as String?) ?? '',
        url: (j['url'] as String?) ?? '',
        kind: (j['kind'] as String?) ?? 'photo',
        fileType: (j['fileType'] as String?) ?? '',
        caption: j['caption'] as String?,
      );
}

class SourceRef {
  final String citation;
  final int? credibility;

  const SourceRef({required this.citation, this.credibility});

  factory SourceRef.fromJson(Json j) => SourceRef(
        citation: (j['citation'] as String?) ?? '',
        credibility: j['credibility'] as int?,
      );
}

class Traitor {
  final String id;
  final String name;
  final String? courtesyName;
  final String? pseudonym;
  final int? birthYear;
  final int? deathYear;
  final String birthYearType;
  final String deathYearType;
  final String nativePlace;
  final String birthPlace;
  final String province;
  final String? title;
  final List<String> aliases;
  final List<String> identityTags;
  final String period;
  final String faction;
  final String summary;
  final List<Spouse> spouses;
  final List<Child> children;
  final List<Residence> residences;
  final List<CrimeRecord> crimeRecords;
  final List<Attachment> attachments;
  final List<SourceRef> sources;
  final List<LifeEvent> lifeEvents;
  final List<String> relatedIds;

  /// 列表/摘要接口直接下发的头像 URL；详情接口无此字段，回退到 attachments 推导。
  final String? photo;

  const Traitor({
    required this.id,
    required this.name,
    this.courtesyName,
    this.pseudonym,
    this.birthYear,
    this.deathYear,
    this.birthYearType = 'exact',
    this.deathYearType = 'exact',
    this.nativePlace = '',
    this.birthPlace = '',
    this.province = '',
    this.title,
    this.aliases = const [],
    this.identityTags = const [],
    this.period = '',
    this.faction = '',
    this.summary = '',
    this.spouses = const [],
    this.children = const [],
    this.residences = const [],
    this.crimeRecords = const [],
    this.attachments = const [],
    this.sources = const [],
    this.lifeEvents = const [],
    this.relatedIds = const [],
    this.photo,
  });

  String? get photoUrl {
    if (photo != null && photo!.isNotEmpty) return photo;
    for (final a in attachments) {
      if (a.isPhoto) return a.url;
    }
    return null;
  }

  factory Traitor.fromJson(Json j) => Traitor(
        id: (j['id'] as String?) ?? '',
        name: (j['name'] as String?) ?? '',
        courtesyName: j['courtesyName'] as String?,
        pseudonym: j['pseudonym'] as String?,
        birthYear: j['birthYear'] as int?,
        deathYear: j['deathYear'] as int?,
        birthYearType: (j['birthYearType'] as String?) ?? 'exact',
        deathYearType: (j['deathYearType'] as String?) ?? 'exact',
        nativePlace: (j['nativePlace'] as String?) ?? '',
        birthPlace: (j['birthPlace'] as String?) ?? '',
        province: (j['province'] as String?) ?? '',
        title: j['title'] as String?,
        aliases: ((j['aliases'] as List?) ?? const []).cast<String>(),
        identityTags: ((j['identityTags'] as List?) ?? const []).cast<String>(),
        period: (j['period'] as String?) ?? '',
        faction: (j['faction'] as String?) ?? '',
        summary: (j['summary'] as String?) ?? '',
        spouses: ((j['spouses'] as List?) ?? const [])
            .map((e) => Spouse.fromJson(e as Json))
            .toList(),
        children: ((j['children'] as List?) ?? const [])
            .map((e) => Child.fromJson(e as Json))
            .toList(),
        residences: ((j['residences'] as List?) ?? const [])
            .map((e) => Residence.fromJson(e as Json))
            .toList(),
        crimeRecords: ((j['crimeRecords'] as List?) ?? const [])
            .map((e) => CrimeRecord.fromJson(e as Json))
            .toList(),
        attachments: ((j['attachments'] as List?) ?? const [])
            .map((e) => Attachment.fromJson(e as Json))
            .toList(),
        sources: ((j['sources'] as List?) ?? const [])
            .map((e) => SourceRef.fromJson(e as Json))
            .toList(),
        lifeEvents: ((j['lifeEvents'] as List?) ?? const [])
            .map((e) => LifeEvent.fromJson(e as Json))
            .toList(),
        relatedIds: ((j['relatedIds'] as List?) ?? const []).cast<String>(),
        photo: j['photoUrl'] as String?,
      );
}

class TraitorStats {
  final int total;
  final Map<String, int> periods;
  final int? earliestYear;
  final int? latestYear;

  const TraitorStats({
    required this.total,
    this.periods = const {},
    this.earliestYear,
    this.latestYear,
  });

  factory TraitorStats.fromJson(Json j) => TraitorStats(
        total: (j['total'] as num?)?.toInt() ?? 0,
        periods: (j['periods'] as Map<String, dynamic>?)
                ?.map((k, v) => MapEntry(k, (v as num).toInt())) ??
            const {},
        earliestYear: j['earliestYear'] as int?,
        latestYear: j['latestYear'] as int?,
      );
}

class PaginatedTraitors {
  final List<Traitor> items;
  final int total;
  final int page;
  final int pageSize;
  final int totalPages;

  const PaginatedTraitors({
    required this.items,
    required this.total,
    required this.page,
    required this.pageSize,
    required this.totalPages,
  });

  factory PaginatedTraitors.fromJson(Json j) => PaginatedTraitors(
        items: ((j['items'] as List?) ?? const [])
            .map((e) => Traitor.fromJson(e as Map<String, dynamic>))
            .toList(),
        total: (j['total'] as num?)?.toInt() ?? 0,
        page: (j['page'] as num?)?.toInt() ?? 1,
        pageSize: (j['pageSize'] as num?)?.toInt() ?? 20,
        totalPages: (j['totalPages'] as num?)?.toInt() ?? 0,
      );
}

class TimelineNode {
  final String id;
  final int? year;
  final String event;
  final String? traitorId;
  final String? traitorName;

  const TimelineNode({
    required this.id,
    this.year,
    required this.event,
    this.traitorId,
    this.traitorName,
  });

  factory TimelineNode.fromJson(Json j) => TimelineNode(
        id: (j['id'] as String?) ?? '',
        year: j['year'] as int?,
        event: (j['event'] as String?) ?? '',
        traitorId: j['traitorId'] as String?,
        traitorName: j['traitorName'] as String?,
      );
}

class Revision {
  final String id;
  final String? traitorId;
  final String submitterId;
  final UserBrief? submitter;
  final String submittedAt;
  final String changeSummary;
  final Traitor payload;
  final String status; // pending | approved | rejected
  final UserBrief? reviewer;
  final String? reviewedAt;
  final String? reviewResult;
  final String? reviewComment;

  const Revision({
    required this.id,
    this.traitorId,
    required this.submitterId,
    this.submitter,
    required this.submittedAt,
    required this.changeSummary,
    required this.payload,
    required this.status,
    this.reviewer,
    this.reviewedAt,
    this.reviewResult,
    this.reviewComment,
  });

  bool get isNewArchive => traitorId == null || traitorId!.isEmpty;

  factory Revision.fromJson(Json j) => Revision(
        id: (j['id'] as String?) ?? '',
        traitorId: j['traitorId'] as String?,
        submitterId: (j['submitterId'] as String?) ?? '',
        submitter: j['submitter'] == null ? null : UserBrief.fromJson(j['submitter'] as Json),
        submittedAt: (j['submittedAt'] as String?) ?? '',
        changeSummary: (j['changeSummary'] as String?) ?? '',
        payload: Traitor.fromJson((j['payload'] as Json?) ?? const {}),
        status: (j['status'] as String?) ?? 'pending',
        reviewer: j['reviewer'] == null ? null : UserBrief.fromJson(j['reviewer'] as Json),
        reviewedAt: j['reviewedAt'] as String?,
        reviewResult: j['reviewResult'] as String?,
        reviewComment: j['reviewComment'] as String?,
      );
}

class UserBrief {
  final String id;
  final String username;

  const UserBrief({required this.id, required this.username});

  factory UserBrief.fromJson(Json j) => UserBrief(
        id: (j['id'] as String?) ?? '',
        username: (j['username'] as String?) ?? '',
      );
}
