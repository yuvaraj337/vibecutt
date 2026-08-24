"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmail } from "@/lib/authService";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signInWithEmail(email.trim(), password);
    if (!result.success || !result.session?.user) {
      setError(result.error || "Unable to sign in.");
      setLoading(false);
      return;
    }

    // In production, require the signed-in account to exist in admin_users.
    if (isSupabaseConfigured() && supabase) {
      const { data, error: adminError } = await supabase
        .from("admin_users")
        .select("id")
        .eq("user_id", result.session.user.id)
        .maybeSingle();

      if (adminError || !data) {
        await supabase.auth.signOut();
        setError("This account is not authorized as an admin.");
        setLoading(false);
        return;
      }
    }

    router.replace("/admin");
  }

  return (
    <main className="vc-admin-page">
      <div className="vc-admin-auth-card">
        <div className="vc-admin-kicker">VIBE CUT MEN&apos;S SALON</div>
        <h1>ADMIN LOGIN</h1>
        <p>Sign in to manage appointments and salon availability.</p>
        <form onSubmit={submit} className="vc-admin-form">
          <label>Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" required />
          <label>Password</label>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="current-password" required />
          {error && <div className="vc-admin-error">{error}</div>}
          <button disabled={loading} type="submit">{loading ? "SIGNING IN..." : "SIGN IN →"}</button>
        </form>
      </div>
    </main>
  );
}
