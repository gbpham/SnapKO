'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Eye, EyeOff, Pencil, Plus, RefreshCw } from 'lucide-react'
import { AdminModal, Field, inputClass } from '../_components/AdminModal'
import { AdminError, AdminLoading, StatusPill } from '../_components/AdminStates'
import { adminGet, adminPatch, adminPost, type AdminPlan } from '../../../lib/adminApi'
import { formatVnd } from '../../../lib/adminUi'

type PlanForm = {
  code: string
  name: string
  description: string
  price: number
  durationDays: number
  targetTier: AdminPlan['targetTier']
  monthlyScansQuota: number
  adRewardScans: number
  maxAdRewardsPerDay: number
  isActive: boolean
}

const emptyPlan: PlanForm = {
  code: '',
  name: '',
  description: '',
  price: 199000,
  durationDays: 30,
  targetTier: 'PRO',
  monthlyScansQuota: 100,
  adRewardScans: 6,
  maxAdRewardsPerDay: 20,
  isActive: true,
}

function toForm(plan: AdminPlan): PlanForm {
  return {
    code: plan.code,
    name: plan.name,
    description: plan.description ?? '',
    price: Number(plan.price),
    durationDays: plan.durationDays,
    targetTier: plan.targetTier,
    monthlyScansQuota: plan.monthlyScansQuota,
    adRewardScans: plan.adRewardScans,
    maxAdRewardsPerDay: plan.maxAdRewardsPerDay,
    isActive: plan.isActive,
  }
}

export default function PlansManager() {
  const [plans, setPlans] = useState<AdminPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<AdminPlan | null | 'new'>(null)
  const [form, setForm] = useState<PlanForm>(emptyPlan)
  const [saving, setSaving] = useState(false)

  const loadPlans = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setPlans(await adminGet<AdminPlan[]>('plans'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPlans()
  }, [loadPlans])

  const openNew = () => {
    setForm(emptyPlan)
    setEditing('new')
  }

  const openEdit = (plan: AdminPlan) => {
    setForm(toForm(plan))
    setEditing(plan)
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.code.trim() || !form.name.trim()) return
    setSaving(true)
    try {
      if (editing === 'new') {
        await adminPost<AdminPlan>('plans', form)
      } else if (editing) {
        await adminPatch<AdminPlan>(`plans/${editing.id}`, {
          name: form.name,
          description: form.description,
          price: form.price,
          durationDays: form.durationDays,
          targetTier: form.targetTier,
          monthlyScansQuota: form.monthlyScansQuota,
          adRewardScans: form.adRewardScans,
          maxAdRewardsPerDay: form.maxAdRewardsPerDay,
          isActive: form.isActive,
        })
      }
      setEditing(null)
      await loadPlans()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu gói cước.')
    } finally {
      setSaving(false)
    }
  }

  const toggleVisibility = async (plan: AdminPlan) => {
    try {
      const updated = await adminPatch<AdminPlan>(`plans/${plan.id}`, { isActive: !plan.isActive })
      setPlans((current) => current.map((item) => (item.id === plan.id ? updated : item)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái gói.')
    }
  }

  if (loading) return <AdminLoading />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#E77825]">Cấu hình thương mại</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#132018]">Gói cước</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Sửa quyền lợi, giá bán và ẩn các gói cũ. Gói bị ẩn vẫn giữ nguyên lịch sử thanh toán.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void loadPlans()} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE2DD] bg-white px-4 py-2.5 text-sm font-bold text-[#33443A] hover:bg-slate-50">
            <RefreshCw size={16} /> Làm mới
          </button>
          <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-[#E77825] px-4 py-2.5 text-sm font-black text-white shadow-sm hover:bg-[#D9691D]">
            <Plus size={17} /> Thêm gói
          </button>
        </div>
      </div>

      {error && <AdminError message={error} retry={loadPlans} />}

      <div className="overflow-hidden rounded-[24px] border border-[#DEE4DF] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1050px] w-full text-left text-sm">
            <thead className="bg-[#F3F5F2] text-[11px] font-black uppercase tracking-wider text-[#607067]">
              <tr>
                <th className="px-5 py-4">Gói cước</th>
                <th className="px-5 py-4">Giá / thời hạn</th>
                <th className="px-5 py-4">Tier</th>
                <th className="px-5 py-4">Scan / tháng</th>
                <th className="px-5 py-4">Thưởng quảng cáo</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECE9]">
              {plans.map((plan) => (
                <tr key={plan.id} className={!plan.isActive ? 'bg-slate-50/70 text-slate-500' : 'hover:bg-[#FBFCFA]'}>
                  <td className="px-5 py-4">
                    <p className="font-black text-[#132018]">{plan.name}</p>
                    <p className="mt-1 font-mono text-xs text-slate-500">{plan.code}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-black text-[#132018]">{formatVnd(Number(plan.price))}</p>
                    <p className="mt-1 text-xs text-slate-500">{plan.durationDays} ngày</p>
                  </td>
                  <td className="px-5 py-4 font-bold">{plan.targetTier}</td>
                  <td className="px-5 py-4 font-bold">{plan.monthlyScansQuota}</td>
                  <td className="px-5 py-4">
                    <p className="font-bold">+{plan.adRewardScans} lượt</p>
                    <p className="mt-1 text-xs text-slate-500">Tối đa {plan.maxAdRewardsPerDay === -1 ? 'không giới hạn' : `${plan.maxAdRewardsPerDay}/ngày`}</p>
                  </td>
                  <td className="px-5 py-4"><StatusPill status={plan.isActive ? 'ACTIVE' : 'HIDDEN'} /></td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(plan)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE2DD] px-3 py-2 text-xs font-black text-[#33443A] hover:bg-slate-50">
                        <Pencil size={14} /> Sửa
                      </button>
                      <button onClick={() => void toggleVisibility(plan)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE2DD] px-3 py-2 text-xs font-black text-[#33443A] hover:bg-slate-50">
                        {plan.isActive ? <EyeOff size={14} /> : <Eye size={14} />} {plan.isActive ? 'Ẩn' : 'Hiện'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {plans.length === 0 && <div className="p-12 text-center text-sm font-semibold text-slate-500">Chưa có gói cước nào.</div>}
      </div>

      {editing && (
        <AdminModal title={editing === 'new' ? 'Thêm gói cước' : `Sửa ${editing.name}`} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mã gói">
                <input required disabled={editing !== 'new'} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase().replace(/\s+/g, '_') })} className={inputClass} placeholder="PRO_MONTHLY" />
              </Field>
              <Field label="Tên hiển thị">
                <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} />
              </Field>
            </div>
            <Field label="Mô tả">
              <textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={inputClass} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField label="Giá (VND)" value={form.price} onChange={(price) => setForm({ ...form, price })} />
              <NumberField label="Thời hạn (ngày)" value={form.durationDays} onChange={(durationDays) => setForm({ ...form, durationDays })} />
              <Field label="Tier áp dụng">
                <select value={form.targetTier} onChange={(event) => setForm({ ...form, targetTier: event.target.value as PlanForm['targetTier'] })} className={inputClass}>
                  <option value="FREE">FREE</option><option value="PRO">PRO</option><option value="CHAIN">CHAIN</option>
                </select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField label="Scan / tháng" value={form.monthlyScansQuota} onChange={(monthlyScansQuota) => setForm({ ...form, monthlyScansQuota })} />
              <NumberField label="Scan thưởng" value={form.adRewardScans} onChange={(adRewardScans) => setForm({ ...form, adRewardScans })} />
              <NumberField label="Quảng cáo / ngày" min={-1} value={form.maxAdRewardsPerDay} onChange={(maxAdRewardsPerDay) => setForm({ ...form, maxAdRewardsPerDay })} />
            </div>
            <label className="flex items-center gap-3 rounded-xl bg-[#F3F5F2] p-4 text-sm font-bold text-[#33443A]">
              <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} className="h-4 w-4 accent-[#E77825]" />
              Hiển thị gói trên trang bán hàng
            </label>
            <div className="flex justify-end gap-3 border-t border-[#E8ECE9] pt-5">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-[#DCE2DD] px-4 py-2.5 text-sm font-bold">Hủy</button>
              <button disabled={saving} type="submit" className="rounded-xl bg-[#E77825] px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  )
}

function NumberField({ label, value, min = 0, onChange }: { label: string; value: number; min?: number; onChange: (value: number) => void }) {
  return (
    <Field label={label}>
      <input required type="number" min={min} value={value} onChange={(event) => onChange(Number(event.target.value))} className={inputClass} />
    </Field>
  )
}
