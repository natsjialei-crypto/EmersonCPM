import { useState } from "react"
import { plant } from "../data/mockData"
import type { AppState, CustomStatus, UnitStatusConfig } from "../types"

const PRESET_COLORS = [
  { value: "#39C523", label: "绿" },
  { value: "#004B8D", label: "蓝" },
  { value: "#F2B544", label: "黄" },
  { value: "#F28C28", label: "橙" },
  { value: "#D93838", label: "红" },
  { value: "#8B5CF6", label: "紫" },
  { value: "#9FA6AF", label: "灰" },
]

const DEFAULT_STATUSES: CustomStatus[] = [
  { id: "s-running",   name: "正常运行",   color: "#39C523", description: "装置正常生产运行" },
  { id: "s-shutdown",  name: "计划停车",   color: "#F2B544", description: "按计划停工检修" },
  { id: "s-emergency", name: "紧急停车",   color: "#D93838", description: "紧急停工，需立即处理" },
  { id: "s-standby",   name: "备用待命",   color: "#004B8D", description: "装置处于热备状态" },
]

function initConfigs(): UnitStatusConfig[] {
  return plant.units.map((unit, i) => ({
    unitId: unit.id,
    customStatuses: DEFAULT_STATUSES.map((s) => ({ ...s, id: `${unit.id}-${s.id}` })),
    activeStatusId: i === 2 ? `${unit.id}-s-shutdown` : `${unit.id}-s-running`,
  }))
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {PRESET_COLORS.map((c) => (
        <button
          key={c.value}
          title={c.label}
          onClick={() => onChange(c.value)}
          style={{
            width: 20, height: 20, borderRadius: "50%", background: c.value, border: "none",
            cursor: "pointer", outline: value === c.value ? `2px solid ${c.value}` : "none",
            outlineOffset: 2,
            boxShadow: value === c.value ? `0 0 0 1px white, 0 0 0 3px ${c.value}` : "none",
            transition: "box-shadow 120ms",
          }}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        title="自定义颜色"
        style={{ width: 24, height: 24, borderRadius: 4, border: "1px solid #CDD2D9", cursor: "pointer", padding: 1 }}
      />
    </div>
  )
}

export default function UnitConfigPage({ navigate }: { navigate: (page: AppState["page"], extra?: Partial<AppState>) => void }) {
  const [configs, setConfigs] = useState<UnitStatusConfig[]>(initConfigs)
  const [selectedUnitId, setSelectedUnitId] = useState(plant.units[0]?.id || "")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<CustomStatus>>({})
  const [addingNew, setAddingNew] = useState(false)
  const [newStatus, setNewStatus] = useState<Omit<CustomStatus, "id">>({ name: "", color: "#39C523", description: "" })
  const [saveFlash, setSaveFlash] = useState(false)

  const selectedUnit = plant.units.find((u) => u.id === selectedUnitId)
  const config = configs.find((c) => c.unitId === selectedUnitId)!

  const updateConfig = (unitId: string, updater: (c: UnitStatusConfig) => UnitStatusConfig) => {
    setConfigs((prev) => prev.map((c) => c.unitId === unitId ? updater(c) : c))
  }

  const handleSetActive = (statusId: string) => {
    updateConfig(selectedUnitId, (c) => ({ ...c, activeStatusId: statusId }))
  }

  const handleDelete = (statusId: string) => {
    updateConfig(selectedUnitId, (c) => ({
      ...c,
      customStatuses: c.customStatuses.filter((s) => s.id !== statusId),
      activeStatusId: c.activeStatusId === statusId
        ? (c.customStatuses.find((s) => s.id !== statusId)?.id || "")
        : c.activeStatusId,
    }))
  }

  const handleStartEdit = (status: CustomStatus) => {
    setEditingId(status.id)
    setEditDraft({ name: status.name, color: status.color, description: status.description })
    setAddingNew(false)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editDraft.name) return
    updateConfig(selectedUnitId, (c) => ({
      ...c,
      customStatuses: c.customStatuses.map((s) =>
        s.id === editingId ? { ...s, ...editDraft } : s
      ),
    }))
    setEditingId(null)
    setEditDraft({})
  }

  const handleAddNew = () => {
    if (!newStatus.name) return
    const id = `${selectedUnitId}-custom-${Date.now()}`
    updateConfig(selectedUnitId, (c) => ({
      ...c,
      customStatuses: [...c.customStatuses, { id, ...newStatus }],
    }))
    setNewStatus({ name: "", color: "#39C523", description: "" })
    setAddingNew(false)
  }

  const handleSaveAll = () => {
    setSaveFlash(true)
    setTimeout(() => setSaveFlash(false), 2000)
  }

  const activeStatus = config?.customStatuses.find((s) => s.id === config.activeStatusId)

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#171A1E", margin: "0 0 4px" }}>状态配置</h1>
          <p style={{ fontSize: 13, color: "#747A82", margin: 0 }}>
            为每个生产单元配置自定义状态名称、颜色和说明，并设定当前启用状态
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          style={{
            height: 38, padding: "0 20px",
            background: saveFlash ? "#39C523" : "#004B8D",
            color: "white", border: "none", borderRadius: 8,
            fontSize: 13, fontWeight: 500, cursor: "pointer",
            transition: "background 300ms",
          }}
        >
          {saveFlash ? "✓ 已保存" : "保存配置"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
        {/* Unit selector */}
        <div style={{ background: "white", borderRadius: 12, border: "1px solid rgba(96,108,122,0.12)", boxShadow: "0 4px 16px rgba(27,39,52,0.07)", overflow: "hidden", alignSelf: "start" }}>
          <div style={{ padding: "12px 14px 8px", fontSize: 11, fontWeight: 600, color: "#9FA6AF", letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: "1px solid #F1F3F6" }}>
            生产单元
          </div>
          {plant.units.map((unit) => {
            const cfg = configs.find((c) => c.unitId === unit.id)
            const active = cfg?.customStatuses.find((s) => s.id === cfg.activeStatusId)
            const isSel = selectedUnitId === unit.id
            return (
              <button
                key={unit.id}
                onClick={() => { setSelectedUnitId(unit.id); setEditingId(null); setAddingNew(false) }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px",
                  background: isSel ? "#EEF5FB" : "transparent",
                  border: "none", cursor: "pointer", textAlign: "left",
                  borderLeft: isSel ? "3px solid #004B8D" : "3px solid transparent",
                  transition: "background 120ms",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: isSel ? 600 : 400, color: isSel ? "#004B8D" : "#30353B" }}>
                    {unit.deviceCode}
                  </div>
                  <div style={{ fontSize: 11, color: "#9FA6AF", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {unit.deviceName}
                  </div>
                </div>
                {active && (
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: active.color, flexShrink: 0 }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Config panel */}
        <div>
          {selectedUnit && config && (
            <>
              {/* Unit header */}
              <div style={{ background: "white", borderRadius: 12, border: "1px solid rgba(96,108,122,0.12)", boxShadow: "0 4px 16px rgba(27,39,52,0.07)", padding: "18px 20px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="font-mono-code" style={{ fontSize: 16, fontWeight: 700, color: "#004B8D" }}>{selectedUnit.deviceCode}</span>
                      <span style={{ fontSize: 15, color: "#515760" }}>{selectedUnit.deviceName}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#9FA6AF", marginTop: 3 }}>
                      {config.customStatuses.length} 个状态配置 · 最后修改人：{selectedUnit.operatedBy}
                    </div>
                  </div>
                  {activeStatus && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: "#9FA6AF", marginBottom: 4 }}>当前状态</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F9FAFB", border: "1px solid #E0E4E9", borderRadius: 8, padding: "6px 12px" }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: activeStatus.color }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#30353B" }}>{activeStatus.name}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status list */}
              <div style={{ background: "white", borderRadius: 12, border: "1px solid rgba(96,108,122,0.12)", boxShadow: "0 8px 24px rgba(27,39,52,0.07)", overflow: "hidden", marginBottom: 14 }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid #E0E4E9", display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#30353B" }}>状态列表</span>
                  <span style={{ fontSize: 11, color: "#9FA6AF", marginLeft: 8 }}>点击状态行可设为当前启用状态</span>
                  <div style={{ flex: 1 }} />
                  <button
                    onClick={() => { setAddingNew(true); setEditingId(null) }}
                    style={{
                      height: 32, padding: "0 12px", background: "#EEF5FB",
                      color: "#004B8D", border: "1px solid #D9EAF7",
                      borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer",
                    }}
                  >
                    + 新增状态
                  </button>
                </div>

                <div>
                  {config.customStatuses.map((status, idx) => {
                    const isActive = status.id === config.activeStatusId
                    const isEditing = editingId === status.id
                    return (
                      <div
                        key={status.id}
                        style={{
                          borderBottom: idx < config.customStatuses.length - 1 ? "1px solid #F1F3F6" : "none",
                          background: isActive ? "#FAFEFF" : "white",
                          transition: "background 150ms",
                        }}
                      >
                        {isEditing ? (
                          /* Edit form inline */
                          <div style={{ padding: "14px 18px", background: "#F9FAFB", borderLeft: "3px solid #004B8D" }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#515760", marginBottom: 12 }}>编辑状态</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                              <div>
                                <div style={{ fontSize: 11, color: "#747A82", marginBottom: 4 }}>状态名称 *</div>
                                <input
                                  autoFocus
                                  value={editDraft.name || ""}
                                  onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                                  placeholder="如：正常运行"
                                  style={{ width: "100%", height: 34, padding: "0 10px", border: "1px solid #CDD2D9", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                                />
                              </div>
                              <div>
                                <div style={{ fontSize: 11, color: "#747A82", marginBottom: 4 }}>状态说明</div>
                                <input
                                  value={editDraft.description || ""}
                                  onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))}
                                  placeholder="简短描述该状态含义"
                                  style={{ width: "100%", height: 34, padding: "0 10px", border: "1px solid #CDD2D9", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                                />
                              </div>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ fontSize: 11, color: "#747A82", marginBottom: 6 }}>状态颜色</div>
                              <ColorPicker value={editDraft.color || "#39C523"} onChange={(v) => setEditDraft((d) => ({ ...d, color: v }))} />
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                onClick={() => { setEditingId(null); setEditDraft({}) }}
                                style={{ padding: "6px 14px", background: "white", border: "1px solid #CDD2D9", borderRadius: 7, fontSize: 12, cursor: "pointer", color: "#515760" }}
                              >
                                取消
                              </button>
                              <button
                                onClick={handleSaveEdit}
                                disabled={!editDraft.name}
                                style={{ padding: "6px 14px", background: editDraft.name ? "#004B8D" : "#CDD2D9", border: "none", borderRadius: 7, fontSize: 12, cursor: editDraft.name ? "pointer" : "default", color: "white", fontWeight: 500 }}
                              >
                                保存
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Display row */
                          <div
                            style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer" }}
                            onClick={() => handleSetActive(status.id)}
                          >
                            {/* Active indicator */}
                            <div style={{ flexShrink: 0, width: 20, display: "flex", justifyContent: "center" }}>
                              {isActive ? (
                                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#004B8D", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                              ) : (
                                <div style={{ width: 18, height: 18, borderRadius: "50%", border: "1.5px solid #CDD2D9" }} />
                              )}
                            </div>

                            {/* Color dot */}
                            <span style={{ width: 12, height: 12, borderRadius: "50%", background: status.color, flexShrink: 0 }} />

                            {/* Name + desc */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: isActive ? 600 : 400, color: isActive ? "#004B8D" : "#30353B" }}>
                                {status.name}
                                {isActive && (
                                  <span style={{ marginLeft: 8, fontSize: 10, background: "#EEF5FB", color: "#004B8D", border: "1px solid #D9EAF7", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>
                                    当前启用
                                  </span>
                                )}
                              </div>
                              {status.description && (
                                <div style={{ fontSize: 11, color: "#9FA6AF", marginTop: 2 }}>{status.description}</div>
                              )}
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", gap: 6, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleStartEdit(status)}
                                style={{ padding: "4px 10px", fontSize: 11, color: "#515760", background: "#F7F8FA", border: "1px solid #E0E4E9", borderRadius: 6, cursor: "pointer" }}
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => handleDelete(status.id)}
                                disabled={isActive}
                                style={{ padding: "4px 10px", fontSize: 11, color: isActive ? "#CDD2D9" : "#D93838", background: isActive ? "#F9FAFB" : "#FEF2F2", border: `1px solid ${isActive ? "#E0E4E9" : "#FECACA"}`, borderRadius: 6, cursor: isActive ? "default" : "pointer" }}
                                title={isActive ? "当前启用状态无法删除" : ""}
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Add new status form */}
              {addingNew && (
                <div style={{ background: "white", borderRadius: 12, border: "1px solid #004B8D", boxShadow: "0 4px 16px rgba(0,75,141,0.12)", padding: "18px 20px" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#30353B", marginBottom: 14 }}>新增自定义状态</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#747A82", marginBottom: 4 }}>状态名称 *</div>
                      <input
                        autoFocus
                        value={newStatus.name}
                        onChange={(e) => setNewStatus((s) => ({ ...s, name: e.target.value }))}
                        placeholder="如：检修中、热备、开车准备..."
                        style={{ width: "100%", height: 36, padding: "0 10px", border: "1px solid #CDD2D9", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                        onKeyDown={(e) => e.key === "Enter" && handleAddNew()}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#747A82", marginBottom: 4 }}>状态说明</div>
                      <input
                        value={newStatus.description}
                        onChange={(e) => setNewStatus((s) => ({ ...s, description: e.target.value }))}
                        placeholder="简短描述该状态含义（可选）"
                        style={{ width: "100%", height: 36, padding: "0 10px", border: "1px solid #CDD2D9", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: "#747A82", marginBottom: 6 }}>状态颜色</div>
                    <ColorPicker value={newStatus.color} onChange={(v) => setNewStatus((s) => ({ ...s, color: v }))} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => { setAddingNew(false); setNewStatus({ name: "", color: "#39C523", description: "" }) }}
                      style={{ padding: "7px 16px", background: "white", border: "1px solid #CDD2D9", borderRadius: 7, fontSize: 12, cursor: "pointer", color: "#515760" }}
                    >
                      取消
                    </button>
                    <button
                      onClick={handleAddNew}
                      disabled={!newStatus.name}
                      style={{
                        padding: "7px 16px", background: newStatus.name ? "#004B8D" : "#CDD2D9",
                        border: "none", borderRadius: 7, fontSize: 12,
                        cursor: newStatus.name ? "pointer" : "default",
                        color: "white", fontWeight: 500,
                      }}
                    >
                      确认添加
                    </button>
                  </div>
                </div>
              )}

              {!addingNew && (
                <div style={{ textAlign: "center", marginTop: 4 }}>
                  <button
                    onClick={() => { setAddingNew(true); setEditingId(null) }}
                    style={{ background: "none", border: "none", color: "#004B8D", fontSize: 13, cursor: "pointer", padding: "8px 12px" }}
                  >
                    + 为 {selectedUnit.deviceCode} 新增自定义状态
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
