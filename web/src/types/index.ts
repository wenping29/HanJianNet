export type Period = '宋末' | '明末' | '清末' | '抗日战争时期' | '其他'

export type YearType = 'exact' | 'approx' | 'before' | 'after' | 'unknown'

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export type AttachmentKind = 'photo' | 'evidence'

export type Role = 'superadmin' | 'admin' | 'manager' | 'user' | 'guest'

export interface User {
  id: string
  username: string
  email: string
  role: Role
  createdAt: string
}

export interface Spouse {
  id?: string
  name: string
  remark?: string
}

export interface Child {
  id?: string
  name: string
  gender?: string
  whereabouts?: string
  remark?: string
}

export interface Residence {
  id?: string
  place: string
  period?: string
  remark?: string
}

export interface CrimeRecord {
  id?: string
  year: number | null
  title: string
  process?: string
  harm?: string
  sourceRef?: string
}

export interface LifeEvent {
  id?: string
  year: number | null
  event: string
  sourceRef?: string
}

export interface Attachment {
  id: string
  url: string
  kind: AttachmentKind
  fileType: string
  caption?: string
}export interface SourceRef {
  id?: string
  citation: string
  credibility?: number
}

export interface Traitor {
  id: string
  name: string
  courtesyName?: string
  pseudonym?: string
  birthYear: number | null
  deathYear: number | null
  birthYearType: YearType
  deathYearType: YearType
  nativePlace: string
  aliases: string[]
  identityTags: string[]
  period: Period
  faction: string
  summary: string
  spouses: Spouse[]
  children: Child[]
  residences: Residence[]
  crimeRecords: CrimeRecord[]
  attachments: Attachment[]
  sources: SourceRef[]
  lifeEvents: LifeEvent[]
  relatedIds: string[]
}

export type TraitorSummary = Pick<
  Traitor,
  'id' | 'name' | 'period' | 'faction' | 'birthYear' | 'deathYear' | 'birthYearType' | 'deathYearType' | 'nativePlace' | 'identityTags'
> & {
  photoUrl?: string | null
}

export interface Revision {
  id: string
  traitorId: string | null
  submitterId: string
  submitter?: Pick<User, 'id' | 'username'> | null
  submittedAt: string
  changeSummary: string
  payload: Traitor
  status: ReviewStatus
  reviewerId: string | null
  reviewer?: Pick<User, 'id' | 'username'> | null
  reviewedAt: string | null
  reviewResult: 'approved' | 'rejected' | null
  reviewComment: string | null
}

export interface TraitorStats {
  total: number
  sentenced: number
  childrenInfo: number
  descendantsStatus: number
}

export interface TimelineNode {
  id: string
  year: number | null
  event: string
  traitorId?: string | null
  traitorName?: string | null
}

export interface AuthPayload {
  token: string
  user: User
}

export interface WebMenu {
  id: string
  key: string
  path: string
  label: string
  sort: number
  isEnabled: boolean
}

export interface TraitorInput {
  name: string
  courtesyName?: string
  pseudonym?: string
  birthYear: number | null
  deathYear: number | null
  birthYearType: YearType
  deathYearType: YearType
  nativePlace: string
  aliases: string[]
  identityTags: string[]
  period: Period
  faction: string
  summary: string
  spouses: Spouse[]
  children: Child[]
  residences: Residence[]
  crimeRecords: CrimeRecord[]
  sources: SourceRef[]
  lifeEvents: LifeEvent[]
  relatedIds: string[]
  attachments: Array<Pick<Attachment, 'id' | 'url' | 'kind' | 'fileType' | 'caption'>>
}
