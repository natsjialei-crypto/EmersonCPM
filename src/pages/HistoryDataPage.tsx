import { useState, useMemo } from "react"
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts"
import { allLoops, generateHistoryData } from "../data/mockData"
import type { AppState } from "../types"

const RANGE_OPTIONS = [
  { label: "24小时", days: 1 },
  { label: "7天", days: 7 },
  { label: "30天", days: 30 },
]

function StatCard({ label, value, unit, color }: { label: string; value: string; unit?: string; color?: string }) {
  return (
    <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "12px 16px", border: "1px solid #E0E4E9", flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, color: "#747A82", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span className="font-data" style={{ fontSize: 22, fontWeight: 700, color: color || "#171A1E", lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 11, color: "#9FA6AF" }}>{unit}</span>}
      </div>
    </div>
  )
}

export default function HistoryDataPage({
  navigate,
}: {
  navigate: (page: AppState["page"], extra?: Partial<AppState>) => void
}) {
  const [selectedLoopId, setSelectedLoopId] = useState(allLoops[0]?.id || "")
  const [days, setDays] = useState(1)
  const [showOP, setShowOP] = useState(true)
  const [showSP, setShowSP] = useState(true)

  const loop = allLoops.find((l) => l.id === selectedLoopId) || allLoops[0]

  const histData = useMemo(() => {
    if (!loop) return []
    return generateHistoryData(loop.trendSP, loop.trendRange, loop.trendOpBase, loop.trendPattern, days)
  }, [loop, days])

  const pvVals = histData.map((d) => d.pv)
  const stats = useMemo(() => {
    if (pvVals.length === 0) return null
    const mean = pvVals.reduce((s, v) => s + v, 0) / pvVals.length
    const max = Math.max(...pvVals)
    const min = Math.min(...pvVals)
    const variance = pvVals.reduce((s, v) => s + (v - mean) ** 2, 0) / pvVals.length
    const stdDev = Math.sqrt(variance)
    const inBand = pvVals.filter((v) => Math.abs(v - (loop?.trendSP || 0)) <= (loop?.trendRange || 1) * 0.15).length
    const inBandPct = (inBand / pvVals.length) * 100
    return { mean, max, min, stdDev, inBandPct }
  }, [pvVals, loop])

  const xInterval = Math.max(1, Math.floor(histData.length / 10))

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#171A1E", margin: "0 0 4px" }}>历史数据分析</h1>
        <p style={{ fontSize: 13, color: "#747A82", margin: 0 }}>选择回路和时间范围，查看历史PV/SP/OP趋势及统计指标</p>
      </div>

      {/* Controls */}
      <div
        style={{
          background: "white", borderRadius: 12, border: "1px solid #E0E4E9",
          padding: "14px 18px", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "#747A82", marginBottom: 4 }}>控制回路</div>
          <select
            value={selectedLoopId}
            onChange={(e) => setSelectedLoopId(e.target.value)}
            style={{
              height: 36, padding: "0 32px 0 10px",
              border: "1px solid #CDD2D9", borderRadius: 8, fontSize: 13,
              color: "#30353B", background: "white", outline: "none",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23747A82' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "calc(100% - 10px) center",
              minWidth: 220,
            }}
          >
            {allLoops.map((l) => (
              <option key={l.id} value={l.id}>{l.tag} — {l.name}</option>
            ))}
          </select>
        </div>

        <div>
          <div style={{ fontSize: 11, color: "#747A82", marginBottom: 4 }}>时间范围</div>
          <div style={{ display: "flex", gap: 4 }}>
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setDays(opt.days)}
                style={{
                  height: 36, padding: "0 14px",
                  borderRadius: 8, fontSize: 13,
                  border: days === opt.days ? "1px solid #004B8D" : "1px solid #CDD2D9",
                  background: days === opt.days ? "#EEF5FB" : "white",
                  color: days === opt.days ? "#004B8D" : "#515760",
                  fontWeight: days === opt.days ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#515760", cursor: "pointer", userSelect: "none" }}>
            <input type="checkbox" checked={showSP} onChange={(e) => setShowSP(e.target.checked)} style={{ accentColor: "#3E8FC3" }} />
            SP
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#515760", cursor: "pointer", userSelect: "none" }}>
            <input type="checkbox" checked={showOP} onChange={(e) => setShowOP(e.target.checked)} style={{ accentColor: "#39C523" }} />
            OP
          </label>
        </div>
      </div>

      {/* Chart */}
      <div
        style={{
          background: "white", borderRadius: 12,
          border: "1px solid rgba(96,108,122,0.12)",
          boxShadow: "0 8px 24px rgba(27,39,52,0.07)",
          padding: "20px 20px 12px",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#30353B" }}>
              <span className="font-mono-code">{loop?.tag}</span> — {loop?.name}
            </div>
            <div style={{ fontSize: 11, color: "#9FA6AF", marginTop: 2 }}>
              {RANGE_OPTIONS.find((o) => o.days === days)?.label} 历史趋势，共 {histData.length} 个数据点
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16, fontSize: 11 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 20, height: 2, background: "#004B8D", display: "inline-block" }} />
              <span style={{ color: "#515760" }}>PV ({loop?.trendUnit})</span>
            </span>
            {showSP && (
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 20, borderTop: "2px dashed #3E8FC3", display: "inline-block" }} />
                <span style={{ color: "#515760" }}>SP</span>
              </span>
            )}
            {showOP && (
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 20, height: 2, background: "#39C523", display: "inline-block" }} />
                <span style={{ color: "#515760" }}>OP (%)</span>
              </span>
            )}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={histData} margin={{ top: 4, right: 52, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E4E9" strokeOpacity={0.7} />
            <XAxis
              dataKey="timeStr"
              tick={{ fontSize: 10, fill: "#747A82", fontFamily: "'Inter Tight'" }}
              tickLine={false}
              axisLine={{ stroke: "#E0E4E9" }}
              interval={xInterval}
            />
            <YAxis
              yAxisId="pv"
              tick={{ fontSize: 10, fill: "#747A82", fontFamily: "'Inter Tight'" }}
              tickLine={false}
              axisLine={false}
              width={52}
              unit={` ${loop?.trendUnit || ""}`}
            />
            <YAxis
              yAxisId="op"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#39C523", fontFamily: "'Inter Tight'" }}
              tickLine={false}
              axisLine={false}
              unit="%"
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "white", border: "1px solid #CDD2D9", borderRadius: 8,
                fontSize: 12, fontFamily: "'Inter Tight'", boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              }}
              labelStyle={{ color: "#747A82", fontWeight: 600 }}
            />
            {loop && (
              <>
                <ReferenceLine yAxisId="pv" y={loop.pid.spHi} stroke="#F2B544" strokeDasharray="4 3" strokeWidth={1} label={{ value: "SP-H", fill: "#F2B544", fontSize: 9 }} />
                <ReferenceLine yAxisId="pv" y={loop.pid.spLo} stroke="#F2B544" strokeDasharray="4 3" strokeWidth={1} label={{ value: "SP-L", fill: "#F2B544", fontSize: 9 }} />
              </>
            )}
            <Line yAxisId="pv" type="monotone" dataKey="pv" stroke="#004B8D" strokeWidth={1.5} dot={false} name="PV" activeDot={{ r: 3, fill: "#004B8D" }} />
            {showSP && <Line yAxisId="pv" type="monotone" dataKey="sp" stroke="#3E8FC3" strokeWidth={1} strokeDasharray="6 4" dot={false} name="SP" />}
            {showOP && <Line yAxisId="op" type="monotone" dataKey="op" stroke="#39C523" strokeWidth={1.5} dot={false} name="OP" />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Statistics */}
      {stats && (
        <div style={{ background: "white", borderRadius: 12, border: "1px solid rgba(96,108,122,0.12)", boxShadow: "0 8px 24px rgba(27,39,52,0.07)", padding: "18px 20px" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#30353B", marginBottom: 14 }}>统计指标</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            <StatCard label="PV均值" value={stats.mean.toFixed(2)} unit={loop?.trendUnit} />
            <StatCard label="PV最大值" value={stats.max.toFixed(2)} unit={loop?.trendUnit} color="#D93838" />
            <StatCard label="PV最小值" value={stats.min.toFixed(2)} unit={loop?.trendUnit} color="#004B8D" />
            <StatCard label="标准差 σ" value={stats.stdDev.toFixed(3)} unit={loop?.trendUnit} color={stats.stdDev > (loop?.trendRange || 1) * 0.15 ? "#F28C28" : "#39C523"} />
            <StatCard label="带内率" value={stats.inBandPct.toFixed(1)} unit="%" color={stats.inBandPct >= 80 ? "#004B8D" : "#D93838"} />
          </div>
          <div style={{ fontSize: 12, color: "#747A82", borderTop: "1px solid #F1F3F6", paddingTop: 12 }}>
            <span style={{ fontWeight: 500 }}>带内率说明：</span>PV在SP ±15% 范围内的时间占比，参考 GB/T 44693.2-2024 准确率计算方法。
            标准差越小表示控制越稳定；带内率低于 80% 提示应检查PID参数或工艺扰动。
          </div>
        </div>
      )}
    </div>
  )
}
