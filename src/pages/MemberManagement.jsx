import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import MemberCard from '../components/MemberCard'
import Button from '../components/Button'
import * as memberService from '../services/memberService'
import { isAllowedEmail } from '../config/authConfig'
import { FAMILIES, PLEDGE_CLASSES } from '../constants/memberGroups'
import { fetchCheckIns } from '../firebase'
import {
  ROLE_ADMIN,
  ROLE_MEMBER,
  ROLE_SUPER_ADMIN,
  ROLE_SUB_ADMIN,
  canManageMembers,
  canViewApprovedMembers,
  normalizeRole,
} from '../utils/permissions'

const REQUIRED_CSV_COLUMNS = ['name', 'email', 'pledgeClass', 'family', 'role', 'status']
const MEMBER_ROLE_OPTIONS = [
  { value: ROLE_MEMBER, label: 'Member' },
  { value: ROLE_ADMIN, label: 'Admin' },
  { value: ROLE_SUB_ADMIN, label: 'Sub-Admin / Standards Chair' },
  { value: ROLE_SUPER_ADMIN, label: 'Super Admin / VP Standards' },
]

function parseCsvLine(line) {
  const values = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"' && next === '"') {
      current += '"'
      i += 1
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  values.push(current.trim())
  return values
}

function parseMemberCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) {
    throw new Error('CSV must include a header row and at least one member.')
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim())
  const normalizedHeaders = headers.map((header) => header.toLowerCase())
  const missingColumns = REQUIRED_CSV_COLUMNS.filter(
    (column) => !normalizedHeaders.includes(column.toLowerCase())
  )

  if (missingColumns.length > 0) {
    throw new Error(`Missing CSV columns: ${missingColumns.join(', ')}`)
  }

  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line)
    const row = headers.reduce((record, header, headerIndex) => {
      record[header] = values[headerIndex] || ''
      return record
    }, {})
    const role = normalizeRole(row.role) || ROLE_MEMBER
    const email = row.email?.trim().toLowerCase() || ''
    const errors = []

    if (!row.name?.trim()) errors.push('Name is required.')
    if (!isAllowedEmail(email)) errors.push('Email must end in @unc.edu.')

    return {
      rowNumber: index + 2,
      name: row.name?.trim() || '',
      email,
      pledgeClass: row.pledgeClass?.trim() || '',
      family: row.family?.trim() || '',
      role,
      status: row.status?.trim() || 'active',
      accessStatus: 'approved',
      errors,
    }
  })
}

function MemberManagement() {
  const { currentUser } = useAuth()
  const canViewMembers = canViewApprovedMembers(currentUser)
  const canManage = canManageMembers(currentUser)
  const [members, setMembers] = useState([])
  const [checkIns, setCheckIns] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', pledgeClass: '', family: '', role: ROLE_MEMBER })
  const [message, setMessage] = useState(null)
  const [csvRows, setCsvRows] = useState([])
  const [csvFileName, setCsvFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [m, c] = await Promise.all([
          memberService.fetchMembers(),
          fetchCheckIns().catch((error) => {
            console.error('Failed to load check-ins for member points', error)
            return []
          }),
        ])
        setMembers(m)
        setCheckIns(c)
      } catch (err) {
        console.error('Failed to load members', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave(memberId, updates) {
    if (!canManage) return

    try {
      await memberService.updateMember(memberId, updates)
      const m = await memberService.fetchMembers()
      setMembers(m)
      setEditing(null)
      setMessage({ type: 'success', text: 'Member updated.' })
    } catch (err) {
      console.error('Failed to save member', err)
      setMessage({ type: 'error', text: err.message || 'Failed to save member.' })
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.email || !form.name) return
    if (!canManage) return alert('Only super admins can add members')
    if (!isAllowedEmail(form.email)) {
      setMessage({ type: 'error', text: 'Members must use a UNC email ending in @unc.edu.' })
      return
    }

    const email = form.email.trim().toLowerCase()
    try {
      await memberService.createMember(email, {
        name: form.name.trim(),
        email,
        pledgeClass: form.pledgeClass.trim(),
        family: form.family.trim(),
        role: form.role,
        accessStatus: 'approved',
      })
      const m = await memberService.fetchMembers()
      setMembers(m)
      setForm({ name: '', email: '', pledgeClass: '', family: '', role: ROLE_MEMBER })
      setMessage({ type: 'success', text: 'Approved member added.' })
    } catch (err) {
      console.error('Failed to create member', err)
      setMessage({ type: 'error', text: err.message || 'Failed to create member.' })
    }
  }

  async function handleCsvChange(e) {
    const file = e.target.files?.[0]
    setImportResult(null)
    setCsvRows([])
    setCsvFileName(file?.name || '')

    if (!file) return
    if (!canManage) {
      setMessage({ type: 'error', text: 'Only super admins can import members.' })
      return
    }

    try {
      const text = await file.text()
      const rows = parseMemberCsv(text)
      setCsvRows(rows)
      const invalidCount = rows.filter((row) => row.errors.length > 0).length
      setMessage({
        type: invalidCount > 0 ? 'error' : 'success',
        text:
          invalidCount > 0
            ? `${invalidCount} row${invalidCount === 1 ? '' : 's'} need attention before importing.`
            : `Preview ready: ${rows.length} approved member${rows.length === 1 ? '' : 's'} found.`,
      })
    } catch (err) {
      console.error('Failed to parse CSV', err)
      setMessage({ type: 'error', text: err.message || 'Unable to parse CSV.' })
    } finally {
      e.target.value = ''
    }
  }

  async function handleImportCsv() {
    if (!canManage) {
      setMessage({ type: 'error', text: 'Only super admins can import members.' })
      return
    }

    const validRows = csvRows.filter((row) => row.errors.length === 0)
    if (validRows.length === 0) {
      setMessage({ type: 'error', text: 'No valid members to import.' })
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      const result = await memberService.importApprovedMembers(validRows)
      const m = await memberService.fetchMembers()
      setMembers(m)
      setImportResult(result)
      setMessage({
        type: result.errorCount > 0 ? 'error' : 'success',
        text: `Import complete: ${result.successCount} added, ${result.errorCount} failed.`,
      })
    } catch (err) {
      console.error('Failed to import members', err)
      setMessage({ type: 'error', text: err.message || 'Failed to import members.' })
    } finally {
      setImporting(false)
    }
  }

  if (loading) return <div className="page page--loading">Loading members…</div>

  if (!canViewMembers) {
    return (
      <section className="page">
        <div className="empty-state">Only admins can access Member Management.</div>
      </section>
    )
  }

  const invalidCsvRows = csvRows.filter((row) => row.errors.length > 0)
  const validCsvRows = csvRows.filter((row) => row.errors.length === 0)
  const pointTotalsByMember = checkIns.reduce((totals, checkIn) => {
    const memberId = (checkIn.memberEmail || checkIn.memberId || '').trim().toLowerCase()
    if (!memberId) return totals

    totals.set(memberId, (totals.get(memberId) || 0) + Number(checkIn.pointsAwarded ?? 0))
    return totals
  }, new Map())
  const membersWithLivePoints = members.map((member) => {
    const memberId = (member.email || member.id || '').trim().toLowerCase()
    return {
      ...member,
      totalPoints: pointTotalsByMember.get(memberId) || 0,
    }
  })
  const visibleMembers = canManage
    ? membersWithLivePoints
    : membersWithLivePoints.filter((member) => member.accessStatus === 'approved')

  return (
    <section className="page member-management-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Member Management</p>
          <h1>Chapter Members</h1>
          <p className="muted">
            {canManage ? 'Add approved UNC members and manage admin access.' : 'View approved UNC members.'}
          </p>
        </div>
      </div>

      {message && <div className={`checkin-message checkin-message--${message.type}`}>{message.text}</div>}

      <div className="grid grid--cards">
        {canManage && (
          <div className="card member-management-panel">
            <h3>Add approved member</h3>
            <form onSubmit={handleCreate} className="auth-form member-management-form">
              <label>Name<input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} /></label>
              <label>UNC email<input type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} /></label>
              <label>Pledge class
                <select value={form.pledgeClass} onChange={(e) => setForm((s) => ({ ...s, pledgeClass: e.target.value }))}>
                  <option value="">Select class</option>
                  {PLEDGE_CLASSES.map((pledgeClass) => (
                    <option key={pledgeClass} value={pledgeClass}>{pledgeClass}</option>
                  ))}
                </select>
              </label>
              <label>Family
                <select value={form.family} onChange={(e) => setForm((s) => ({ ...s, family: e.target.value }))}>
                  <option value="">Select family</option>
                  {FAMILIES.map((family) => (
                    <option key={family} value={family}>{family}</option>
                  ))}
                </select>
              </label>
              <label>Role
                <select value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}>
                  {MEMBER_ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <Button type="submit">Add approved member</Button>
            </form>
          </div>
        )}

        {canManage && (
          <div className="card member-import-card">
            <h3>Import approved members</h3>
            <p className="muted">Upload a CSV with columns: name, email, pledgeClass, family, role, status.</p>
            <label className="csv-upload">
              <span className="csv-upload__topline">
                <span>CSV file</span>
                <span className="csv-upload__button">Choose file</span>
              </span>
              <input type="file" accept=".csv,text/csv" onChange={handleCsvChange} />
            </label>
            {csvFileName && <p className="muted csv-upload__file">Selected: {csvFileName}</p>}
            {csvRows.length > 0 && (
              <div className="csv-preview">
                <div className="csv-preview__summary">
                  <strong>{validCsvRows.length} valid</strong>
                  <span>{invalidCsvRows.length} need fixes</span>
                </div>
                <div className="csv-preview__table" aria-label="CSV member preview">
                  <div className="csv-preview__row csv-preview__row--header">
                    <span>Name</span>
                    <span>Email</span>
                    <span>Pledge Class</span>
                    <span>Family</span>
                    <span>Role</span>
                    <span>Status</span>
                  </div>
                  {csvRows.slice(0, 8).map((row) => (
                    <div key={`${row.rowNumber}-${row.email}`} className={`csv-preview__row ${row.errors.length > 0 ? 'csv-preview__row--error' : ''}`}>
                      <span>{row.name || 'Missing name'}</span>
                      <span>{row.email || 'Missing email'}</span>
                      <span>{row.pledgeClass || '-'}</span>
                      <span>{row.family || '-'}</span>
                      <span>{row.role}</span>
                      <span>{row.errors.length > 0 ? row.errors.join(' ') : row.status}</span>
                    </div>
                  ))}
                </div>
                {csvRows.length > 8 && <p className="muted">Showing first 8 of {csvRows.length} rows.</p>}
                <Button type="button" onClick={handleImportCsv} disabled={importing || validCsvRows.length === 0}>
                  {importing ? 'Importing...' : `Import ${validCsvRows.length} approved members`}
                </Button>
              </div>
            )}
            {importResult && (
              <div className="csv-import-result">
                <p><strong>{importResult.successCount}</strong> imported successfully.</p>
                <p><strong>{importResult.errorCount}</strong> failed.</p>
                {importResult.errors.length > 0 && (
                  <ul>
                    {importResult.errors.slice(0, 5).map((error) => (
                      <li key={`${error.email}-${error.message}`}>{error.email}: {error.message}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        <div className="card member-management-panel">
          <h3>Members</h3>
          {visibleMembers.length === 0 ? <div className="empty-state">No approved members found.</div> : (
            visibleMembers.map((m) => (
              <div key={m.id} className="member-management-member">
                <MemberCard member={m} />
                {canManage && editing === m.id ? (
                  <form className="member-edit-form" onSubmit={(e) => { e.preventDefault(); handleSave(m.id, { name: m.name, pledgeClass: e.target.pledgeClass.value, family: e.target.family.value, role: e.target.role.value, accessStatus: e.target.accessStatus.value }) }}>
                    <label>Pledge class
                      <select name="pledgeClass" defaultValue={m.pledgeClass || ''}>
                        <option value="">Select class</option>
                        {PLEDGE_CLASSES.map((pledgeClass) => (
                          <option key={pledgeClass} value={pledgeClass}>{pledgeClass}</option>
                        ))}
                      </select>
                    </label>
                    <label>Family
                      <select name="family" defaultValue={m.family || ''}>
                        <option value="">Select family</option>
                        {FAMILIES.map((family) => (
                          <option key={family} value={family}>{family}</option>
                        ))}
                      </select>
                    </label>
                    <label>Role
                      <select name="role" defaultValue={m.role}>
                        {MEMBER_ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                    <label>Access status
                      <select name="accessStatus" defaultValue={m.accessStatus || 'pending'}>
                        <option value="pending">pending</option>
                        <option value="approved">approved</option>
                        <option value="denied">denied</option>
                      </select>
                    </label>
                    <Button type="submit">Save</Button>
                    <Button type="button" onClick={() => setEditing(null)}>Cancel</Button>
                  </form>
                ) : (
                  <div className="member-management-actions">
                    {canManage && <Button onClick={() => setEditing(m.id)}>Edit</Button>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

export default MemberManagement
