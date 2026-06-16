import Button from '../components/Button'

function Settings() {
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
        <Button type="button">Save Changes</Button>
      </div>
    </section>
  )
}

export default Settings
