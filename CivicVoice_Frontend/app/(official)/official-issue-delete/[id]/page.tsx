"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { removeReport } from "@/lib/api/dashboard"
import { handleApiError } from "@/lib/api/error-handler"

export default function OfficialIssueDeletePage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError("Please provide a reason for removing this report.")
      return
    }
    setLoading(true)
    setError("")
    try {
      await removeReport(id, reason.trim())
      setSuccess(true)
      setTimeout(() => router.push("/official-dashboard"), 2000)
    } catch (err) {
      setError(handleApiError(err).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sv-inner" style={{ maxWidth: 600 }}>
      <div className="od-header">
        <h1>Remove Report</h1>
      </div>

      <div className="auth-card" style={{ marginTop: 24, padding: 32 }}>
        {success ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "var(--color-success, #059669)", fontSize: 16, fontWeight: 500 }}>
              Report removed successfully.
            </p>
            <p style={{ color: "var(--color-muted)", fontSize: 13, marginTop: 8 }}>
              Redirecting to dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="auth-error" role="alert" style={{ color: "#e53e3e", fontSize: 14, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <p style={{ marginBottom: 16, color: "var(--color-muted)", fontSize: 14 }}>
              You are about to remove report <strong>#{id}</strong>. The citizen who posted this
              will receive a notification with the reason you provide below.
            </p>

            <div className="auth-fg">
              <label htmlFor="reason">Reason for Removal</label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this report is being removed..."
                rows={5}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                  fontSize: 14,
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button
                type="submit"
                className="auth-btn auth-btn-primary"
                disabled={loading}
                style={{ background: "#DC2626" }}
              >
                {loading ? "Removing..." : "Remove Report"}
              </button>
              <Link
                href="/official-dashboard"
                className="auth-btn"
                style={{
                  textAlign: "center",
                  background: "transparent",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  textDecoration: "none",
                }}
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
