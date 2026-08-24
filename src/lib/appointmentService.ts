/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   VIBE CUT — Appointment & Availability Service
   Supabase-backed persistence with development fallback.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import { supabase, isSupabaseConfigured } from "./supabaseClient";
import {
  Appointment,
  AppointmentStatus,
  CreateAppointmentInput,
  WorkingHoursConfig,
  BlockedSlot,
} from "./types";
import { SALON_CONFIG } from "@/data/salonConfig";

const DEV_STORAGE_KEY_APPOINTMENTS = "vibecut_dev_appointments_v1";
const DEV_STORAGE_KEY_BLOCKED_DATES = "vibecut_dev_blocked_dates_v1";
const DEV_STORAGE_KEY_BLOCKED_SLOTS = "vibecut_dev_blocked_slots_v1";
const DEV_STORAGE_KEY_WORKING_HOURS = "vibecut_dev_working_hours_v1";

let memoryAppointments: Appointment[] = [];
let memoryBlockedDates: string[] = [];
let memoryBlockedSlots: BlockedSlot[] = [];
let memoryWorkingHours: WorkingHoursConfig = {
  ...SALON_CONFIG.defaultWorkingHours,
};
export async function getBookedTimes(
  appointmentDate: string
): Promise<string[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return memoryAppointments
      .filter(
        (appointment) =>
          appointment.appointment_date === appointmentDate &&
          appointment.status !== "cancelled"
      )
      .map((appointment) => appointment.start_time);
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("start_time")
    .eq("appointment_date", appointmentDate)
    .neq("status", "cancelled");

  if (error) {
    console.error("Failed to fetch booked times:", error);
    return [];
  }

  return (data ?? []).map((appointment) => appointment.start_time);
}
const getDevStorage = <T>(key: string, defaultVal: T): T => {
  if (typeof window === "undefined") return defaultVal;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const setDevStorage = <T>(key: string, val: T): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // Ignore local-storage failures.
  }
};

/** Convert UI times such as "2:30 PM" or "14:30" to PostgreSQL HH:MM:SS. */
function toDbTime(value: string): string {
  const raw = value.trim().toUpperCase();
  const ampm = raw.match(/\s*(AM|PM)$/);
  let clock = raw.replace(/\s*(AM|PM)$/, "").trim();

  if (ampm) {
    const parts = clock.split(":");
    let hour = Number(parts[0]);
    const minute = Number(parts[1] ?? 0);
    if (ampm[1] === "AM" && hour === 12) hour = 0;
    if (ampm[1] === "PM" && hour !== 12) hour += 12;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
      2,
      "0"
    )}:00`;
  }

  const [hour = "0", minute = "0"] = clock.split(":");
  return `${String(Number(hour)).padStart(2, "0")}:${String(
    Number(minute)
  ).padStart(2, "0")}:00`;
}

/** Convert PostgreSQL time to the format used by the VIBE CUT UI. */
function fromDbTime(value: string): string {
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;
  const hour24 = Number(match[1]);
  const minute = match[2];
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${minute} ${suffix}`;
}

function mapAppointment(row: Record<string, unknown>): Appointment {
  return {
    id: String(row.id),
    service_id: String(row.service_id),
    service_name: String(row.service_name),
    price: Number(row.price),
    appointment_date: String(row.appointment_date),
    appointment_time: fromDbTime(String(row.appointment_time)),
    customer_name: String(row.customer_name),
    phone: String(row.phone),
    email: row.email ? String(row.email) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    status: row.status as AppointmentStatus,
    created_at: String(row.created_at),
  };
}

/* ── Appointments ─────────────────────────────── */

export async function getAppointments(filter?: {
  date?: string;
  status?: AppointmentStatus;
  search?: string;
}): Promise<Appointment[]> {
  if (isSupabaseConfigured() && supabase) {
    let query = supabase
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (filter?.date) query = query.eq("appointment_date", filter.date);
    if (filter?.status) query = query.eq("status", filter.status);

    if (filter?.search) {
      const term = filter.search.replace(/[%_,]/g, "");
      query = query.or(
        `customer_name.ilike.%${term}%,phone.ilike.%${term}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error("[AppointmentService] Supabase error:", error.message);
      return [];
    }

    return (data ?? []).map((row) =>
      mapAppointment(row as Record<string, unknown>)
    );
  }

  let items = getDevStorage<Appointment[]>(
    DEV_STORAGE_KEY_APPOINTMENTS,
    memoryAppointments
  );

  if (filter?.date) {
    items = items.filter((a) => a.appointment_date === filter.date);
  }
  if (filter?.status) {
    items = items.filter((a) => a.status === filter.status);
  }
  if (filter?.search) {
    const term = filter.search.toLowerCase();
    items = items.filter(
      (a) =>
        a.customer_name.toLowerCase().includes(term) ||
        a.phone.toLowerCase().includes(term)
    );
  }

  return [...items].sort((a, b) => {
    const dateComp = a.appointment_date.localeCompare(b.appointment_date);
    return dateComp !== 0
      ? dateComp
      : a.appointment_time.localeCompare(b.appointment_time);
  });
}

export async function getAppointmentById(
  id: string
): Promise<Appointment | null> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return mapAppointment(data as Record<string, unknown>);
  }

  const items = getDevStorage<Appointment[]>(
    DEV_STORAGE_KEY_APPOINTMENTS,
    memoryAppointments
  );
  return items.find((a) => a.id === id) || null;
}

/* ── Availability ──────────────────────────────── */

export async function getBlockedDates(): Promise<string[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from("blocked_dates")
      .select("blocked_date");

    if (error || !data) {
      console.error("[AppointmentService] Blocked dates:", error?.message);
      return [];
    }

    return data.map((row) => String(row.blocked_date));
  }

  return getDevStorage<string[]>(
    DEV_STORAGE_KEY_BLOCKED_DATES,
    memoryBlockedDates
  );
}

export async function getBlockedSlots(date?: string): Promise<BlockedSlot[]> {
  if (isSupabaseConfigured() && supabase) {
    let query = supabase
      .from("blocked_slots")
      .select("blocked_date, blocked_time");

    if (date) query = query.eq("blocked_date", date);

    const { data, error } = await query;
    if (error || !data) {
      console.error("[AppointmentService] Blocked slots:", error?.message);
      return [];
    }

    return data.map((row) => ({
      date: String(row.blocked_date),
      time: fromDbTime(String(row.blocked_time)),
    }));
  }

  const allSlots = getDevStorage<BlockedSlot[]>(
    DEV_STORAGE_KEY_BLOCKED_SLOTS,
    memoryBlockedSlots
  );
  return date ? allSlots.filter((s) => s.date === date) : allSlots;
}

export async function isSlotAvailable(
  date: string,
  time: string
): Promise<boolean> {
  if ((await getBlockedDates()).includes(date)) return false;

  const normalizedTime = fromDbTime(toDbTime(time));
  const blockedSlots = await getBlockedSlots(date);
  if (
    blockedSlots.some(
      (slot) => slot.date === date && fromDbTime(toDbTime(slot.time)) === normalizedTime
    )
  ) {
    return false;
  }

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from("appointments")
      .select("id")
      .eq("appointment_date", date)
      .eq("appointment_time", toDbTime(time))
      .in("status", ["pending", "confirmed"])
      .limit(1);

    if (error) {
      console.error(
        "[AppointmentService] Availability check error:",
        error.message
      );
      return false;
    }

    return !data || data.length === 0;
  }

  const items = getDevStorage<Appointment[]>(
    DEV_STORAGE_KEY_APPOINTMENTS,
    memoryAppointments
  );

  return !items.some(
    (a) =>
      a.appointment_date === date &&
      fromDbTime(toDbTime(a.appointment_time)) === normalizedTime &&
      (a.status === "pending" || a.status === "confirmed")
  );
}

/* ── Create appointment ───────────────────────── */

export async function createAppointment(
  input: CreateAppointmentInput
): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  if (
    !(await isSlotAvailable(input.appointment_date, input.appointment_time))
  ) {
    return {
      success: false,
      error: "This time slot is no longer available. Please choose another time.",
    };
  }

  if (isSupabaseConfigured() && supabase) {
    // The website uses stable local service IDs; Supabase uses UUID service IDs.
    // Resolve the service by its displayed name before inserting the appointment.
    const { data: serviceRow, error: serviceError } = await supabase
      .from("services")
      .select("id, name, price")
      .eq("name", input.service_name)
      .eq("is_active", true)
      .maybeSingle();

    if (serviceError || !serviceRow) {
      return {
        success: false,
        error: "The selected service could not be found in Supabase.",
      };
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        service_id: serviceRow.id,
        service_name: input.service_name,
        price: Number(serviceRow.price ?? input.price),
        appointment_date: input.appointment_date,
        appointment_time: toDbTime(input.appointment_time),
        customer_name: input.customer_name.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || null,
        notes: input.notes?.trim() || null,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          error: "This time slot is no longer available. Please choose another time.",
        };
      }

      console.error("[AppointmentService] Create error:", error.message);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      appointment: mapAppointment(data as Record<string, unknown>),
    };
  }

  const newAppointment: Appointment = {
    id: `apt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    service_id: input.service_id,
    service_name: input.service_name,
    price: input.price,
    appointment_date: input.appointment_date,
    appointment_time: input.appointment_time,
    customer_name: input.customer_name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  const current = getDevStorage<Appointment[]>(
    DEV_STORAGE_KEY_APPOINTMENTS,
    memoryAppointments
  );
  current.push(newAppointment);
  memoryAppointments = current;
  setDevStorage(DEV_STORAGE_KEY_APPOINTMENTS, current);

  return { success: true, appointment: newAppointment };
}

/* ── Admin operations ─────────────────────────── */

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: error?.message || "Appointment not found." };
    }

    return {
      success: true,
      appointment: mapAppointment(data as Record<string, unknown>),
    };
  }

  const current = getDevStorage<Appointment[]>(
    DEV_STORAGE_KEY_APPOINTMENTS,
    memoryAppointments
  );
  const targetIndex = current.findIndex((a) => a.id === id);

  if (targetIndex === -1) {
    return { success: false, error: "Appointment not found." };
  }

  current[targetIndex].status = status;
  memoryAppointments = current;
  setDevStorage(DEV_STORAGE_KEY_APPOINTMENTS, current);

  return { success: true, appointment: current[targetIndex] };
}

export async function deleteAppointment(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  const current = getDevStorage<Appointment[]>(
    DEV_STORAGE_KEY_APPOINTMENTS,
    memoryAppointments
  );
  const filtered = current.filter((a) => a.id !== id);
  memoryAppointments = filtered;
  setDevStorage(DEV_STORAGE_KEY_APPOINTMENTS, filtered);
  return { success: true };
}

/* ── Availability administration ──────────────── */

export async function toggleBlockDate(
  date: string
): Promise<{ blocked: boolean }> {
  const current = await getBlockedDates();
  const exists = current.includes(date);

  if (isSupabaseConfigured() && supabase) {
    if (exists) {
      const { error } = await supabase
        .from("blocked_dates")
        .delete()
        .eq("blocked_date", date);
      return { blocked: !error && false };
    }

    const { error } = await supabase
      .from("blocked_dates")
      .insert({ blocked_date: date });

    return { blocked: !error };
  }

  const updated = exists
    ? current.filter((d) => d !== date)
    : [...current, date];

  memoryBlockedDates = updated;
  setDevStorage(DEV_STORAGE_KEY_BLOCKED_DATES, updated);
  return { blocked: !exists };
}

export async function toggleBlockSlot(
  date: string,
  time: string
): Promise<{ blocked: boolean }> {
  const current = await getBlockedSlots(date);
  const exists = current.some(
    (slot) =>
      slot.date === date &&
      fromDbTime(toDbTime(slot.time)) === fromDbTime(toDbTime(time))
  );

  if (isSupabaseConfigured() && supabase) {
    if (exists) {
      const { error } = await supabase
        .from("blocked_slots")
        .delete()
        .eq("blocked_date", date)
        .eq("blocked_time", toDbTime(time));
      return { blocked: !error && false };
    }

    const { error } = await supabase
      .from("blocked_slots")
      .insert({
        blocked_date: date,
        blocked_time: toDbTime(time),
      });

    return { blocked: !error };
  }

  const updated = exists
    ? current.filter(
        (slot) =>
          !(
            slot.date === date &&
            fromDbTime(toDbTime(slot.time)) === fromDbTime(toDbTime(time))
          )
      )
    : [...current, { date, time }];

  memoryBlockedSlots = updated;
  setDevStorage(DEV_STORAGE_KEY_BLOCKED_SLOTS, updated);
  return { blocked: !exists };
}

/* ── Working hours ────────────────────────────── */

export async function getWorkingHours(): Promise<WorkingHoursConfig> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from("business_hours")
      .select("weekday, is_open, start_time, end_time")
      .order("weekday", { ascending: true });

    if (!error && data?.length) {
      const names = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      return Object.fromEntries(
        data.map((row) => [
          names[row.weekday],
          {
            open: row.start_time ? fromDbTime(String(row.start_time)) : "Closed",
            close: row.end_time ? fromDbTime(String(row.end_time)) : "Closed",
            isClosed: !row.is_open,
          },
        ])
      );
    }
  }

  return getDevStorage<WorkingHoursConfig>(
    DEV_STORAGE_KEY_WORKING_HOURS,
    memoryWorkingHours
  );
}

export async function updateWorkingHours(
  hours: WorkingHoursConfig
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured() && supabase) {
    const names = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    for (let weekday = 0; weekday <= 6; weekday += 1) {
      const day = hours[names[weekday]];
      if (!day) continue;

      const { error } = await supabase
        .from("business_hours")
        .update({
          is_open: !day.isClosed,
          start_time: day.isClosed ? null : toDbTime(day.open),
          end_time: day.isClosed ? null : toDbTime(day.close),
        })
        .eq("weekday", weekday);

      if (error) return { success: false, error: error.message };
    }

    return { success: true };
  }

  memoryWorkingHours = hours;
  setDevStorage(DEV_STORAGE_KEY_WORKING_HOURS, hours);
  return { success: true };
}
