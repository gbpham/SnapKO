'use client'

import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function AdminModal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#132018]/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-black/10 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E6EAE5] bg-white/95 px-6 py-5 backdrop-blur">
          <h2 className="text-xl font-black tracking-tight text-[#132018]">{title}</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Đóng">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#33443A]">
      {label}
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl border border-[#DCE2DD] bg-white px-3.5 py-2.5 text-sm text-[#132018] outline-none transition focus:border-[#E77825] focus:ring-4 focus:ring-[#E77825]/10 disabled:bg-slate-100'
