'use client'

import { useCallback, useEffect, useState } from 'react'
import { Building2, Pencil, Power, Search } from 'lucide-react'
import { adminGet, adminPatch, type AdminBusiness, type PageResult } from '../../../lib/adminApi'
import { formatDate } from '../../../lib/adminUi'
import { AdminModal, Field, inputClass } from '../_components/AdminModal'
import { AdminError, AdminLoading, StatusPill } from '../_components/AdminStates'

type BusinessDraft = Pick<AdminBusiness, 'name' | 'tier' | 'inventoryModel'> & { subscriptionExpiresAt: string; operationalState: AdminBusiness['operationalState'] }

export default function AdminBusinessesPage() {
  const [result, setResult] = useState<PageResult<AdminBusiness> | null>(null)
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<AdminBusiness | null>(null)
  const [draft, setDraft] = useState<BusinessDraft | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try { setResult(await adminGet<PageResult<AdminBusiness>>('businesses', { search, tier, status, page, pageSize: 20 })) }
    catch (err) { setError(err instanceof Error ? err.message : 'Lỗi không xác định') }
  }, [page, search, status, tier])
  useEffect(() => { const timer = setTimeout(() => void load(), 250); return () => clearTimeout(timer) }, [load])

  const openEdit = (business: AdminBusiness) => {
    setEditing(business)
    setDraft({
      name: business.name,
      tier: business.tier,
      inventoryModel: business.inventoryModel,
      subscriptionExpiresAt: business.subscriptionExpiresAt ? new Date(business.subscriptionExpiresAt).toISOString().slice(0, 10) : '',
      operationalState: business.operationalState,
    })
  }

  const save = async () => {
    if (!editing || !draft) return
    setSaving(true)
    try {
      await adminPatch(`businesses/${editing.id}`, {
        ...draft,
        subscriptionExpiresAt: draft.subscriptionExpiresAt ? `${draft.subscriptionExpiresAt}T16:59:59.999Z` : null,
      })
      setEditing(null); setDraft(null); await load()
    } catch (err) { setError(err instanceof Error ? err.message : 'Không lưu được quán') }
    finally { setSaving(false) }
  }

  const toggleSuspended = async (business: AdminBusiness) => {
    setSaving(true)
    try {
      await adminPatch(`businesses/${business.id}`, { operationalState: business.status === 'SUSPENDED' ? 'ACTIVE' : 'READ_ONLY_EXPIRED' })
      await load()
    } catch (err) { setError(err instanceof Error ? err.message : 'Không đổi được trạng thái') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeading title="Quản lý quán" description="Theo dõi gói, hạn sử dụng và quy mô dữ liệu của từng business." />
      <div className="grid gap-3 rounded-[22px] border border-black/5 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_180px]">
        <label className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input className={`${inputClass} pl-10`} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Tìm tên quán…" /></label>
        <select className={inputClass} value={tier} onChange={(e) => { setTier(e.target.value); setPage(1) }}><option value="">Tất cả tier</option><option>FREE</option><option>PRO</option><option>CHAIN</option></select>
        <select className={inputClass} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}><option value="">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="EXPIRED">Hết hạn</option><option value="SUSPENDED">Tạm khóa</option></select>
      </div>
      {error && <AdminError message={error} retry={load} />}
      {!result ? <AdminLoading /> : (
        <div className="overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-sm">
          <div className="overflow-x-auto"><table className="min-w-[1100px] w-full text-left text-sm"><thead className="bg-[#132018] text-[11px] uppercase tracking-wider text-white/65"><tr><th className="px-5 py-4">Business</th><th className="px-5 py-4">Owner</th><th className="px-5 py-4">Gói / trạng thái</th><th className="px-5 py-4">Hạn dùng</th><th className="px-5 py-4">Dữ liệu</th><th className="px-5 py-4 text-right">Thao tác</th></tr></thead>
            <tbody className="divide-y divide-[#E9EDE9]">{result.items.map((business) => <tr key={business.id} className="hover:bg-[#F8F9F7]"><td className="px-5 py-4"><p className="font-black">{business.name}</p><p className="mt-1 text-xs text-slate-500">{business.inventoryModel} · tạo {formatDate(business.createdAt)}</p></td><td className="px-5 py-4"><p className="font-bold">{business.owner?.fullName ?? 'Chưa có owner'}</p><p className="text-xs text-slate-500">{business.owner?.phoneNumber ?? '—'}</p></td><td className="px-5 py-4"><div className="flex items-center gap-2"><span className="font-black text-[#E77825]">{business.tier}</span><StatusPill status={business.status} /></div></td><td className="px-5 py-4">{formatDate(business.subscriptionExpiresAt)}</td><td className="px-5 py-4 text-xs text-slate-600"><p>{business._count.profiles} người dùng</p><p>{business._count.ingredients} nguyên liệu · {business._count.recipes} công thức</p></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => openEdit(business)} className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-xs font-bold hover:bg-slate-50"><Pencil size={14} /> Sửa</button><button disabled={saving || business.status === 'EXPIRED'} onClick={() => void toggleSuspended(business)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#132018] px-3 py-2 text-xs font-bold text-white disabled:opacity-35"><Power size={14} /> {business.status === 'SUSPENDED' ? 'Mở khóa' : 'Tạm khóa'}</button></div></td></tr>)}</tbody>
          </table></div>
          {!result.items.length && <div className="grid justify-items-center gap-2 px-6 py-16 text-slate-500"><Building2 size={28} /><p>Không tìm thấy quán phù hợp.</p></div>}
          <Pager page={result.page} total={result.total} pageSize={result.pageSize} onChange={setPage} />
        </div>
      )}
      {editing && draft && <AdminModal title={`Cập nhật ${editing.name}`} onClose={() => { setEditing(null); setDraft(null) }}><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Field label="Tên quán"><input className={inputClass} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field></div><Field label="Tier"><select className={inputClass} value={draft.tier} onChange={(e) => setDraft({ ...draft, tier: e.target.value as BusinessDraft['tier'] })}><option>FREE</option><option>PRO</option><option>CHAIN</option></select></Field><Field label="Mô hình kho"><select className={inputClass} value={draft.inventoryModel} onChange={(e) => setDraft({ ...draft, inventoryModel: e.target.value as BusinessDraft['inventoryModel'] })}><option>SIMPLE</option><option>STANDARD</option><option>CHAIN</option></select></Field><Field label="Ngày hết hạn"><input type="date" className={inputClass} value={draft.subscriptionExpiresAt} onChange={(e) => setDraft({ ...draft, subscriptionExpiresAt: e.target.value })} /></Field><Field label="Trạng thái vận hành"><select className={inputClass} value={draft.operationalState} onChange={(e) => setDraft({ ...draft, operationalState: e.target.value as BusinessDraft['operationalState'] })}><option value="ACTIVE">Hoạt động</option><option value="READ_ONLY_EXPIRED">Tạm khóa / chỉ đọc</option></select></Field></div><div className="mt-6 flex justify-end gap-3"><button className="rounded-xl px-4 py-2.5 text-sm font-bold" onClick={() => setEditing(null)}>Hủy</button><button disabled={saving} onClick={() => void save()} className="rounded-xl bg-[#E77825] px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</button></div></AdminModal>}
    </div>
  )
}

function PageHeading({ title, description }: { title: string; description: string }) { return <div><p className="text-sm font-black uppercase tracking-[0.16em] text-[#769532]">Control center</p><h1 className="mt-1 text-3xl font-black tracking-tight">{title}</h1><p className="mt-2 text-sm text-slate-600">{description}</p></div> }
function Pager({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (page: number) => void }) { const pages = Math.max(1, Math.ceil(total / pageSize)); return <div className="flex items-center justify-between border-t border-[#E9EDE9] px-5 py-4 text-sm"><span className="text-slate-500">{total} kết quả</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-lg border px-3 py-1.5 font-bold disabled:opacity-30">Trước</button><span className="px-2 py-1.5 font-bold">{page}/{pages}</span><button disabled={page >= pages} onClick={() => onChange(page + 1)} className="rounded-lg border px-3 py-1.5 font-bold disabled:opacity-30">Sau</button></div></div> }
