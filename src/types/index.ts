// src/types/index.ts
// ── Shared TypeScript types for the entire application
//
// !! RULE: Do NOT import or re-export from @prisma/client here.
//    This file is imported by both server AND client code.
//    Prisma types are server-only. Use string literal types instead.
//
// For Prisma types on the SERVER, import directly from @prisma/client
// inside your tRPC router or API route files only.

// ── Re-export client-safe constants & types
export {
  USER_ROLES,
  CASE_STATUSES,
  CASE_PRIORITIES,
  APPOINTMENT_STATUSES,
  TASK_STATUSES,
  TASK_PRIORITIES,
  INVOICE_STATUSES,
  PUBLICATION_STATUSES,
  DOCUMENT_TYPES,
  PRACTICE_AREAS,
  NIGERIAN_STATES,
  type UserRoleType,
  type CaseStatusType,
  type CasePriorityType,
  type AppointmentStatusType,
  type TaskStatusType,
  type TaskPriorityType,
  type InvoiceStatusType,
  type PublicationStatusType,
  type DocumentTypeValue,
  type PracticeAreaType,
  type NigerianStateType,
} from "@/lib/constants";

// ── Auth session user (stored in JWT — what pages receive from useAuth)
export interface SessionUser {
  id: string;
  email: string;
  role: string;          // Plain string — matches UserRoleType at runtime
  firstName: string;
  lastName: string;
  name?: string;
  image?: string | null;
}

// ── Generic API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string[];
  };
}

// ── Pagination meta
export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ── Calendar event (unified hearings + appointments)
export interface CalendarEvent {
  id: string;
  type: "HEARING" | "APPOINTMENT" | "TASK" | "DEADLINE";
  title: string;
  start: Date;
  end: Date;
  status: string;
  color?: string;
  meta: Record<string, unknown>;
}

// ── File upload state
export interface UploadState {
  file: File | null;
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  documentId?: string;
  error?: string;
}

// ── Invoice line item
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

// ── Dashboard stats shapes
export interface AdminDashboardStats {
  totalUsers: number;
  lawyers: number;
  clients: number;
  totalCases: number;
  activeCases: number;
  documents: number;
  upcomingAppointments: number;
  newSubscribers: number;
  pendingConsultations: number;
  casesThisMonth: number;
}

export interface ClientDashboardStats {
  activeCases: number;
  upcomingHearings: number;
  pendingInvoices: number;
  unreadMessages: number;
}

export interface LawyerDashboardStats {
  totalCases: number;
  activeCases: number;
  upcomingHearings: number;
  pendingTasks: number;
  publications: number;
}

// ── Form state helper
export interface FormState<T = Record<string, string>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isSuccess: boolean;
}
