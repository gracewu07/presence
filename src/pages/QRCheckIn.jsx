import { useEffect, useRef, useState } from 'react'
import QRCode from 'react-qr-code'
import { Html5Qrcode } from 'html5-qrcode'
import { fetchUpcomingEvents, recordCheckIn, fetchEventById } from '../firebase'
import { useAuth } from '../context/AuthContext'

export default function QRCheckIn() {
  const { currentUser } = useAuth()
  const [events, setEvents] = useState([])
  const [selected, setSelected] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [scanning, setScanning] = useState(false)
  const html5Ref = useRef(null)

  useEffect(() => {
    async function load() {
      const u = await fetchUpcomingEvents()
      setEvents(u)
      if (u.length) setSelected(u[0].id)
    }
    load()
  }, [])

  useEffect(() => {
    return () => {
      if (html5Ref.current) {
        html5Ref.current.stop().catch(() => {})
        html5Ref.current = null
      }
    }
  }, [])

  async function handleStartScan() {
    if (scanning) return
    setScanResult(null)
    const qrRegionId = 'qr-reader'
    const config = { fps: 10, qrbox: 250 }
    const html5QrCode = new Html5Qrcode(qrRegionId)
    html5Ref.current = html5QrCode
    try {
      await html5QrCode.start({ facingMode: 'environment' }, config, async (decodedText) => {
        setScanResult(decodedText)
        setScanning(false)
        try {
          const payload = JSON.parse(decodedText)
          if (payload?.eventId) {
            const ev = await fetchEventById(payload.eventId)
            await recordCheckIn({
              eventId: payload.eventId,
              memberId: currentUser.uid,
              memberName: currentUser.name,
              memberEmail: currentUser.email,
              pointsAwarded: ev?.points || 0,
              locationVerified: false,
            })
          }
        } catch (err) {
          console.error('QR parse or check-in failed', err)
        }
        try {
          await html5QrCode.stop()
        } catch (e) {}
      })
      setScanning(true)
    } catch (err) {
      console.error('Failed to start scanner', err)
    }
  }

  function renderGenerator() {
    const ev = events.find((e) => e.id === selected)
    const value = JSON.stringify({ type: 'event-checkin', eventId: selected, issuedAt: Date.now() })
    return (
      <div>
        <label>
          Event
          <select value={selected} onChange={(e) => setSelected(e.target.value)}>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title} · {ev.eventDate}</option>
            ))}
          </select>
        </label>

        <div style={{ marginTop: 12 }}>
          <QRCode value={value} size={200} />
          <p className="muted">QR contains event id and timestamp. Share with attendees for quick check-in.</p>
        </div>
      </div>
    )
  }

  return (
    <section className="page">
      <div className="page__header">
        <div>
          <p className="eyebrow">QR Check-In</p>
          <h1>QR Code Check-In</h1>
          <p className="muted">Generate QR for events or scan to check in quickly.</p>
        </div>
      </div>

      <div className="grid grid--cards">
        <div className="card">
          <h3>Generate QR</h3>
          {events.length === 0 ? <div className="empty-state">No upcoming events.</div> : renderGenerator()}
        </div>

        <div className="card">
          <h3>Scan QR (member)</h3>
          <div id="qr-reader" style={{ width: '100%' }} />
          <div style={{ marginTop: 8 }}>
            <button onClick={handleStartScan} disabled={scanning}>{scanning ? 'Scanning…' : 'Start scan'}</button>
            {scanResult && <p className="muted">Scanned: {scanResult}</p>}
          </div>
        </div>
      </div>
    </section>
  )
}
