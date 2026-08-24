"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  signOut,
} from "@/lib/authService";
import {
  getAppointments,
  updateAppointmentStatus,
  getBlockedDates,
  toggleBlockDate,
} from "@/lib/appointmentService";
import type { Appointment, AppointmentStatus } from "@/lib/types";

export default function AdminPage() {
  const router = useRouter();
  const [appointments,setAppointments] = useState<Appointment[]>([]);
  const [blockedDates,setBlockedDates] = useState<string[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [filter,setFilter] = useState<AppointmentStatus | "all">("all");
  const [search,setSearch] = useState("");
  const [date,setDate] = useState("");
  const [busy,setBusy] = useState<string | null>(null);
  const [blockDate,setBlockDate] = useState("");

  async function load() {
    setError("");
    const user = await getCurrentUser();
    if (!user) {
      router.replace("/admin/login");
      return;
    }

    const [items, dates] = await Promise.all([
      getAppointments({
        date: date || undefined,
        status: filter === "all" ? undefined : filter,
        search: search || undefined,
      }),
      getBlockedDates(),
    ]);

    setAppointments(items);
    setBlockedDates(dates);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter, date]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return appointments;
    return appointments.filter(a =>
      a.customer_name.toLowerCase().includes(term) ||
      a.phone.toLowerCase().includes(term) ||
      a.service_name.toLowerCase().includes(term)
    );
  }, [appointments, search]);

  async function status(id:string, next:AppointmentStatus) {
    setBusy(id);
    const result = await updateAppointmentStatus(id,next);
    if (!result.success) setError(result.error || "Update failed.");
    await load();
    setBusy(null);
  }

  async function toggleDate() {
    if (!blockDate) return;
    setBusy("date");
    try {
      await toggleBlockDate(blockDate);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update blocked date.");
    }
    setBlockDate("");
    await load();
    setBusy(null);
  }

  async function logout() {
    await signOut();
    router.replace("/admin/login");
  }

  if (loading) return <main className="vc-admin-page"><div className="vc-admin-loading">LOADING ADMIN...</div></main>;

  const pending = appointments.filter(a=>a.status==="pending").length;
  const confirmed = appointments.filter(a=>a.status==="confirmed").length;
  const completed = appointments.filter(a=>a.status==="completed").length;

  return (
    <main className="vc-admin-page">
      <header className="vc-admin-header">
        <div>
          <div className="vc-admin-kicker">VIBE CUT MEN&apos;S SALON</div>
          <h1>ADMIN DASHBOARD</h1>
        </div>
        <button className="vc-admin-logout" onClick={logout}>LOG OUT</button>
      </header>

      {error && <div className="vc-admin-error vc-admin-wide">{error}</div>}

      <section className="vc-admin-stats">
        <Stat title="PENDING" value={pending}/>
        <Stat title="CONFIRMED" value={confirmed}/>
        <Stat title="COMPLETED" value={completed}/>
        <Stat title="TOTAL SHOWN" value={appointments.length}/>
      </section>

      <section className="vc-admin-toolbar">
        <input placeholder="Search customer, phone or service..." value={search} onChange={e=>setSearch(e.target.value)} />
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        <select value={filter} onChange={e=>setFilter(e.target.value as AppointmentStatus|"all")}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={load}>REFRESH</button>
      </section>

      <section className="vc-admin-panel">
        <div className="vc-admin-panel-title">APPOINTMENTS</div>
        {visible.length === 0 ? <div className="vc-admin-empty">No appointments found.</div> :
        <div className="vc-admin-table-wrap"><table className="vc-admin-table">
          <thead><tr><th>Customer</th><th>Service</th><th>Date</th><th>Time</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{visible.map(a=>
            <tr key={a.id}>
              <td><strong>{a.customer_name}</strong><small>{a.email || "—"}</small></td>
              <td>{a.service_name}</td>
              <td>{a.appointment_date}</td>
              <td>{a.appointment_time}</td>
              <td>{a.phone}</td>
              <td><span className={`vc-status vc-status-${a.status}`}>{a.status}</span></td>
              <td className="vc-actions">
                {a.status==="pending" && <>
                  <button disabled={busy===a.id} onClick={()=>status(a.id,"confirmed")}>CONFIRM</button>
                  <button disabled={busy===a.id} onClick={()=>status(a.id,"rejected")}>REJECT</button>
                </>}
                {a.status==="confirmed" && <>
                  <button disabled={busy===a.id} onClick={()=>status(a.id,"completed")}>COMPLETE</button>
                  <button disabled={busy===a.id} onClick={()=>status(a.id,"cancelled")}>CANCEL</button>
                </>}
              </td>
            </tr>
          )}</tbody>
        </table></div>}
      </section>

      <section className="vc-admin-panel vc-admin-blocks">
        <div>
          <div className="vc-admin-panel-title">BLOCK A DATE</div>
          <div className="vc-admin-block-row">
            <input type="date" value={blockDate} onChange={e=>setBlockDate(e.target.value)} />
            <button disabled={!blockDate || busy==="date"} onClick={toggleDate}>
              {blockDate && blockedDates.includes(blockDate) ? "UNBLOCK DATE" : "BLOCK DATE"}
            </button>
          </div>
        </div>
        <div>
          <div className="vc-admin-panel-title">CURRENT BLOCKED DATES</div>
          <div className="vc-admin-chips">
            {blockedDates.length ? blockedDates.map(d=><span key={d}>{d}</span>) : <em>None</em>}
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({title,value}:{title:string;value:number}) {
  return <div className="vc-admin-stat"><span>{title}</span><strong>{value}</strong></div>;
}
