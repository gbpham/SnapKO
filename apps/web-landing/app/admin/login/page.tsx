"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { getSupabaseBrowserClient } from "../../../lib/supabaseClient";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

      if (authError) throw authError;

      router.replace("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Email hoặc mật khẩu không đúng");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#132018] p-4">
      <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-[#769532]/25 blur-3xl" />
      <div className="absolute -bottom-24 -right-20 h-96 w-96 rounded-full bg-[#E77825]/25 blur-3xl" />
      <div className="relative w-full max-w-md space-y-8 rounded-[28px] border border-white/10 bg-white p-8 shadow-2xl sm:p-10">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#E77825] text-white shadow-lg shadow-orange-200"><ShieldCheck size={28} /></div>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-[#769532]">Control center</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight text-[#132018]">SnapKO Admin</h2>
          <p className="mt-2 text-sm text-slate-600">Đăng nhập bằng tài khoản quản trị hệ thống.</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full rounded-xl border border-[#DCE2DD] px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-[#E77825] focus:ring-4 focus:ring-[#E77825]/10 sm:text-sm"
                placeholder="Email quản trị"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full rounded-xl border border-[#DCE2DD] px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-[#E77825] focus:ring-4 focus:ring-[#E77825]/10 sm:text-sm"
                placeholder="Mật khẩu"
              />
            </div>
          </div>

          {error && (
            <div className="text-center text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-[#E77825] px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-100 hover:bg-[#D9691D] focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:opacity-70"
            >
              <LockKeyhole size={17} /> {loading ? "Đang đăng nhập…" : "Đăng nhập quản trị"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
