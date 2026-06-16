import { useEffect, useState } from 'react'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { fetchAppSettings, updateLeaderboardVisibility } from '../firebase'

function Settings() {
  const { currentUser } = useAuth()
  const [settings, setSettings] = useState({ leaderboardVisibility: 'private' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    async function loadSettings() {
      setLoading(true)
      try {
        const settingsSnapshot = await fetchAppSettings()
        setSettings(settingsSnapshot[0] || { leaderboardVisibility: 'private' })
      } catch (fetchError) {
        console.error('Failed to load settings', fetchError)
        setMessage('Unable to load settings. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleVisibilityChange = (event) => {
    setSettings((current) => ({ ...current, leaderboardVisibility: event.target.value }))
  }

  const saveVisibility = async () => {
    if (currentUser?.role !== 'admin') return
    setSaving(true)
    setMessage(null)

    try {
      await updateLeaderboardVisibility(settings.leaderboardVisibility)
      setMessage('Leaderboard visibility saved successfully.')
    } catch (saveError) {
      console.error('Failed to save leaderboard visibility', saveError)
      setMessage('Unable to save leaderboard visibility. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const isAdmin = currentUser?.role === 'admin'

  return (
    <section className="page form-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Account Settings</h1>
          <p className="muted">Update your profile and chapter notification preferences.</p>
        </div>
      </div>

      <div className="card settings-card">
        <label>
          Display name
          <input type="text" placeholder="Jordan Brooks" />
        </label>
        <label>
          Email
          <input type="email" placeholder="member@presence.app" />
        </label>
        <label>
          Notifications
          <select>
            <option>Mobile alerts only</option>
            <option>Email and mobile</option>
          </select>
        </label>

        <div className="settings-divider" />

        <div className="settings-section">
          <p className="section-heading">Leaderboard Visibility</p>
          <p className="muted">Admins can toggle whether the leaderboard is public or private.</p>

          {loading ? (
            <p className="muted">Loading leaderboard settings…</p>
          ) : (
            <label>
              Visibility
              <select value={settings.leaderboardVisibility} onChange={handleVisibilityChange} disabled={!isAdmin}>
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </label>
          )}

          {!isAdmin && (
            <p className="muted">Only admins can change leaderboard visibility.</p>
          )}

          <Button type="button" onClick={saveVisibility} disabled={!isAdmin || saving || loading}>
            {saving ? 'Saving…' : 'Save Leaderboard Visibility'}
          </Button>

          {message && <p className={`settings-message ${message.includes('Unable') ? 'error-message' : 'success-message'}`}>{message}</p>}
        </div>
      </div>
    </section>
  )
}

export default Settings
