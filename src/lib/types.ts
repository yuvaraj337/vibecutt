/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   VIBE CUT — Core System Types
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rejected";

export interface Appointment {
  id: string;
  service_id: string;
  service_name: string;
  price: number;
  appointment_date: string; // Format: YYYY-MM-DD
  appointment_time: string; // Format: e.g. "10:00 AM"
  customer_name: string;
  phone: string;
  email?: string;
  notes?: string;
  status: AppointmentStatus;
  created_at: string;
}

export interface CreateAppointmentInput {
  service_id: string;
  service_name: string;
  price: number;
  appointment_date: string;
  appointment_time: string;
  customer_name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface DaySchedule {
  open: string;
  close: string;
  isClosed?: boolean;
}

export interface WorkingHoursConfig {
  [dayName: string]: DaySchedule;
}

export interface BlockedSlot {
  date: string;
  time: string;
}

export interface AvailabilityState {
  workingHours: WorkingHoursConfig;
  blockedDates: string[];
  blockedSlots: BlockedSlot[];
}

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
}

export interface AuthSession {
  user: AuthUser | null;
  accessToken?: string;
  expiresAt?: number;
}
