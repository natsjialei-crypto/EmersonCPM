import { useState, useMemo } from "react"
import { allLoops, plant } from "../data/mockData"
import type { AppState } from "../types"

interface RelationEdge {
  fromLoopId: string
  fromTag: string
  fromName: string
  fromUnitCode: string
  toTag: string
  toName: string
  toUnitId: string
  description: string
  notes: string
}

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
    <span style={{ background: c.bg, color: c.color, fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 3 }}>
      {c.label}
    </span>
  )
}

export default function RelatedLoopAnalysisPage({ navigate }: { navigate: (page: AppState["page"], extra?: Partial<AppState>) => void }) {
  const [selectedLoopId, setSelectedLoopId] = useState(allLoops[0]?.id || "")
  const [unitFilter, setUnitFilter] = useState("")
  const [search, setSearch] = useState("")

  // Build all relation edges from relatedLoopEntries
  const allEdges: RelationEdge[] = useMemo(() => {
    const edges: RelationEdge[] = []
    for (const loop of allLoops) {
      const unit = plant.units.find((u) => u.id === loop.unitId)
      for (const rel of (loop.relatedLoopEntries || [])) {
        edges.push({
          fromLoopId: loop.id,
          fromTag: loop.tag,
          fromName: loop.name,
          fromUnitCode: unit?.deviceCode || "",
          toTag: rel.tag,
          toName: rel.name,
          toUnitId: rel.unitId,
          description: rel.description,
          notes: rel.notes,
        })
      }
    }
    return edges
  }, [])

  const selectedLoop = allLoops.find((l) => l.id === selectedLoopId)

  // Edges involving selected loop (as source or target by tag)
  const loopEdges = useMemo(() => {
    if (!selectedLoop) return []
    return allEdges.filter(
      (e) => e.fromLoopId === selectedLoop.id || e.toTag === selectedLoop.tag
    )
  }, [selectedLoop, allEdges])

  // All unique loops that appear as related
  const relatedLoopTags = useMemo(() => {
    const tags = new Set<string>()
    for (const edge of loopEdges) {
      if (edge.fromTag !== selectedLoop?.tag) tags.add(edge.fromTag)
      if (edge.toTag !== selectedLoop?.tag) tags.add(edge.toTag)
    }
    return [...tags]
  }, [loopEdges, selectedLoop])

  // Global graph stats
  const loopsWithRelations = new Set(allEdges.map((e) => e.fromLoopId)).size
  const totalEdges = allEdges.length

  // Global view: filter all edges
  const filteredEdges = useMemo(() => {
    let list = [...allEdges]
    if (unitFilter) {
      list = list.filter((e) => {
        const fromLoop = allLoops.find((l) => l.id === e.fromLoopId)
        return fromLoop?.unitId === unitFilter
      })
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((e) =>
        e.fromTag.toLowerCase().includes(q) ||
        e.toTag.toLowerCase().includes(q) ||
        e.fromName.toLowerCase().includes(q) ||
        e.toName.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      )
    }
    return list
  }, [allEdges, unitFilter, search])

  const unitOptions = plant.units.map((u) => ({ value: u.id, label: `${u.deviceCode} ${u.deviceName}` }))

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#171A1E", margin: "0 0 4px" }}>关联回路分析</h1>
        <p style={{ fontSize: 13, color: "#747A82", margin: 0 }}>
          分析控制回路间的关联关系，识别耦合影响路径
        </p>
      </div>

      {/* Summary */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
        {[
          { label: "回路关联记录", value: totalEdges, color: "#004B8D", sub: "全厂关联条目" },
          { label: "涉及回路数", value: loopsWithRelations, color: "#F28C28", sub: `共 ${allLoops.length} 个回路` },
          { label: "本次筛选", value: filteredEdges.length, color: "#39C523", sub: "条关联记录" },
        ].map((item) => (
          <div key={item.label} style={{ background: "white", borderRadius: 12, border: "1px solid rgba(96,108,122,0.12)", boxShadow: "0 4px 16px rgba(27,39,52,0.07)", padding: "18px 22px", flex: 1 }}>
            <div style={{ fontSize: 11, color: "#747A82", fontWeight: 500, marginBottom: 8 }}>{item.label}</div>
            <div className="font-data" style={{ fontSize: 32, fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.value}</div>
            <div style={{ fontSize: 11, color: "#9FA6AF", marginTop: 5 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
        {/* Left: single loop explorer */}
        <div>
          <div style={{ background: "white", borderRadius: 12, border: "1px solid rgba(96,108,122,0.12)", boxShadow: "0 4px 16px rgba(27,39,52,0.07)", padding: "18px 18px 20px", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#30353B", marginBottom: 12 }}>单回路关联查看</div>
            <select
              value={selectedLoopId}
              onChange={(e) => setSelectedLoopId(e.target.value)}
              style={{
                width: "100%", height: 36, padding: "0 10px",
                border: "1px solid #CDD2D9", borderRadius: 8, fontSize: 12, color: "#30353B",
                background: "white", outline: "none", marginBottom: 14,
              }}
            >
              {allLoops.map((l) => (
                <option key={l.id} value={l.id}>{l.tag} — {l.name}</option>
              ))}
            </select>

            {selectedLoop && (
              <>
                <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "12px 14px", border: "1px solid #E0E4E9", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span className="font-mono-code" style={{ fontSize: 13, color: "#004B8D", fontWeight: 700 }}>{selectedLoop.tag}</span>
                    <PerfLevelBadge level={selectedLoop.performanceLevel} />
                  </div>
                  <div style={{ fontSize: 12, color: "#515760" }}>{selectedLoop.name}</div>
                  <div style={{ fontSize: 11, color: "#9FA6AF", marginTop: 4 }}>
                    {plant.units.find((u) => u.id === selectedLoop.unitId)?.deviceCode}
                    {" — "}
                    {plant.units.find((u) => u.id === selectedLoop.unitId)?.deviceName}
                  </div>
                </div>

                {/* Topology */}
                {loopEdges.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#9FA6AF", fontSize: 12 }}>
                    该回路暂无关联记录
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 11, color: "#747A82", marginBottom: 8, fontWeight: 500 }}>
                      关联回路（{relatedLoopTags.length} 个）
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {loopEdges.map((edge, idx) => {
                        const isOutgoing = edge.fromLoopId === selectedLoop.id
                        const otherTag = isOutgoing ? edge.toTag : edge.fromTag
                        const otherName = isOutgoing ? edge.toName : edge.fromName
                        const otherLoop = allLoops.find((l) => l.tag === otherTag)
                        return (
                          <div
                            key={idx}
                            style={{ background: "#F9FAFB", borderRadius: 7, border: "1px solid #E0E4E9", padding: "10px 12px", cursor: otherLoop ? "pointer" : "default" }}
                            onClick={() => otherLoop && setSelectedLoopId(otherLoop.id)}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                              <span style={{ fontSize: 10, color: isOutgoing ? "#004B8D" : "#39C523", background: isOutgoing ? "#EEF5FB" : "#EFF9EC", padding: "1px 5px", borderRadius: 3, fontWeight: 600 }}>
                                {isOutgoing ? "关联→" : "←被关联"}
                              </span>
                              <span className="font-mono-code" style={{ fontSize: 11, color: otherLoop ? "#004B8D" : "#515760", fontWeight: 600 }}>
                                {otherTag}
                              </span>
                              {otherLoop && <PerfLevelBadge level={otherLoop.performanceLevel} />}
                            </div>
                            <div style={{ fontSize: 11, color: "#515760" }}>{otherName || "—"}</div>
                            {edge.description && (
                              <div style={{ fontSize: 10, color: "#9FA6AF", marginTop: 3 }}>{edge.description}</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}

                {/* Also show upstream/downstream from loop data */}
                {(selectedLoop.upstreamTags.length > 0 || selectedLoop.downstreamTags.length > 0 || selectedLoop.coupledTags.length > 0) && (
                  <div style={{ marginTop: 14, borderTop: "1px solid #F1F3F6", paddingTop: 12 }}>
                    <div style={{ fontSize: 11, color: "#747A82", fontWeight: 500, marginBottom: 8 }}>系统关联（自动识别）</div>
                    {selectedLoop.upstreamTags.length > 0 && (
                      <div style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: 10, color: "#9FA6AF" }}>上游：</span>
                        {selectedLoop.upstreamTags.map((t) => (
                          <span key={t} className="font-mono-code" style={{ fontSize: 10, color: "#004B8D", background: "#EEF5FB", padding: "1px 5px", borderRadius: 3, marginLeft: 4 }}>{t}</span>
                        ))}
                      </div>
                    )}
                    {selectedLoop.downstreamTags.length > 0 && (
                      <div style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: 10, color: "#9FA6AF" }}>下游：</span>
                        {selectedLoop.downstreamTags.map((t) => (
                          <span key={t} className="font-mono-code" style={{ fontSize: 10, color: "#004B8D", background: "#EEF5FB", padding: "1px 5px", borderRadius: 3, marginLeft: 4 }}>{t}</span>
                        ))}
                      </div>
                    )}
                    {selectedLoop.coupledTags.length > 0 && (
                      <div>
                        <span style={{ fontSize: 10, color: "#9FA6AF" }}>耦合：</span>
                        {selectedLoop.coupledTags.map((t) => (
                          <span key={t} className="font-mono-code" style={{ fontSize: 10, color: "#515760", background: "#F1F3F6", padding: "1px 5px", borderRadius: 3, marginLeft: 4 }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <button
            onClick={() => navigate("loop-detail", { selectedLoopId })}
            style={{
              width: "100%", height: 36, borderRadius: 8, border: "1px solid #D9EAF7",
              background: "#EEF5FB", color: "#004B8D", fontSize: 13, fontWeight: 500,
              cursor: "pointer",
            }}
          >
            查看回路详情 →
          </button>
        </div>

        {/* Right: global relation table */}
        <div>
          <div style={{ background: "white", borderRadius: 12, border: "1px solid rgba(96,108,122,0.12)", boxShadow: "0 8px 24px rgba(27,39,52,0.07)", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #E0E4E9", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#30353B" }}>全厂关联关系列表</div>
              <div style={{ flex: 1 }} />
              <input
                type="text"
                placeholder="搜索位号或描述..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ height: 32, padding: "0 10px", border: "1px solid #CDD2D9", borderRadius: 7, fontSize: 12, outline: "none", width: 180 }}
              />
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                style={{ height: 32, padding: "0 8px", border: "1px solid #CDD2D9", borderRadius: 7, fontSize: 12, color: "#30353B", background: "white", outline: "none" }}
              >
                <option value="">所有单元</option>
                {unitOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {filteredEdges.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: "#9FA6AF", fontSize: 13 }}>
                暂无关联关系记录，请在回路详情页的【相关回路】标签中添加
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F7F8FA" }}>
                    {["源回路", "关联回路", "所属单元", "关联描述", "备注", "操作"].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "#747A82", textAlign: "left", borderBottom: "1px solid #E0E4E9", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEdges.map((edge, idx) => {
                    const toUnit = plant.units.find((u) => u.id === edge.toUnitId)
                    const fromLoop = allLoops.find((l) => l.id === edge.fromLoopId)
                    return (
                      <tr
                        key={idx}
                        style={{ borderBottom: idx < filteredEdges.length - 1 ? "1px solid #F1F3F6" : "none" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F9FAFB" }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "white" }}
                      >
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span className="font-mono-code" style={{ fontSize: 12, color: "#004B8D", fontWeight: 700 }}>
                              {edge.fromTag}
                            </span>
                            {fromLoop && <PerfLevelBadge level={fromLoop.performanceLevel} />}
                          </div>
                          <div style={{ fontSize: 11, color: "#9FA6AF", marginTop: 1 }}>{edge.fromName}</div>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ color: "#9FA6AF", fontSize: 10 }}>→</span>
                            <span className="font-mono-code" style={{ fontSize: 12, color: "#515760", fontWeight: 600 }}>
                              {edge.toTag}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: "#9FA6AF", marginTop: 1 }}>{edge.toName || "—"}</div>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ fontSize: 11 }}>
                            <span className="font-mono-code" style={{ color: "#515760" }}>{edge.fromUnitCode}</span>
                            {toUnit && toUnit.deviceCode !== edge.fromUnitCode && (
                              <>
                                <span style={{ color: "#9FA6AF", margin: "0 4px" }}>→</span>
                                <span className="font-mono-code" style={{ color: "#515760" }}>{toUnit.deviceCode}</span>
                              </>
                            )}
                          </div>
                          {toUnit && toUnit.deviceCode !== edge.fromUnitCode && (
                            <div style={{ fontSize: 10, color: "#D93838", marginTop: 1 }}>跨单元</div>
                          )}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: "#515760", maxWidth: 180 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {edge.description || "—"}
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 11, color: "#9FA6AF" }}>
                          {edge.notes || "—"}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <button
                            onClick={() => navigate("loop-detail", { selectedLoopId: edge.fromLoopId })}
                            style={{ fontSize: 11, color: "#004B8D", background: "#EEF5FB", border: "1px solid #D9EAF7", borderRadius: 5, padding: "3px 8px", cursor: "pointer" }}
                          >
                            详情
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {filteredEdges.length === 0 && totalEdges === 0 && (
            <div style={{ marginTop: 12, background: "#FEF9EB", borderRadius: 8, border: "1px solid #FDE68A", padding: "12px 16px", fontSize: 12, color: "#92620A" }}>
              提示：在【回路台账】→ 回路详情 → 【相关回路】标签中添加关联关系后，此处将自动汇总展示。
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
