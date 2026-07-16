'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Building2, CreditCard, Store, Users } from 'lucide-react'
import { adminGet, type AdminOverview } from '../../lib/adminApi'
import { formatDate, formatVnd, revenueBarHeight } from '../../lib/adminUi'
import { AdminError, AdminLoading } from './_components/AdminStates'

export default function AdminDashboard() {
  const [data, setData] = useState<AdminOverview | null>(null)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setError('')
    try { setData(await adminGet<AdminOverview>('overview')) }
    catch (err) { setError(err instanceof Error ? err.message : 'Lỗi không xác định') }
  }, [])

  useEffect(() => { void load() }, [load])
  const maxRevenue = useMemo(() => Math.max(0, ...(data?.monthlyRevenue.map((item) => item.revenue) ?? [])), [data])

  if (error && !data) return <AdminError message={error} retry={load} />
  if (!data) return <AdminLoading />
  const { summary } = data
  const trendPositive = summary.revenueChangePercent >= 0

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#E77825]">Tổng quan kinh doanh</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Nhịp vận hành SnapKO</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Doanh thu đã hoàn tất, thuê bao đang hoạt động và sức khỏe hệ thống trong một màn hình.</p>
        </div>
        <div className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-black ${trendPositive ? 'bg-[#E7F2D7] text-[#557718]' : 'bg-red-100 text-red-700'}`}>
          {trendPositive ? <ArrowUpRight size={17} /> : <ArrowDownRight size={17} />}
          {Math.abs(summary.revenueChangePercent)}% so với tháng trước
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard eyebrow="Doanh thu toàn thời gian" value={formatVnd(summary.totalRevenue)} detail={`Tháng này ${formatVnd(summary.revenueThisMonth)}`} icon={<CreditCard size={20} />} tone="orange" />
        <MetricCard eyebrow="Thuê bao hoạt động" value={`${summary.activePro} Pro`} detail={`${summary.activeChain} Chain`} icon={<Store size={20} />} tone="green" />
        <MetricCard eyebrow="Quán trên hệ thống" value={String(summary.totalBusinesses)} detail="Tất cả business đã đăng ký" icon={<Building2 size={20} />} />
        <MetricCard eyebrow="Người dùng" value={String(summary.totalUsers)} detail="Owner, quản lý và nhân viên" icon={<Users size={20} />} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="overflow-hidden rounded-[28px] border border-black/5 bg-[#132018] p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#A8C66C]">Dòng tiền 6 tháng</p><h2 className="mt-1 text-2xl font-black">Doanh thu theo kỳ</h2></div>
            <p className="text-sm text-white/55">Tính từ các subscription đã hoàn tất</p>
          </div>
          <div className="mt-8 grid h-64 grid-cols-6 items-end gap-2 sm:gap-4">
            {data.monthlyRevenue.map((item) => {
              const height = revenueBarHeight(item.revenue, maxRevenue)
              return (
                <div key={item.key} className="grid h-full grid-rows-[1fr_auto] gap-3">
                  <div className="flex items-end justify-center border-b border-dashed border-white/15">
                    <div title={`${item.label}: ${formatVnd(item.revenue)}`} className="group relative w-full max-w-14 rounded-t-xl bg-gradient-to-t from-[#E77825] to-[#F5B36F] transition-all hover:brightness-110" style={{ height: `${Math.max(item.revenue ? 5 : 0, height)}%` }}>
                      <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-[10px] font-bold group-hover:block">{formatVnd(item.revenue)}</span>
                    </div>
                  </div>
                  <p className="text-center text-[10px] font-bold text-white/55 sm:text-xs">{item.label}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#769532]">So sánh tháng</p>
          <h2 className="mt-1 text-2xl font-black">Tháng này / tháng trước</h2>
          <div className="mt-8 space-y-6">
            <RevenueLine label="Tháng này" value={summary.revenueThisMonth} maximum={Math.max(summary.revenueThisMonth, summary.revenueLastMonth)} color="bg-[#E77825]" />
            <RevenueLine label="Tháng trước" value={summary.revenueLastMonth} maximum={Math.max(summary.revenueThisMonth, summary.revenueLastMonth)} color="bg-[#769532]" />
          </div>
          <div className="mt-8 rounded-2xl bg-[#F3F5F2] p-4 text-sm text-slate-600">
            <strong className="text-[#132018]">{formatVnd(summary.revenueThisMonth - summary.revenueLastMonth)}</strong> chênh lệch so với kỳ trước.
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-sm">
        <div className="border-b border-[#E7EBE7] px-6 py-5"><h2 className="text-xl font-black">Thanh toán gần đây</h2><p className="mt-1 text-sm text-slate-500">PayOS và kích hoạt thủ công đã hoàn tất</p></div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F7F8F6] text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-3">Quán</th><th className="px-6 py-3">Gói</th><th className="px-6 py-3">Nguồn</th><th className="px-6 py-3">Ngày</th><th className="px-6 py-3 text-right">Số tiền</th></tr></thead>
            <tbody className="divide-y divide-[#EDF0ED]">
              {data.recentPayments.map((item) => <tr key={item.id}><td className="px-6 py-4 font-bold">{item.businessName}</td><td className="px-6 py-4 font-mono text-xs text-slate-600">{item.planCode}</td><td className="px-6 py-4">{item.paymentGateway}</td><td className="px-6 py-4 text-slate-500">{formatDate(item.occurredAt)}</td><td className="px-6 py-4 text-right font-black text-[#E77825]">{formatVnd(item.amountPaid)}</td></tr>)}
              {!data.recentPayments.length && <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Chưa có thanh toán hoàn tất.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function MetricCard({ eyebrow, value, detail, icon, tone = 'dark' }: { eyebrow: string; value: string; detail: string; icon: React.ReactNode; tone?: 'orange' | 'green' | 'dark' }) {
  const color = tone === 'orange' ? 'bg-[#FFF1E6] text-[#D65E0A]' : tone === 'green' ? 'bg-[#EDF5DF] text-[#5D7F1F]' : 'bg-[#EBEFEC] text-[#34483B]'
  return <article className="rounded-[24px] border border-black/5 bg-white p-5 shadow-sm"><div className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}>{icon}</div><p className="mt-6 text-xs font-black uppercase tracking-[0.12em] text-slate-500">{eyebrow}</p><p className="mt-1 text-3xl font-black tracking-tight">{value}</p><p className="mt-2 text-sm text-slate-500">{detail}</p></article>
}

function RevenueLine({ label, value, maximum, color }: { label: string; value: number; maximum: number; color: string }) {
  return <div><div className="flex justify-between gap-3 text-sm"><span className="font-bold">{label}</span><strong>{formatVnd(value)}</strong></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-[#EDF0ED]"><div className={`h-full rounded-full ${color}`} style={{ width: `${revenueBarHeight(value, maximum)}%` }} /></div></div>
}
