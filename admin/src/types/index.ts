export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export type YearType = 'exact' | 'approx' | 'before' | 'after' | 'unknown'

export type Role = 'superadmin' | 'admin' | 'manager' | 'user' | 'guest'

export interface MenuItem {
  key: string
  path: string
  label: string
  order: number
}

export interface AdminMenuItem extends MenuItem {
  id: string
  roles: Role[]
}

export interface User {
  id: string
  username: string
  email: string
  role: Role
  createdAt: string
}

export interface Spouse {
  name: string
  remark?: string | null
}

export interface Child {
  name: string
  gender?: string | null
  whereabouts?: string | null
  remark?: string | null
}

export interface Residence {
  place: string
  period?: string | null
  remark?: string | null
}

export interface CrimeRecord {
  year: number | null
  title: string
  process?: string | null
  harm?: string | null
  sourceRef?: string | null
}

export interface LifeEvent {
  year: number | null
  event: string
  sourceRef?: string | null
}

export interface Attachment {
  id: string
  url: string
  kind: 'photo' | 'evidence'
  fileType: string
  caption?: string | null
}

export interface SourceRef {
  citation: string
  credibility?: number | null
}

export interface TraitorSnapshot {
  id?: string
  name: string
  courtesyName?: string | null
  pseudonym?: string | null
  birthYear: number | null
  deathYear: number | null
  birthYearType: YearType
  deathYearType: YearType
  nativePlace: string
  aliases: string[]
  identityTags: string[]
  period: string
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

export interface Revision {
  id: string
  traitorId: string | null
  submitterId: string
  submitter?: Pick<User, 'id' | 'username'> | null
  submittedAt: string
  changeSummary: string
  payload: TraitorSnapshot
  status: ReviewStatus
  reviewerId: string | null
  reviewer?: Pick<User, 'id' | 'username'> | null
  reviewedAt: string | null
  reviewResult: 'approved' | 'rejected' | null
  reviewComment: string | null
}

export interface AuthPayload {
  token: string
  user: User
}
