import { useEffect, useState } from 'react'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { getRoleLabel } from '../utils/permissions'

const defaultPreferences = {
  displayName: '',
  preferredName: '',
  contactEmail: '',
  phoneNumber: '',
  notificationChannel: 'email',
  eventReminder: '30',
  defaultCalendar: 'google',
  eventOrder: 'soonest',
}

function preferencesForUser(user) {
  const preferences = {
    ...defaultPreferences,
    ...(user?.preferences || {}),
    displayName: user?.preferences?.displayName || user?.name || '',
    preferredName: user?.preferences?.preferredName || user?.preferredName || '',
    contactEmail: user?.preferences?.contactEmail || user?.contactEmail || user?.email || '',
    phoneNumber: user?.preferences?.phoneNumber || user?.phoneNumber || '',
  }

  return {
    ...preferences,
    notificationChannel: preferences.notificationChannel === 'off' ? 'off' : 'email',
  }
}

function Settings() {
  const { currentUser, updateProfilePreferences } = useAuth()
  const [preferences, setPreferences] = useState(() => preferencesForUser(currentUser))
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    setPreferences(preferencesForUser(currentUser))
  }, [currentUser])

  const updatePreference = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setPreferences((current) => ({ ...current, [field]: value }))
  }

  const savePreferences = (event) => {
    event.preventDefault()
    setSavingPreferences(true)
    setMessage(null)

    try {
      updateProfilePreferences?.(preferences)
      setMessage({ type: 'success', text: 'Settings saved successfully.' })
    } catch (saveError) {
      console.error('Failed to save profile preferences', saveError)
      setMessage({ type: 'error', text: 'Unable to save settings. Please try again.' })
    } finally {
      setSavingPreferences(false)
    }
  }

  const resetPreferences = () => {
    setPreferences(preferencesForUser(currentUser))
    setMessage({ type: 'success', text: 'Settings reset to your saved preferences.' })
  }

  return (
    <section className="page form-page settings-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Account Settings</h1>
          <p className="muted">Fine-tune your profile, reminders, and app preferences.</p>
        </div>
      </div>

      <div className="settings-overview-grid">
        <div className="settings-info-card settings-info-card--role">
          <span>Role</span>
          <strong>{getRoleLabel(currentUser?.role)}</strong>
        </div>
        <div className="settings-info-card settings-info-card--status">
          <span>Status</span>
          <strong>{currentUser?.status || 'Active'}</strong>
        </div>
        <div className="settings-info-card settings-info-card--email">
          <span>UNC Email</span>
          <strong>{currentUser?.email || 'member@unc.edu'}</strong>
        </div>
      </div>

      <form className="settings-layout" onSubmit={savePreferences}>
        <div className="card settings-panel">
          <div className="settings-panel__header">
            <h2>Profile</h2>
            <p className="muted">Keep your member details comfortable and current.</p>
          </div>

          <div className="settings-field-grid">
            <label className="settings-field">
              <span>Display name</span>
              <input
                type="text"
                value={preferences.displayName}
                onChange={updatePreference('displayName')}
                placeholder="Grace Wu"
              />
            </label>
            <label className="settings-field">
              <span>Preferred name</span>
              <input
                type="text"
                value={preferences.preferredName}
                onChange={updatePreference('preferredName')}
                placeholder="Grace"
              />
            </label>
            <label className="settings-field">
              <span>Contact email</span>
              <input
                type="email"
                value={preferences.contactEmail}
                onChange={updatePreference('contactEmail')}
                placeholder="gracewu@unc.edu"
              />
            </label>
            <label className="settings-field">
              <span>Phone number</span>
              <input
                type="tel"
                value={preferences.phoneNumber}
                onChange={updatePreference('phoneNumber')}
                placeholder="(919) 555-0123"
              />
            </label>
          </div>
        </div>

        <div className="card settings-panel">
          <div className="settings-panel__header">
            <h2>Notifications</h2>
            <p className="muted">Choose how Presence should remind you about events.</p>
          </div>

          <div className="settings-field-grid">
            <label className="settings-field settings-field--select">
              <span>Reminder delivery</span>
              <select value={preferences.notificationChannel} onChange={updatePreference('notificationChannel')}>
                <option value="email">Email notifications on</option>
                <option value="off">No notifications</option>
              </select>
            </label>
            <label className="settings-field settings-field--select">
              <span>Event reminder</span>
              <select value={preferences.eventReminder} onChange={updatePreference('eventReminder')}>
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="day-before">The day before</option>
                <option value="none">No reminder</option>
              </select>
            </label>
          </div>
        </div>

        <div className="card settings-panel">
          <div className="settings-panel__header">
            <h2>App Preferences</h2>
            <p className="muted">Set the defaults that make checking in feel faster.</p>
          </div>

          <div className="settings-field-grid">
            <label className="settings-field settings-field--select">
              <span>Default calendar</span>
              <select value={preferences.defaultCalendar} onChange={updatePreference('defaultCalendar')}>
                <option value="google">Google Calendar</option>
                <option value="outlook">Outlook Calendar</option>
                <option value="apple">Apple Calendar</option>
              </select>
            </label>
            <label className="settings-field settings-field--select">
              <span>Event order</span>
              <select value={preferences.eventOrder} onChange={updatePreference('eventOrder')}>
                <option value="soonest">Soonest first</option>
                <option value="required">Required first</option>
                <option value="type">Grouped by type</option>
              </select>
            </label>
          </div>

        </div>

        <div className="settings-footer">
          {message && (
            <p className={`settings-message ${message.type === 'error' ? 'error-message' : 'success-message'}`}>
              {message.text}
            </p>
          )}
          <div className="settings-actions">
            <Button type="submit" disabled={savingPreferences}>
              {savingPreferences ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button type="button" variant="secondary" onClick={resetPreferences}>
              Reset
            </Button>
          </div>
        </div>
      </form>
    </section>
  )
}

export default Settings
