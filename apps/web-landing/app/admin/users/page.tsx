'use client'

import { useCallback, useEffect, useState } from 'react'
import { Pencil, Search, UserRoundX, Users } from 'lucide-react'
import { adminGet, adminPatch, type AdminUser, type PageResult } from '../../../lib/adminApi'
import { formatDate } from '../../../lib/adminUi'
import { AdminModal, Field, inputClass } from '../_components/AdminModal'
import { AdminError, AdminLoading, StatusPill } from '../_components/AdminStates'

export default function AdminUsersPage() {
  const [result, setResult] = useState<PageResult<AdminUser> | null>(null)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [draft, setDraft] = useState<Pick<AdminUser, 'fullName' | 'role' | 'status'> | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try { setResult(await adminGet<PageResult<AdminUser>>('users', { search, role, status, page, pageSize: 20 })) }
    catch (err) { setError(err instanceof Error ? err.message : 'Lỗi không xác định') }
  }, [page, role, search, status])
  useEffect(() => { const timer = setTimeout(() => void load(), 250); return () => clearTimeout(timer) }, [load])

  const openEdit = (user: AdminUser) => { setEditing(user); setDraft({ fullName: user.fullName, role: user.role, status: user.status }) }
  const save = async () => {
    if (!editing || !draft) return
    setSaving(true)
    try { await adminPatch(`users/${editing.id}`, { ...draft, fullName: draft.fullName || 'Người dùng SnapKO' }); setEditing(null); setDraft(null); await load() }
    catch (err) { setError(err instanceof Error ? err.message : 'Không lưu được người dùng') }
    finally { setSaving(false) }
  }

  return <div className="space-y-6">
    <div><p className="text-sm font-black uppercase tracking-[0.16em] text-[#769532]">Control center</p><h1 className="mt-1 text-3xl font-black tracking-tight">Quản lý người dùng</h1><p className="mt-2 text-sm text-slate-600">Xem tài khoản Supabase, phân quyền và vô hiệu hóa truy cập khi cần.</p></div>
    <div className="grid gap-3 rounded-[22px] border border-black/5 bg-white p-4 shadow-sm md:grid-cols-[1fr_190px_190px]"><label className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input className={`${inputClass} pl-10`} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Tìm tên, email, quán…" /></label><select className={inputClass} value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }}><option value="">Tất cả vai trò</option><option>OWNER</option><option>BRANCH_MANAGER</option><option>STAFF</option><option>ADMIN</option></select><select className={inputClass} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}><option value="">Tất cả trạng thái</option><option>ACTIVE</option><option>PENDING</option><option>INACTIVE</option><option>REJECTED</option></select></div>
    {error && <AdminError message={error} retry={load} />}
    {!result ? <AdminLoading /> : <div className="overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-[1050px] w-full text-left text-sm"><thead className="bg-[#132018] text-[11px] uppercase tracking-wider text-white/65"><tr><th className="px-5 py-4">Người dùng</th><th className="px-5 py-4">Quán</th><th className="px-5 py-4">Vai trò</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4">Đăng nhập gần nhất</th><th className="px-5 py-4 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-[#E9EDE9]">{result.items.map((user) => <tr key={user.id} className="hover:bg-[#F8F9F7]"><td className="px-5 py-4"><p className="font-black">{user.fullName ?? 'Chưa đặt tên'}</p><p className="mt-1 text-xs text-slate-500">{user.email ?? user.phoneNumber ?? 'Không có email'}</p></td><td className="px-5 py-4 font-bold">{user.business?.name ?? 'Hệ thống / chưa có quán'}</td><td className="px-5 py-4"><span className="rounded-lg bg-[#EDF1EE] px-2 py-1 font-mono text-xs font-bold">{user.role}</span></td><td className="px-5 py-4"><StatusPill status={user.status} /></td><td className="px-5 py-4 text-slate-500">{formatDate(user.lastSignInAt)}</td><td className="px-5 py-4 text-right"><button onClick={() => openEdit(user)} className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-xs font-bold hover:bg-slate-50"><Pencil size={14} /> Cập nhật</button></td></tr>)}</tbody></table></div>{!result.items.length && <div className="grid justify-items-center gap-2 px-6 py-16 text-slate-500"><Users size={28} /><p>Không tìm thấy người dùng phù hợp.</p></div>}<Pager page={result.page} total={result.total} pageSize={result.pageSize} onChange={setPage} /></div>}
    {editing && draft && <AdminModal title={`Cập nhật ${editing.fullName ?? 'người dùng'}`} onClose={() => { setEditing(null); setDraft(null) }}><div className="rounded-2xl bg-[#F4F6F3] p-4 text-sm"><p className="font-bold">{editing.email ?? 'Không có email'}</p><p className="mt-1 text-slate-500">{editing.business?.name ?? 'Chưa thuộc quán'}</p></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Field label="Tên hiển thị"><input className={inputClass} value={draft.fullName ?? ''} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} /></Field></div><Field label="Vai trò"><select className={inputClass} value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as AdminUser['role'] })}><option>OWNER</option><option>BRANCH_MANAGER</option><option>STAFF</option><option>ADMIN</option></select></Field><Field label="Trạng thái"><select className={inputClass} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as AdminUser['status'] })}><option>ACTIVE</option><option>PENDING</option><option>INACTIVE</option><option>REJECTED</option></select></Field></div>{draft.status !== 'ACTIVE' && <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><UserRoundX className="shrink-0" size={20} /><p>Tài khoản sẽ bị chặn đăng nhập mới và tất cả refresh token backend sẽ bị thu hồi.</p></div>}<div className="mt-6 flex justify-end gap-3"><button className="rounded-xl px-4 py-2.5 text-sm font-bold" onClick={() => setEditing(null)}>Hủy</button><button disabled={saving} onClick={() => void save()} className="rounded-xl bg-[#E77825] px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</button></div></AdminModal>}
  </div>
}

function Pager({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (page: number) => void }) { const pages = Math.max(1, Math.ceil(total / pageSize)); return <div className="flex items-center justify-between border-t border-[#E9EDE9] px-5 py-4 text-sm"><span className="text-slate-500">{total} tài khoản</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-lg border px-3 py-1.5 font-bold disabled:opacity-30">Trước</button><span className="px-2 py-1.5 font-bold">{page}/{pages}</span><button disabled={page >= pages} onClick={() => onChange(page + 1)} className="rounded-lg border px-3 py-1.5 font-bold disabled:opacity-30">Sau</button></div></div> }
