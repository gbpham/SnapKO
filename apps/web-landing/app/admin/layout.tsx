'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { BarChart3, Building2, CreditCard, LogOut, ShieldCheck, Users } from 'lucide-react'
import { getSupabaseBrowserClient } from '../../lib/supabaseClient'
import { loginMobile, logoutBackend } from '../../lib/backendClient'
import { logoutEverywhere } from '../../lib/logoutSession'

const navigation = [
  { href: '/admin', label: 'Tổng quan', icon: BarChart3 },
  { href: '/admin/businesses', label: 'Quán', icon: Building2 },
  { href: '/admin/users', label: 'Người dùng', icon: Users },
  { href: '/admin/plans', label: 'Gói cước', icon: CreditCard },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = getSupabaseBrowserClient()
  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    let active = true
    const checkAuth = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        if (active) {
          if (!isLoginPage) router.replace('/admin/login')
          setLoading(false)
        }
        return
      }
      const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', session.user.id).single()
      if (profile?.role !== 'ADMIN') {
        await logoutEverywhere({ logoutBackend, signOutSupabase: () => supabase.auth.signOut() })
        if (active) router.replace('/admin/login')
        return
      }
      try {
        await loginMobile(session.access_token, { fullName: profile.full_name ?? undefined })
      } catch {
        await logoutEverywhere({ logoutBackend, signOutSupabase: () => supabase.auth.signOut() })
        if (active) router.replace('/admin/login')
        return
      }
      if (active) {
        if (isLoginPage) router.replace('/admin')
        setLoading(false)
      }
    }
    void checkAuth()
    return () => { active = false }
  }, [isLoginPage, pathname, router, supabase])

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F3F5F2]">
        <div className="grid justify-items-center gap-3 text-[#26382D]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#DDE5D7] border-t-[#E77825]" />
          <p className="text-sm font-bold">Đang xác thực quyền quản trị…</p>
        </div>
      </div>
    )
  }

  if (isLoginPage) return <>{children}</>

  const signOut = async () => {
    await logoutEverywhere({ logoutBackend, signOutSupabase: () => supabase.auth.signOut() })
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-[#F3F5F2] text-[#132018]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-black/5 bg-[#132018] text-white lg:flex">
        <div className="border-b border-white/10 px-6 py-7">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#E77825] text-white"><ShieldCheck size={22} /></div>
            <div><p className="text-lg font-black">SnapKO</p><p className="text-xs font-semibold text-white/55">Control center</p></div>
          </div>
        </div>
        <nav className="grid gap-1 p-4">
          {navigation.map((item) => {
            const Icon = item.icon
            const selected = item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${selected ? 'bg-white text-[#132018]' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}>
                <Icon size={18} />{item.label}
              </Link>
            )
          })}
        </nav>
        <button onClick={signOut} className="mt-auto flex items-center gap-3 border-t border-white/10 px-8 py-6 text-sm font-bold text-white/60 hover:text-white">
          <LogOut size={18} /> Đăng xuất
        </button>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-black/5 bg-[#F3F5F2]/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#769532]">Vận hành hệ thống</p><p className="font-black">SnapKO Admin</p></div>
            <button onClick={signOut} className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold lg:hidden"><LogOut size={16} /> Thoát</button>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {navigation.map((item) => {
              const selected = item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href)
              return <Link key={item.href} href={item.href} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${selected ? 'bg-[#132018] text-white' : 'bg-white text-slate-600'}`}>{item.label}</Link>
            })}
          </nav>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-10">{children}</main>
      </div>
    </div>
  )
}
