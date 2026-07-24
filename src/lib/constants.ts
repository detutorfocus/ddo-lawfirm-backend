// src/lib/constants.ts
// ── Shared, safe-everywhere string constants — plain literals only.
// NEVER import @prisma/client here — this file has no Node.js/Prisma
// dependency, which lets it be imported from BOTH client components
// (browser) AND server-side files (tRPC routers, trpc.ts, API routes).
// SQLite's Prisma connector doesn't support native `enum` types, so the
// database stores these as plain strings — these constants are the
// single source of truth for valid values on both sides of the app.

// ── User Roles
// Expanded from 3 to 9 roles per the full practice-management spec.
// SUPER_ADMIN and ADMIN are distinct: SUPER_ADMIN can manage Admins,
// ADMIN cannot. Both can manage all other staff roles below them.
export const USER_ROLES = {
  SUPER_ADMIN:       "SUPER_ADMIN",
  ADMIN:             "ADMIN",
  MANAGING_PARTNER:  "MANAGING_PARTNER",
  LAWYER:            "LAWYER",
  LEGAL_ASSISTANT:   "LEGAL_ASSISTANT",
  SECRETARY:         "SECRETARY",
  RECEPTIONIST:      "RECEPTIONIST",
  FINANCE_OFFICER:   "FINANCE_OFFICER",
  CLIENT:            "CLIENT",
} as const;

export type UserRoleType = typeof USER_ROLES[keyof typeof USER_ROLES];

// Roles that count as "staff" (i.e. NOT self-registerable — must be
// created by an Admin/Super Admin). Used to validate admin-only
// staff-creation endpoints and to render role pickers in the UI.
export const STAFF_ROLES = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.ADMIN,
  USER_ROLES.MANAGING_PARTNER,
  USER_ROLES.LAWYER,
  USER_ROLES.LEGAL_ASSISTANT,
  USER_ROLES.SECRETARY,
  USER_ROLES.RECEPTIONIST,
  USER_ROLES.FINANCE_OFFICER,
] as const;

// Roles with admin-level dashboard access (broader than just
// USER_ROLES.ADMIN/SUPER_ADMIN — Managing Partners also need admin
// visibility per the spec's role list, though with narrower write
// permissions enforced at the router/procedure level, not here).
export const ADMIN_LEVEL_ROLES = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.ADMIN,
] as const;

// ── Client Status Lifecycle
// PENDING: consultation submitted, not yet accepted as a formal client.
// ACTIVE: has at least one active legal matter.
// INACTIVE: no active matters, but remains a client on file.
// ARCHIVED: former client — retained for records, not shown in active lists.
export const CLIENT_STATUSES = {
  PENDING:  "PENDING",
  ACTIVE:   "ACTIVE",
  INACTIVE: "INACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;

export type ClientStatusType = typeof CLIENT_STATUSES[keyof typeof CLIENT_STATUSES];

// ── Audit Log Actions
export const AUDIT_ACTIONS = {
  CREATE:             "CREATE",
  READ:               "READ",
  UPDATE:             "UPDATE",
  DELETE:             "DELETE",
  LOGIN:               "LOGIN",
  LOGOUT:              "LOGOUT",
  FILE_UPLOAD:         "FILE_UPLOAD",
  FILE_DOWNLOAD:       "FILE_DOWNLOAD",
  PERMISSION_CHANGE:   "PERMISSION_CHANGE",
} as const;

export type AuditActionType = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];

// ── Case Statuses
export const CASE_STATUSES = {
  PENDING:            "PENDING",
  ACTIVE:             "ACTIVE",
  HEARING_SCHEDULED:  "HEARING_SCHEDULED",
  JUDGMENT_DELIVERED: "JUDGMENT_DELIVERED",
  CLOSED:             "CLOSED",
  ARCHIVED:           "ARCHIVED",
} as const;

export type CaseStatusType = typeof CASE_STATUSES[keyof typeof CASE_STATUSES];

// ── Case Priorities
export const CASE_PRIORITIES = {
  LOW:    "LOW",
  MEDIUM: "MEDIUM",
  HIGH:   "HIGH",
  URGENT: "URGENT",
} as const;

export type CasePriorityType = typeof CASE_PRIORITIES[keyof typeof CASE_PRIORITIES];

// ── Appointment Statuses
export const APPOINTMENT_STATUSES = {
  PENDING:     "PENDING",
  CONFIRMED:   "CONFIRMED",
  COMPLETED:   "COMPLETED",
  CANCELLED:   "CANCELLED",
  RESCHEDULED: "RESCHEDULED",
} as const;

export type AppointmentStatusType = typeof APPOINTMENT_STATUSES[keyof typeof APPOINTMENT_STATUSES];

// ── Task Statuses
export const TASK_STATUSES = {
  TODO:        "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED:   "COMPLETED",
  OVERDUE:     "OVERDUE",
} as const;

export type TaskStatusType = typeof TASK_STATUSES[keyof typeof TASK_STATUSES];

// ── Task Priorities
export const TASK_PRIORITIES = {
  LOW:    "LOW",
  MEDIUM: "MEDIUM",
  HIGH:   "HIGH",
  URGENT: "URGENT",
} as const;

export type TaskPriorityType = typeof TASK_PRIORITIES[keyof typeof TASK_PRIORITIES];

// ── Invoice Statuses
export const INVOICE_STATUSES = {
  DRAFT:     "DRAFT",
  SENT:      "SENT",
  PAID:      "PAID",
  OVERDUE:   "OVERDUE",
  CANCELLED: "CANCELLED",
} as const;

export type InvoiceStatusType = typeof INVOICE_STATUSES[keyof typeof INVOICE_STATUSES];

// ── Publication Statuses
export const PUBLICATION_STATUSES = {
  DRAFT:     "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED:  "ARCHIVED",
} as const;

export type PublicationStatusType = typeof PUBLICATION_STATUSES[keyof typeof PUBLICATION_STATUSES];

// ── Document Types
export const DOCUMENT_TYPES = {
  COURT_FILING:  "COURT_FILING",
  AFFIDAVIT:     "AFFIDAVIT",
  CONTRACT:      "CONTRACT",
  EVIDENCE:      "EVIDENCE",
  JUDGMENT:      "JUDGMENT",
  LEGAL_OPINION: "LEGAL_OPINION",
  INVOICE:       "INVOICE",
  CORRESPONDENCE:"CORRESPONDENCE",
  OTHER:         "OTHER",
} as const;

export type DocumentTypeValue = typeof DOCUMENT_TYPES[keyof typeof DOCUMENT_TYPES];

// ── Practice Areas (client-safe list)
export const PRACTICE_AREAS = [
  "Corporate Law",
  "Commercial Litigation",
  "Criminal Law",
  "Property Law",
  "Family Law",
  "Labour Law",
  "Tax Law",
  "Constitutional Law",
  "Arbitration",
  "Alternative Dispute Resolution",
  "Intellectual Property",
  "Energy & Oil and Gas Law",
  "International Law",
  "Banking & Finance",
  "Immigration Law",
  "Environmental Law",
] as const;

export type PracticeAreaType = typeof PRACTICE_AREAS[number];

// ── Nigerian States
export const NIGERIAN_STATES = [
  "FCT - Abuja", "Lagos", "Rivers", "Kano", "Ogun", "Delta",
  "Anambra", "Imo", "Enugu", "Oyo", "Osun", "Ekiti", "Ondo",
  "Edo", "Akwa Ibom", "Cross River", "Bayelsa", "Benue", "Kogi",
  "Kwara", "Kaduna", "Zamfara", "Kebbi", "Sokoto", "Niger",
  "Nasarawa", "Plateau", "Gombe", "Adamawa", "Borno", "Yobe",
  "Taraba", "Jigawa", "Katsina", "Abia", "Ebonyi", "Bauchi",
] as const;

export type NigerianStateType = typeof NIGERIAN_STATES[number];
