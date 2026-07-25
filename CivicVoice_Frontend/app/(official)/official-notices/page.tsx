"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { getNotices, createNotice, deleteNotice } from "@/lib/api/notices"
import { handleApiError } from "@/lib/api/error-handler"

interface Notice {
  id: number
  title: string
  content: string
  municipality: string
  ward_number: number | null
  is_pinned: boolean
  created_at: string
  created_by_name?: string
}

export default function OfficialNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [municipality, setMunicipality] = useState("")
  const [wardNumber, setWardNumber] = useState("")
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchNotices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getNotices()
      setNotices(Array.isArray(data) ? data : data.results ?? [])
    } catch (err) {
      setError(handleApiError(err).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchNotices() }, [fetchNotices])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    try {
      await createNotice({
        title: title.trim(),
        content: content.trim(),
        municipality: municipality.trim() || "Kathmandu",
        ward_number: wardNumber ? Number(wardNumber) : null,
      })
      setTitle("")
      setContent("")
      setMunicipality("")
      setWardNumber("")
      setShowForm(false)
      fetchNotices()
    } catch (err) {
      alert(handleApiError(err).message)
    }
  }

  const handleDelete = async (id: number) => {
    const reason = prompt("Reason for deleting this notice:")
    if (!reason || !reason.trim()) return
    setDeletingId(id)
    try {
      await deleteNotice(id)
      fetchNotices()
    } catch (err) {
      alert(handleApiError(err).message)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (ts: string) => {
    try {
      const d = new Date(ts)
      if (isNaN(d.getTime())) return ts
      const now = new Date()
      const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
      if (diff < 60) return "Just now"
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    } catch { return ts }
  }

  return (
    <div className="sv-inner" style={{ maxWidth: 880 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 className="sv-section-title" style={{ margin: 0 }}>Manage Notices</h1>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: "10px 24px",
            background: "var(--color-primary)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-lg)",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create New Notice
        </button>
      </div>

      {showForm && (
        <div className="pv-modal-overlay" style={{ display: "flex" }} onClick={() => setShowForm(false)}>
          <div className="pv-modal-box" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="pv-modal-header">
              <h2>Create New Notice</h2>
              <button className="pv-modal-close" onClick={() => setShowForm(false)}>&#x2715;</button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="pv-fg">
                <label style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, display: "block" }}>
                  Title <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Notice title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: 15, background: "var(--color-bg)", color: "var(--color-text)", outline: "none" }}
                />
              </div>
              <div className="pv-fg">
                <label style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, display: "block" }}>Content</label>
                <textarea
                  placeholder="Notice details..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: 15, resize: "vertical", background: "var(--color-bg)", color: "var(--color-text)", outline: "none", fontFamily: "inherit" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="pv-fg">
                  <label style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, display: "block" }}>Municipality</label>
                  <input
                    type="text"
                    placeholder="Kathmandu"
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: 15, background: "var(--color-bg)", color: "var(--color-text)", outline: "none" }}
                  />
                </div>
                <div className="pv-fg">
                  <label style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, display: "block" }}>Ward Number</label>
                  <input
                    type="number"
                    placeholder="All wards"
                    value={wardNumber}
                    onChange={(e) => setWardNumber(e.target.value)}
                    min={1}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: 15, background: "var(--color-bg)", color: "var(--color-text)", outline: "none" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" className="pv-btn pv-btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="pv-btn pv-btn-primary">Publish Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: "center", color: "var(--color-muted)", padding: 40 }}>Loading notices...</p>
      ) : error ? (
        <div className="sv-toast sv-toast-error">
          {error}
          <button className="pv-btn pv-btn-secondary" style={{ marginLeft: 12, fontSize: 12, padding: "4px 12px" }} onClick={fetchNotices}>Retry</button>
        </div>
      ) : notices.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--color-muted)", padding: 40 }}>No notices yet.</p>
      ) : (
        <div className="hm-notice-list">
          {notices.map((n) => (
            <div key={n.id} className="hm-notice">
              <div style={{ flex: 1 }}>
                <div className="hm-notice-title">{n.title}</div>
                <div style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 4 }}>
                  {n.municipality}{n.ward_number ? `, Ward ${n.ward_number}` : ""}
                </div>
                <div className="hm-notice-date">{formatDate(n.created_at)}</div>
              </div>
              <button
                onClick={() => handleDelete(n.id)}
                disabled={deletingId === n.id}
                style={{
                  padding: "6px 14px",
                  background: "transparent",
                  color: "#DC2626",
                  border: "1px solid #DC2626",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 13,
                  cursor: "pointer",
                  flexShrink: 0,
                  opacity: deletingId === n.id ? 0.5 : 1,
                }}
              >
                {deletingId === n.id ? "..." : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
