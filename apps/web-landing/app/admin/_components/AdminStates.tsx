export function AdminLoading() {
  return <div className="grid min-h-[320px] place-items-center text-sm font-semibold text-slate-500">Đang tải dữ liệu quản trị…</div>
}

export function AdminError({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
      <p className="font-bold">Không tải được dữ liệu</p>
      <p className="mt-1">{message}</p>
      {retry && <button onClick={retry} className="mt-3 font-bold underline">Thử lại</button>}
    </div>
  )
}

export function StatusPill({ status }: { status: string }) {
  const tone = status === 'ACTIVE' ? 'bg-[#E8F4D8] text-[#527715]' : status === 'SUSPENDED' || status === 'INACTIVE' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black tracking-wide ${tone}`}>{status}</span>
}
