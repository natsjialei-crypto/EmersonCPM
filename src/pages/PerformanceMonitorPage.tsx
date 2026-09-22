import { useState, useEffect, useRef } from "react"
import { plant, allLoops } from "../data/mockData"
import type { AppState, Unit, Loop } from "../types"

function PerfLevelBadge({ level }: { level: number }) {
  const configs: Record<number, { label: string; bg: string; color: string }> = {
    1: { label: "一级", bg: "#004B8D", color: "white" },
    2: { label: "二级", bg: "#0069A8", color: "white" },
    3: { label: "三级", bg: "#FEF3C7", color: "#92400E" },
    4: { label: "四级", bg: "#FEE2C5", color: "#9A3412" },
    5: { label: "五级", bg: "#FECACA", color: "#991B1B" },
  }
  const c = configs[level] || configs[5]
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 4 }}>
      {c.label}
    </span>
  )
}

function KPICard({ label, value, unit, color, subLabel }: { label: string; value: string | number; unit?: string; color: string; subLabel?: string }) {
  return (
    <div style={{ background: "white", borderRadius: 12, border: "1px solid rgba(96,108,122,0.12)", boxShadow: "0 4px 16px rgba(27,39,52,0.07)", padding: "20px 24px", flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, color: "#747A82", fontWeight: 500, marginBottom: 10 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
        <span className="font-data" style={{ fontSize: 36, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 13, color: "#9FA6AF", marginBottom: 3 }}>{unit}</span>}
      </div>
      {subLabel && <div style={{ fontSize: 11, color: "#9FA6AF", marginTop: 6 }}>{subLabel}</div>}
    </div>
  )
}

type Selection = { type: "plant" } | { type: "unit"; unitId: string } | { type: "loop"; loopId: string }

export default function PerformanceMonitorPage({
  navigate,
}: {
  navigate: (page: AppState["page"], extra?: Partial<AppState>) => void
}) {
  const [selection, setSelection] = useState<Selection>({ type: "plant" })
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set(plant.units.map((u) => u.id)))
  const [liveLoopMetrics, setLiveLoopMetrics] = useState<Record<string, { stability: number; score: number; autoRate: number }>>({})
  const tickRef = useRef(0)

  useEffect(() => {
    const tick = () => {
      tickRef.current++
      if (selection.type === "loop") {
        const loop = allLoops.find((l) => l.id === (selection as { type: "loop"; loopId: string }).loopId)
        if (loop) {
          setLiveLoopMetrics({
            [loop.id]: {
              stability: Math.max(60, Math.min(100, loop.stability + (Math.random() - 0.5) * 3)),
              score: Math.max(50, Math.min(100, loop.performanceScore + (Math.random() - 0.5) * 2)),
              autoRate: Math.max(60, Math.min(100, loop.autoRate + (Math.random() - 0.5) * 1.5)),
            },
          })
        }
      }
    }
    const id = setInterval(tick, 3000)
    return () => clearInterval(id)
  }, [selection])

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) => {
      const next = new Set(prev)
      if (next.has(unitId)) next.delete(unitId)
      else next.add(unitId)
      return next
    })
  }

  const selectedLoop = selection.type === "loop"
    ? allLoops.find((l) => l.id === (selection as { type: "loop"; loopId: string }).loopId)
    : null
  const selectedUnit = selection.type === "unit"
    ? plant.units.find((u) => u.id === (selection as { type: "unit"; unitId: string }).unitId)
    : null

  const liveMetrics = selectedLoop && liveLoopMetrics[selectedLoop.id]
    ? liveLoopMetrics[selectedLoop.id]
    : selectedLoop
      ? { stability: selectedLoop.stability, score: selectedLoop.performanceScore, autoRate: selectedLoop.autoRate }
      : null

  const unitLoops = (unit: Unit) =>
    allLoops.filter((l) => l.unitId === unit.id)

  const avgOf = (loops: Loop[], key: keyof Loop) => {
    if (loops.length === 0) return 0
    return (loops.reduce((s, l) => s + (l[key] as number), 0) / loops.length)
  }

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
      {/* Left panel — hierarchy tree */}
      <div
        style={{
          width: 240,
          flexShrink: 0,
          background: "white",
          borderRight: "1px solid #E0E4E9",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "16px 14px 8px", fontSize: 11, fontWeight: 600, color: "#9FA6AF", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          设备层级
        </div>

        {/* Plant level */}
        <button
          onClick={() => setSelection({ type: "plant" })}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
            background: selection.type === "plant" ? "#EEF5FB" : "transparent",
            border: "none", cursor: "pointer", textAlign: "left", width: "100%",
            borderLeft: selection.type === "plant" ? "3px solid #004B8D" : "3px solid transparent",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="4" width="12" height="9" rx="1.5" stroke={selection.type === "plant" ? "#004B8D" : "#747A82"} strokeWidth="1.5" />
            <path d="M4 4V3a3 3 0 0 1 6 0v1" stroke={selection.type === "plant" ? "#004B8D" : "#747A82"} strokeWidth="1.5" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: selection.type === "plant" ? "#004B8D" : "#30353B" }}>
            {plant.shortName}
          </span>
        </button>

        {plant.units.map((unit) => {
          const loops = unitLoops(unit)
          const isExpanded = expandedUnits.has(unit.id)
          const isUnitSel = selection.type === "unit" && (selection as { type: "unit"; unitId: string }).unitId === unit.id

          return (
            <div key={unit.id}>
              {/* Unit row */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <button
                  onClick={() => toggleUnit(unit.id)}
                  style={{ padding: "6px 6px 6px 20px", background: "none", border: "none", cursor: "pointer", color: "#9FA6AF", fontSize: 10 }}
                >
                  {isExpanded ? "▼" : "▶"}
                </button>
                <button
                  onClick={() => setSelection({ type: "unit", unitId: unit.id })}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", gap: 7, padding: "7px 14px 7px 0",
                    background: isUnitSel ? "#EEF5FB" : "transparent",
                    border: "none", cursor: "pointer", textAlign: "left",
                    borderLeft: isUnitSel ? "3px solid #004B8D" : "3px solid transparent",
                  }}
                >
                  <span
                    style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: unit.status === "running" ? "#39C523" : "#9FA1A4",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 500, color: isUnitSel ? "#004B8D" : "#30353B" }}>
                    {unit.deviceCode}
                  </span>
                  <span style={{ fontSize: 11, color: "#9FA6AF" }}>{unit.deviceName}</span>
                </button>
              </div>

              {/* Loop rows */}
              {isExpanded && loops.map((loop) => {
                const isLoopSel = selection.type === "loop" && (selection as { type: "loop"; loopId: string }).loopId === loop.id
                return (
                  <button
                    key={loop.id}
                    onClick={() => setSelection({ type: "loop", loopId: loop.id })}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 6,
                      padding: "5px 14px 5px 38px",
                      background: isLoopSel ? "#EEF5FB" : "transparent",
                      border: "none", cursor: "pointer", textAlign: "left",
                      borderLeft: isLoopSel ? "3px solid #004B8D" : "3px solid transparent",
                    }}
                  >
                    <span style={{ fontSize: 9, color: "#CDD2D9" }}>—</span>
                    <span className="font-mono-code" style={{ fontSize: 11, color: isLoopSel ? "#004B8D" : "#515760" }}>
                      {loop.tag}
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, overflowY: "auto", padding: 24, minWidth: 0 }}>
        {/* Plant level */}
        {selection.type === "plant" && (
          <>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#171A1E", margin: "0 0 4px" }}>全厂性能概览</h2>
              <p style={{ fontSize: 13, color: "#747A82", margin: 0 }}>
                {plant.name} — 实时性能汇总
              </p>
            </div>
            <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
              <KPICard
                label="平均稳定率"
                value={avgOf(allLoops, "stability").toFixed(1)}
                unit="%"
                color="#004B8D"
                subLabel="全厂控制回路"
              />
              <KPICard
                label="平均性能评分"
                value={avgOf(allLoops, "performanceScore").toFixed(1)}
                unit="分"
                color={avgOf(allLoops, "performanceScore") >= 80 ? "#004B8D" : "#D93838"}
                subLabel="GB/T 44693.2-2024"
              />
              <KPICard
                label="平均自控率"
                value={avgOf(allLoops, "autoRate").toFixed(1)}
                unit="%"
                color={avgOf(allLoops, "autoRate") >= 90 ? "#39C523" : "#F28C28"}
                subLabel="自动模式运行比例"
              />
            </div>
            <div style={{ background: "white", borderRadius: 12, border: "1px solid rgba(96,108,122,0.12)", boxShadow: "0 8px 24px rgba(27,39,52,0.07)", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #E0E4E9", fontSize: 14, fontWeight: 600, color: "#30353B" }}>
                单元性能汇总
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F7F8FA" }}>
                    {["单元", "状态", "回路数", "稳定率", "性能评分", "自控率", "最差回路"].map((h) => (
                      <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "#747A82", textAlign: "left", borderBottom: "1px solid #E0E4E9", letterSpacing: "0.04em" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plant.units.map((unit, idx) => {
                    const loops = unitLoops(unit)
                    const worst = loops.reduce<Loop | null>((w, l) => (!w || l.performanceScore < w.performanceScore) ? l : w, null)
                    return (
                      <tr
                        key={unit.id}
                        style={{ borderBottom: idx < plant.units.length - 1 ? "1px solid #F1F3F6" : "none", cursor: "pointer" }}
                        onClick={() => setSelection({ type: "unit", unitId: unit.id })}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F9FAFB" }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "white" }}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#30353B" }}>{unit.deviceCode}</div>
                          <div style={{ fontSize: 11, color: "#9FA6AF" }}>{unit.deviceName}</div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 11, fontWeight: 500, background: unit.status === "running" ? "#EFF9EC" : "#F1F3F6", color: unit.status === "running" ? "#237D17" : "#626972", padding: "2px 8px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: unit.status === "running" ? "#39C523" : "#9FA1A4" }} />
                            {unit.status === "running" ? "运行" : "停车"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className="font-data" style={{ fontSize: 18, fontWeight: 700, color: "#171A1E" }}>{loops.length}</span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {unit.status === "shutdown" ? <span style={{ color: "#9FA6AF", fontSize: 12 }}>—</span> : (
                            <span className="font-data" style={{ fontSize: 15, fontWeight: 700, color: avgOf(loops, "stability") >= 80 ? "#004B8D" : "#D93838" }}>
                              {avgOf(loops, "stability").toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {unit.status === "shutdown" ? <span style={{ color: "#9FA6AF", fontSize: 12 }}>—</span> : (
                            <span className="font-data" style={{ fontSize: 15, fontWeight: 700, color: avgOf(loops, "performanceScore") >= 80 ? "#004B8D" : "#F28C28" }}>
                              {avgOf(loops, "performanceScore").toFixed(1)}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {unit.status === "shutdown" ? <span style={{ color: "#9FA6AF", fontSize: 12 }}>—</span> : (
                            <span className="font-data" style={{ fontSize: 15, fontWeight: 700, color: avgOf(loops, "autoRate") >= 90 ? "#39C523" : "#F28C28" }}>
                              {avgOf(loops, "autoRate").toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {worst && unit.status === "running" ? (
                            <span className="font-mono-code" style={{ fontSize: 11, color: "#D93838" }}>{worst.tag}</span>
                          ) : <span style={{ color: "#9FA6AF", fontSize: 12 }}>—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Unit level */}
        {selection.type === "unit" && selectedUnit && (() => {
          const loops = unitLoops(selectedUnit)
          return (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "#9FA6AF", marginBottom: 4 }}>
                  <button onClick={() => setSelection({ type: "plant" })} style={{ background: "none", border: "none", color: "#004B8D", cursor: "pointer", fontSize: 12, padding: 0 }}>全厂概览</button>
                  {" / "}
                  {selectedUnit.deviceCode}
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#171A1E", margin: "0 0 4px" }}>
                  {selectedUnit.deviceCode} — {selectedUnit.deviceName}
                </h2>
                <p style={{ fontSize: 13, color: "#747A82", margin: 0 }}>单元实时性能监控，共 {loops.length} 个控制回路</p>
              </div>

              <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
                <KPICard label="平均稳定率" value={avgOf(loops, "stability").toFixed(1)} unit="%" color="#004B8D" />
                <KPICard label="平均性能评分" value={avgOf(loops, "performanceScore").toFixed(1)} unit="分" color={avgOf(loops, "performanceScore") >= 80 ? "#004B8D" : "#D93838"} />
                <KPICard label="平均自控率" value={avgOf(loops, "autoRate").toFixed(1)} unit="%" color={avgOf(loops, "autoRate") >= 90 ? "#39C523" : "#F28C28"} />
              </div>

              <div style={{ background: "white", borderRadius: 12, border: "1px solid rgba(96,108,122,0.12)", boxShadow: "0 8px 24px rgba(27,39,52,0.07)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F7F8FA" }}>
                      {["回路位号", "名称", "稳定率", "性能评分", "自控率", "定级", "操作"].map((h) => (
                        <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "#747A82", textAlign: "left", borderBottom: "1px solid #E0E4E9", letterSpacing: "0.04em" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loops.map((loop, idx) => (
                      <tr
                        key={loop.id}
                        style={{ borderBottom: idx < loops.length - 1 ? "1px solid #F1F3F6" : "none", cursor: "pointer" }}
                        onClick={() => setSelection({ type: "loop", loopId: loop.id })}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F9FAFB" }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "white" }}
                      >
                        <td style={{ padding: "11px 16px" }}>
                          <span className="font-mono-code" style={{ fontSize: 12, color: "#004B8D", fontWeight: 600 }}>{loop.tag}</span>
                        </td>
                        <td style={{ padding: "11px 16px", fontSize: 13, color: "#30353B" }}>{loop.name}</td>
                        <td style={{ padding: "11px 16px" }}>
                          {selectedUnit.status === "shutdown" ? <span style={{ color: "#9FA6AF" }}>—</span> : (
                            <span className="font-data" style={{ fontSize: 14, fontWeight: 700, color: loop.stability >= 80 ? "#004B8D" : "#D93838" }}>
                              {loop.stability.toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "11px 16px" }}>
                          {selectedUnit.status === "shutdown" ? <span style={{ color: "#9FA6AF" }}>—</span> : (
                            <span className="font-data" style={{ fontSize: 14, fontWeight: 700, color: loop.performanceScore >= 80 ? "#004B8D" : "#F28C28" }}>
                              {loop.performanceScore.toFixed(1)}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "11px 16px" }}>
                          {selectedUnit.status === "shutdown" ? <span style={{ color: "#9FA6AF" }}>—</span> : (
                            <span className="font-data" style={{ fontSize: 14, fontWeight: 700, color: loop.autoRate >= 90 ? "#39C523" : "#F28C28" }}>
                              {loop.autoRate.toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "11px 16px" }}>
                          {selectedUnit.status === "shutdown" ? <span style={{ color: "#9FA6AF" }}>—</span> : (
                            <PerfLevelBadge level={loop.performanceLevel} />
                          )}
                        </td>
                        <td style={{ padding: "11px 16px" }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate("loop-detail", { selectedLoopId: loop.id }) }}
                            style={{ fontSize: 11, color: "#004B8D", background: "#EEF5FB", border: "1px solid #D9EAF7", borderRadius: 5, padding: "3px 8px", cursor: "pointer" }}
                          >
                            详情
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        })()}

        {/* Loop level */}
        {selection.type === "loop" && selectedLoop && liveMetrics && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "#9FA6AF", marginBottom: 4 }}>
                {(() => {
                  const unit = plant.units.find((u) => u.id === selectedLoop.unitId)
                  return (
                    <>
                      <button onClick={() => setSelection({ type: "plant" })} style={{ background: "none", border: "none", color: "#004B8D", cursor: "pointer", fontSize: 12, padding: 0 }}>全厂概览</button>
                      {" / "}
                      <button onClick={() => setSelection({ type: "unit", unitId: selectedLoop.unitId })} style={{ background: "none", border: "none", color: "#004B8D", cursor: "pointer", fontSize: 12, padding: 0 }}>
                        {unit?.deviceCode}
                      </button>
                      {" / "}
                      <span className="font-mono-code">{selectedLoop.tag}</span>
                    </>
                  )
                })()}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#171A1E", margin: 0 }}>
                  <span className="font-mono-code">{selectedLoop.tag}</span> — {selectedLoop.name}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#EFF9EC", border: "1px solid #BBF7D0", borderRadius: 20, padding: "3px 10px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#39C523", animation: "pulse 2s infinite" }} />
                  <span style={{ fontSize: 11, color: "#237D17", fontWeight: 500 }}>实时监控</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
              <KPICard
                label="稳定率 Stability"
                value={liveMetrics.stability.toFixed(1)}
                unit="%"
                color={liveMetrics.stability >= 80 ? "#004B8D" : "#D93838"}
                subLabel="PV波动在允许范围内的比例"
              />
              <KPICard
                label="性能评分 Score"
                value={liveMetrics.score.toFixed(1)}
                unit="分"
                color={liveMetrics.score >= 80 ? "#004B8D" : liveMetrics.score >= 70 ? "#F28C28" : "#D93838"}
                subLabel="GB/T 44693.2-2024 综合评分"
              />
              <KPICard
                label="自控率 Auto Rate"
                value={liveMetrics.autoRate.toFixed(1)}
                unit="%"
                color={liveMetrics.autoRate >= 90 ? "#39C523" : "#F28C28"}
                subLabel="处于自动模式的时间比例"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: "white", borderRadius: 12, border: "1px solid rgba(96,108,122,0.12)", boxShadow: "0 4px 16px rgba(27,39,52,0.07)", padding: "18px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#30353B", marginBottom: 12 }}>性能指标明细</div>
                {[
                  { label: "准确率 Accuracy", value: selectedLoop.accuracy, warn: selectedLoop.accuracy < 80 },
                  { label: "快速率 Speed", value: selectedLoop.speed, warn: selectedLoop.speed < 80 },
                  { label: "饱和率 Saturation", value: selectedLoop.saturationRate, warn: selectedLoop.saturationRate > 10 },
                  { label: "有效自控率 Eff.Auto", value: selectedLoop.effectiveAutoRate, warn: selectedLoop.effectiveAutoRate < 80 },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F1F3F6" }}>
                    <span style={{ flex: 1, fontSize: 12, color: "#515760" }}>{item.label}</span>
                    <span className="font-data" style={{ fontSize: 15, fontWeight: 700, color: item.warn ? "#D93838" : "#004B8D" }}>
                      {item.value.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ background: "white", borderRadius: 12, border: "1px solid rgba(96,108,122,0.12)", boxShadow: "0 4px 16px rgba(27,39,52,0.07)", padding: "18px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#30353B", marginBottom: 12 }}>回路信息</div>
                {[
                  { label: "性能定级", value: <PerfLevelBadge level={selectedLoop.performanceLevel} /> },
                  { label: "运行模式", value: selectedLoop.mode === "auto" ? "自动" : selectedLoop.mode === "manual" ? "手动" : "未投用" },
                  { label: "模型类型", value: selectedLoop.modelType === "first-order" ? "一阶" : "二阶" },
                  { label: "服务状态", value: selectedLoop.serviceStatus === "in-service" ? "In Service" : "Out of Service" },
                  { label: "振荡率", value: `${(selectedLoop.oscillationRate * 100).toFixed(1)}%` },
                  { label: "黏滞系数", value: selectedLoop.stickiness.toFixed(3) },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F1F3F6", fontSize: 12 }}>
                    <span style={{ flex: 1, color: "#747A82" }}>{item.label}</span>
                    <span style={{ color: "#30353B", fontWeight: 500 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 14, textAlign: "right" }}>
              <button
                onClick={() => navigate("loop-detail", { selectedLoopId: selectedLoop.id })}
                style={{ fontSize: 13, color: "#004B8D", background: "#EEF5FB", border: "1px solid #D9EAF7", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 500 }}
              >
                查看完整回路详情 →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
