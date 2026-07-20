import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, RefreshCw, ArrowRightLeft, PackageCheck } from "lucide-react";

type ChainArea = {
  id: string;
  name: string;
  type: "STORAGE" | "SERVICE";
  isActive?: boolean;
  _count?: { stockLevels?: number };
  branch?: { id: string; name: string; code?: string | null } | null;
};

type PendingTransfer = {
  id: string;
  createdAt: string;
  fromArea?: { name?: string };
  toArea?: { name?: string };
  itemsJson?: unknown[];
};

function asList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown[] }).data)) {
    return (data as { data: T[] }).data;
  }
  return [];
}

export default function ChainOperationsPage() {
  const [areas, setAreas] = useState<ChainArea[]>([]);
  const [transfers, setTransfers] = useState<PendingTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const client = (window as any).electronAPI;
      const [areaData, transferData] = await Promise.all([
        client?.reportsGet?.("/storage-areas"),
        client?.reportsGet?.("/inventory/transfers?status=PENDING"),
      ]);
      setAreas(asList<ChainArea>(areaData));
      setTransfers(asList<PendingTransfer>(transferData));
    } catch {
      setError("Không tải được dữ liệu điều phối. Kiểm tra kết nối rồi thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const groupedAreas = useMemo(() => {
    const groups = new Map<string, { label: string; areas: ChainArea[] }>();
    for (const area of areas) {
      const key = area.branch?.id ?? "unassigned";
      const label = area.branch?.name ?? "Kho trung tâm / chưa gán quán";
      const group = groups.get(key) ?? { label, areas: [] };
      group.areas.push(area);
      groups.set(key, group);
    }
    return [...groups.values()];
  }, [areas]);

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 24px 56px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 20, marginBottom: 24 }}>
        <div>
          <p style={{ color: "#6B8E23", fontSize: 12, fontWeight: 800, letterSpacing: 1.2, margin: "0 0 6px" }}>CHAIN CONTROL</p>
          <h1 style={{ margin: 0, fontSize: 28, color: "#16251b" }}>Điều phối kho & quán</h1>
          <p style={{ color: "#6b7280", margin: "8px 0 0", lineHeight: 1.5 }}>
            Desktop dùng để theo dõi toàn chuỗi. Phiếu chuyển chỉ hoàn tất khi người nhận bấm “Nhận hàng” trên mobile.
          </p>
        </div>
        <button onClick={() => void load()} disabled={loading} style={buttonStyle}>
          <RefreshCw size={16} /> Làm mới
        </button>
      </header>

      {error && <div style={{ ...noticeStyle, borderColor: "#fecaca", background: "#fff1f2", color: "#b91c1c" }}>{error}</div>}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, marginBottom: 24 }}>
        <Metric label="Điểm vận hành" value={String(groupedAreas.length)} icon={<Building2 size={20} />} />
        <Metric label="Khu vực hoạt động" value={String(areas.filter((area) => area.isActive !== false).length)} icon={<PackageCheck size={20} />} />
        <Metric label="Phiếu chờ nhận" value={String(transfers.length)} icon={<ArrowRightLeft size={20} />} accent={transfers.length > 0 ? "#e07a2f" : "#6b8e23"} />
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Bản đồ kho theo quán</h2>
        {loading ? <p style={mutedStyle}>Đang tải dữ liệu chuỗi…</p> : groupedAreas.length === 0 ? <p style={mutedStyle}>Chưa có khu vực Chain.</p> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            {groupedAreas.map((group) => (
              <article key={group.label} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "#fff" }}>
                <strong style={{ color: "#172b1d", fontSize: 16 }}>{group.label}</strong>
                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                  {group.areas.map((area) => (
                    <div key={area.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, color: area.isActive === false ? "#9ca3af" : "#374151" }}>
                      <span>{area.type === "SERVICE" ? "Quầy" : "Kho"} · {area.name}</span>
                      <small>{area._count?.stockLevels ?? 0} mặt hàng</small>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section style={{ ...panelStyle, marginTop: 20 }}>
        <h2 style={sectionTitleStyle}>Phiếu đang chờ bên nhận</h2>
        {loading ? <p style={mutedStyle}>Đang tải phiếu chuyển…</p> : transfers.length === 0 ? <p style={mutedStyle}>Không có phiếu chờ nhận.</p> : (
          <div style={{ display: "grid", gap: 10 }}>
            {transfers.map((transfer) => (
              <div key={transfer.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, border: "1px solid #fde0c2", borderRadius: 10, padding: "13px 15px", background: "#fffaf4" }}>
                <div>
                  <strong>{transfer.fromArea?.name ?? "Kho nguồn"} → {transfer.toArea?.name ?? "Kho nhận"}</strong>
                  <p style={{ ...mutedStyle, margin: "5px 0 0" }}>{transfer.itemsJson?.length ?? 0} nguyên liệu · {new Date(transfer.createdAt).toLocaleString("vi-VN")}</p>
                </div>
                <span style={{ color: "#b45309", fontWeight: 700, fontSize: 13 }}>Chờ Nhận hàng</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value, icon, accent = "#6b8e23" }: { label: string; value: string; icon: React.ReactNode; accent?: string }) {
  return <div style={{ ...panelStyle, padding: 18 }}><div style={{ color: accent, marginBottom: 10 }}>{icon}</div><div style={{ fontSize: 28, fontWeight: 800, color: "#172b1d" }}>{value}</div><div style={{ color: "#6b7280", marginTop: 4 }}>{label}</div></div>;
}

const panelStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 20, boxShadow: "0 4px 14px rgba(22, 37, 27, 0.04)" };
const buttonStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, border: 0, borderRadius: 9, background: "#e07a2f", color: "#fff", padding: "10px 14px", fontWeight: 700, cursor: "pointer" };
const sectionTitleStyle: React.CSSProperties = { margin: "0 0 16px", color: "#172b1d", fontSize: 18 };
const mutedStyle: React.CSSProperties = { color: "#6b7280", lineHeight: 1.5 };
const noticeStyle: React.CSSProperties = { border: "1px solid", borderRadius: 10, padding: 12, marginBottom: 16 };
