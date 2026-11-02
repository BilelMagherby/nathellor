import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './styles.css'
import { Icon } from './icons.jsx'
import { FoodicsManagement, FoodicsManagementNav, FOODICS_SECTIONS } from './FoodicsManagement.jsx'
const FRONTEND_ONLY =
  import.meta.env.VITE_FRONTEND_ONLY === 'true' ||
  (import.meta.env.DEV && import.meta.env.VITE_FRONTEND_ONLY !== 'false')
const STATUSES = ['To Do', 'In Progress', 'Review', 'Done']
const STATUS_COLORS = { 'To Do': '#94a3b8', 'In Progress': '#3b82f6', Review: '#f59e0b', Done: '#10b981' }
const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent']
const PRIORITY_COLORS = { Low: '#94a3b8', Normal: '#3b82f6', High: '#f59e0b', Urgent: '#ef4444' }
const FRONTEND_REMEMBER_KEY = 'taskflow_demo_remember_until'
const FRONTEND_SESSION_USER_KEY = 'taskflow_demo_session_user'
const ROLE_USERS_KEY = 'taskflow_role_users'
const FRONTEND_REMEMBER_DURATION = 30 * 24 * 60 * 60 * 1000
const rememberFrontendSession = (userId = 'admin') => {
  try {
    localStorage.setItem(FRONTEND_REMEMBER_KEY, String(Date.now() + FRONTEND_REMEMBER_DURATION))
    localStorage.setItem(FRONTEND_SESSION_USER_KEY, userId)
  } catch {}
}
const clearFrontendRememberedSession = () => {
  try {
    localStorage.removeItem(FRONTEND_REMEMBER_KEY)
    localStorage.removeItem(FRONTEND_SESSION_USER_KEY)
  } catch {}
}
const hasFrontendRememberedSession = () => {
  try {
    const expiresAt = Number(localStorage.getItem(FRONTEND_REMEMBER_KEY))
    if (expiresAt > Date.now()) return true
    clearFrontendRememberedSession()
  } catch {}
  return false
}
const DEFAULT_PROJECTS = [
  { id: 'nathilco', name: 'Natheelco', color: '#1e40af', parent: '' },
  { id: 'hajiss', name: 'Hajiss Café', color: '#b45309', parent: 'nathilco' },
  { id: 'odin', name: 'Odun Pide', color: '#7c3aed', parent: 'nathilco' },
  { id: 'ghalia', name: 'Ghalia', color: '#db2777', parent: 'nathilco' },
  { id: 'danny', name: 'Dani Designs', color: '#0891b2', parent: 'nathilco' },
]
const TEAM = [
  ['ابراهيم عبدالكريم موسى الربيعان', 'ir@natheelco.com'],
  ['Natheel Management', 'info@natheelco.com'],
  ['Nourah Alrubaian', 'n.r@natheelco.com'],
  ['Abdulkareem Alrubaian', 'ar@natheelco.com'],
  ['Hajar Hanafi', 'hh@natheelco.com'],
  ['Hamza Tahrir', 'ht@natheelco.com'],
  ['Asma Ghidhaoui', 'asma.g@natheelco.com'],
  ['Hana Alqabaa', ''],
  ['Zineb Bouhoush', 'Zineb.b@natheelco.com'],
  ['Bilel Maghrebi', 'bilel.m@natheelco.com'],
  ['Aziz Latrache', 'Aziz.l@natheelco.com'],
]
const EMAIL_DEFAULTS = Object.fromEntries(TEAM.filter((person) => person[1]))
const DEFAULT_CONFIG = {
  team: TEAM.map((person) => person[0]),
  emails: EMAIL_DEFAULTS,
  ceoEmail: '',
  projects: DEFAULT_PROJECTS,
  w: { ontime: 35, target: 20, overdue: 15, volume: 30 },
  target: 10,
  credit: { name: 'Asma', list: '', tag: '', before: '' },
  logo: '/img/logo.png',
}
const PAGES = [
  ['dash', 'dashboard', 'CEO Dashboard'],
  ['meet', 'google-meet', 'Google Meet'],
  ['zoom', 'zoom', 'Zoom'],
  ['cal', 'calendar-clock', 'Calendar & Reminders'],
  ['kpi', 'analytics', 'KPI Analytics'],
  ['day', 'sun', 'My Day'],
  ['tasks', 'tasks', 'Tasks'],
  ['clickup', 'clickup', 'ClickUp'],
  ['projects', 'projects', 'Projects'],
  ['team', 'team', 'Team & KPIs'],
  ['hr', 'hr', 'HR'],
  ['foodics', 'folder', 'Foodics Management'],
  ['roles', 'roles', 'Roles'],
]
const ROLE_PERMISSION_PAGES = PAGES.filter(([key]) => key !== 'roles')
const ALL_ROLE_PERMISSIONS = [...ROLE_PERMISSION_PAGES.map(([key]) => key), 'gulf']
const ROLE_PERMISSION_LABELS = Object.fromEntries([...ROLE_PERMISSION_PAGES, ['gulf', 'Natheel Gulf']].map(([key, , label]) => [key, label || 'Natheel Gulf']))
const NATHEEL_GULF_SECTIONS = [
  ['hajiss', 'Hajiss cafe Holding Block'],
  ['odin', 'ÖDÜN Pide'],
  ['ghalia', 'Ghalia'],
  ['danny', 'dani Square'],
]
const GULF_PROJECT_NODES = {
  hajiss: 'hajiss-holding',
  odin: 'odun-pide',
  ghalia: 'ghalia',
  danny: 'dani-square',
}
const GULF_INITIAL_NODES = [
  { id: 'natheel-gulf', name: 'Natheel Gulf', parent: null, color: '#d99b18' },
  { id: 'hajiss-holding', name: 'Hajiss Cafe Holding Block', parent: 'natheel-gulf', color: '#b45309' },
  { id: 'hajiss-outlet', name: 'Hajiss Cafe Outlet', parent: 'hajiss-holding', color: '#c2410c' },
  { id: 'hajiss-ecommerce', name: 'Hajiss Ecommerce System', parent: 'hajiss-holding', color: '#ea580c' },
  { id: 'hajiss-supply', name: 'Hajiss Supply Chain Inflow', parent: 'hajiss-holding', color: '#d97706' },
  { id: 'odun-pide', name: 'ÖDÜN Pide', parent: 'natheel-gulf', color: '#7c3aed' },
  { id: 'ghalia', name: 'Ghalia', parent: 'natheel-gulf', color: '#db2777' },
  { id: 'dani-square', name: 'Dani Square', parent: 'natheel-gulf', color: '#0891b2' },
  { id: 'unfiled', name: 'Unfiled files', parent: 'natheel-gulf', color: '#94a3b8' },
]
const GULF_INITIAL_ASSETS = [
  { id: 'gulf-zatca', name: 'التصريح الضريبي لZATCA عن سند صرف منصة ايجار.pdf', description: 'ZATCA IJAR first post', node: 'natheel-gulf', security: 'Internal Only', size: '162 KB', uploadedBy: 'Protected', added: 'Oct 28, 2026', type: 'PDF' },
  { id: 'gulf-crn', name: 'Commercia CRN Natheel.pdf', description: 'Natheel commercial number CRN', node: 'natheel-gulf', security: 'Internal Only', size: '904 KB', uploadedBy: 'Protected', added: 'Oct 28, 2026', type: 'PDF' },
  { id: 'gulf-presentations', name: 'Dani square+ Hajiss Presentations.pdf', description: 'PDF', node: 'natheel-gulf', security: 'Internal Only', size: '2.5 MB', uploadedBy: 'Protected', added: 'Oct 26, 2026', type: 'PDF' },
  { id: 'gulf-dani-presentation', name: 'Dani_Square_Presentation.pdf', description: 'Dani Square presentation', node: 'dani-square', security: 'Internal Only', size: '1.1 MB', uploadedBy: 'Protected', added: 'Oct 26, 2026', type: 'PDF' },
  { id: 'gulf-hajiss-spreadsheet', name: 'SPRHail_Cafes_Influencers_Database.xlsx', description: 'Hajiss Decription for the suppliers', node: 'hajiss-outlet', security: 'Internal Only', size: '32.1 KB', uploadedBy: 'Protected', added: 'Oct 25, 2026', type: 'XLSX' },
  { id: 'gulf-hajiss-suppliers', name: 'هاجس — تعريف للموردينfinal.pdf', description: 'Hajiss supplier information', node: 'hajiss-outlet', security: 'Internal Only', size: '2.9 MB', uploadedBy: 'Protected', added: 'Oct 25, 2026', type: 'PDF' },
  { id: 'gulf-hajiss-data', name: 'SPRHail_Cafes_Influencers_Database.xlsx', description: 'Spreadsheets & data', node: 'hajiss-holding', security: 'Internal Only', size: '32.1 KB', uploadedBy: 'Not recorded', added: 'Oct 25, 2026', type: 'XLSX' },
]

const today = () => new Date().toLocaleDateString('en-CA')
const endOf = (date) => (date ? new Date(`${date}T23:59:59`).getTime() : Infinity)
const isLate = (task) => task.status !== 'Done' && task.due && endOf(task.due) < Date.now()
const normalize = (value) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
const fmtDay = (timestamp, options = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  new Date(timestamp).toLocaleDateString(undefined, options)
const projectName = (projects, id) => projects.find((project) => project.id === id)?.name || id || '—'

async function request(path, init) {
  const base = import.meta.env.VITE_API_BASE_URL || ''
  const response = await fetch(`${base}${path}`, { cache: 'no-store', ...init })
  const body = await response.json().catch(() => ({}))
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('taskflow:locked'))
    throw new Error('Your session expired. Unlock the dashboard and try again.')
  }
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`)
  return body
}

const api = {
  list: (collection) => request(`/api/docs?collection=${encodeURIComponent(collection)}`),
  get: (path) => request(`/api/docs?path=${encodeURIComponent(path)}`),
  put: (path, data) =>
    request('/api/docs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path, data }) }),
  patch: (path, data) =>
    request('/api/docs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, data }),
    }),
  remove: (path) => request(`/api/docs?path=${encodeURIComponent(path)}`, { method: 'DELETE' }),
}

function Avatar({ name, members = [] }) {
  const member = members.find((item) => item.name === name)
  const initials = member?.initials || String(name || '?').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const hue = [...String(name)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360
  return (
    <span className="av" title={name} style={{ background: member?.color || `hsl(${hue} 60% 45%)` }}>
      {member?.avatar ? <img src={member.avatar} alt="" /> : initials}
    </span>
  )
}

function Button({ children, primary = false, className = '', ...props }) {
  return <button className={`btn${primary ? ' p' : ''}${className ? ` ${className}` : ''}`} {...props}>{children}</button>
}

function Field({ label, children }) {
  return <label className="field">{label}{children}</label>
}

function loadRoleUsers() {
  try {
    const stored = localStorage.getItem(ROLE_USERS_KEY)
    const users = stored ? JSON.parse(stored) : []
    if (!Array.isArray(users) || users.some((user) => !user || typeof user.id !== 'string' || typeof user.name !== 'string' || !/^\d{4}$/.test(user.pin) || !Array.isArray(user.permissions))) {
      throw new Error('The saved user list is not valid.')
    }
    return { users, error: '' }
  } catch (error) {
    return { users: [], error: `Could not load saved users: ${error.message}` }
  }
}

function PinGate({ auth, demoPin, roleUsers, onPinCreated, onAuthenticated }) {
  const [pin, setPin] = useState('')
  const [firstPin, setFirstPin] = useState('')
  const [message, setMessage] = useState('')
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const setup = !auth?.configured

  async function submit(event) {
    event.preventDefault()
    if (busy || pin.length < 4) return
    if (setup && !firstPin) {
      setFirstPin(pin)
      setPin('')
      setMessage('Enter the same PIN again to confirm.')
      return
    }
    if (setup && firstPin !== pin) {
      setFirstPin('')
      setPin('')
      setMessage('PINs did not match. Start again.')
      return
    }
    setBusy(true)
    setMessage('Checking…')
    try {
      if (auth.frontendOnly) {
        const stored = demoPin || (typeof window !== 'undefined' ? localStorage.getItem('taskflow_demo_pin') : '') || ''
        const roleUser = pin.length === 4 ? roleUsers.find((user) => user.pin === pin) : null
        if (!setup && roleUser && pin !== stored) {
          if (remember) rememberFrontendSession(roleUser.id)
          else clearFrontendRememberedSession()
          onAuthenticated({
            ...auth,
            authed: true,
            configured: true,
            frontendOnly: true,
            activeUser: { ...roleUser, isAdmin: false },
          })
          return
        }
        if (setup) {
          try { localStorage.setItem('taskflow_demo_pin', pin) } catch {}
          onPinCreated(pin)
          if (remember) rememberFrontendSession()
          else clearFrontendRememberedSession()
          onAuthenticated({ authed: true, configured: true, frontendOnly: true, activeUser: { id: 'admin', name: 'Admin', isAdmin: true } })
        } else if (pin === demoPin || (stored && pin === stored)) {
          if (remember) rememberFrontendSession()
          else clearFrontendRememberedSession()
          onAuthenticated({ ...auth, authed: true, activeUser: { id: 'admin', name: 'Admin', isAdmin: true } })
        } else {
          setMessage('Incorrect PIN.')
        }
        return
      }

      const body = await request('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: setup ? 'setup' : 'login', pin, remember }),
      })
      if (body.ok) onAuthenticated({ authed: true, configured: true })
      else setMessage(body.error || 'Could not unlock dashboard.')
    } catch (error) {
      setMessage(error.message)
      setPin('')
      setFirstPin('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div id="lock">
      <form className="lk" onSubmit={submit}>
        <img src="/img/logo.png" alt="" />
        <h1>Natheelco TaskFlow</h1>
        <p className="mu">{setup ? firstPin ? 'Confirm your new PIN' : 'Create a PIN (4–8 digits) to protect this dashboard' : 'Enter your dashboard PIN or your 4-digit user PIN'}</p>
        <input
          aria-label="PIN"
          autoComplete={setup ? 'new-password' : 'current-password'}
          autoFocus
          inputMode="numeric"
          maxLength={8}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 8))}
          type="password"
          value={pin}
        />
        <div className="pd" aria-hidden="true">{Array.from({ length: Math.max(4, pin.length) }, (_, index) => <i className={index < pin.length ? 'f' : ''} key={index} />)}</div>
        <div className="lkm" role="status">{message}</div>
        <div className="kp">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
            <button key={number} onClick={() => setPin((current) => (current + number).slice(0, 8))} type="button">{number}</button>
          ))}
          <button className="x" onClick={() => setPin('')} type="button">Clear</button>
          <button onClick={() => setPin((current) => (current + '0').slice(0, 8))} type="button">0</button>
          <button className="x" onClick={() => setPin((current) => current.slice(0, -1))} type="button">⌫</button>
        </div>
        <label className="mu remember"><input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" /> Remember this device for 30 days</label>
        {auth.frontendOnly && roleUsers.length > 0 && <p className="pin-user-hint">{roleUsers.length} user PIN{roleUsers.length === 1 ? '' : 's'} available</p>}
        {!auth.frontendOnly && <p className="pin-user-hint">User PIN login requires backend authentication support.</p>}
        <Button disabled={busy || pin.length < 4} primary type="submit">{busy ? 'Please wait…' : setup ? 'Continue' : 'Unlock'}</Button>
      </form>
    </div>
  )
}

function TaskForm({ projects, people, initial = {}, onSave, onClose }) {
  const [task, setTask] = useState({
    title: initial.title || '',
    project: initial.project || 'hajiss',
    assignee: initial.assignee || '',
    due: initial.due || today(),
    priority: initial.priority || 'Normal',
    note: initial.note || '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <div className="react-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="mdl" onSubmit={async (event) => {
        event.preventDefault()
        if (busy) return
        if (!task.title.trim()) return setError('Enter a task title.')
        setBusy(true)
        setError('')
        try { await onSave(task) } catch (cause) { setError(cause.message) } finally { setBusy(false) }
      }}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon-badge"><Icon name="tasks" size={20} /></span>
            <h2>{initial.title ? 'Edit task' : 'New task'}</h2>
          </div>
          <button aria-label="Close" className="btn-icon-close" onClick={onClose} type="button">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="f2">
          <Field label="Task title"><input autoFocus onChange={(event) => setTask({ ...task, title: event.target.value })} value={task.title} /></Field>
          <Field label="Project"><select onChange={(event) => setTask({ ...task, project: event.target.value })} value={task.project}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></Field>
          <Field label="Assignee"><select onChange={(event) => setTask({ ...task, assignee: event.target.value })} value={task.assignee}><option value="">Unassigned</option>{people.filter((person) => person !== 'CEO').map((person) => <option key={person}>{person}</option>)}</select></Field>
          <Field label="Due date"><input onChange={(event) => setTask({ ...task, due: event.target.value })} type="date" value={task.due} /></Field>
          <Field label="Priority"><select onChange={(event) => setTask({ ...task, priority: event.target.value })} value={task.priority}>{PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}</select></Field>
          <Field label="Notes"><input onChange={(event) => setTask({ ...task, note: event.target.value })} value={task.note} /></Field>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="row sp" style={{ justifyContent: 'flex-end' }}><Button disabled={busy} onClick={onClose} type="button">Cancel</Button><Button disabled={busy} primary type="submit">{busy ? 'Saving…' : 'Save task'}</Button></div>
      </form>
    </div>
  )
}

function MeetingForm({ projects, people, platform, onSave, onClose }) {
  const isGoogle = platform === 'google'
  const initialStart = new Date(Date.now() + 30 * 60_000)
  initialStart.setMinutes(initialStart.getMinutes() < 30 ? 30 : 0, 0, 0)
  if (initialStart.getMinutes() === 0) initialStart.setHours(initialStart.getHours() + 1)
  const [form, setForm] = useState({
    platform,
    title: '',
    project: 'nathilco',
    start: new Date(initialStart.getTime() - initialStart.getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
    duration: 30,
    reminder: 30,
    attendees: [],
    agenda: '',
    instant: false,
  })
  const [attendee, setAttendee] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const addAttendee = () => {
    const email = attendee.trim()
    if (!email || form.attendees.includes(email)) return
    update('attendees', [...form.attendees, email])
    setAttendee('')
  }
  return (
    <div className="react-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="mdl meeting-form-modal" onSubmit={async (event) => {
        event.preventDefault()
        if (busy) return
        setBusy(true)
        setError('')
        try {
          await onSave({ ...form, start: form.instant ? Date.now() : new Date(form.start).getTime() })
        } catch (cause) { setError(cause.message) } finally { setBusy(false) }
      }}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon-badge">
              <Icon name={isGoogle ? 'google-meet' : 'zoom'} size={24} />
            </span>
            <div>
              <h2>{form.instant ? 'Start instant' : 'Schedule'} {isGoogle ? 'Google Meet' : 'Zoom'}</h2>
              <div className="mu">Set up meeting details, duration, and invitations</div>
            </div>
          </div>
          <button aria-label="Close" className="btn-icon-close" onClick={onClose} type="button">
            <Icon name="close" size={18} />
          </button>
        </div>
        <Field label={<span><Icon name="video" size={13} /> Meeting title</span>}>
          <input autoFocus onChange={(event) => update('title', event.target.value)} placeholder="e.g. Weekly Operations Sync" required value={form.title} />
        </Field>
        <div className="f2">
          <Field label={<span><Icon name="folder" size={13} /> Project</span>}>
            <select onChange={(event) => update('project', event.target.value)} value={form.project}>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </Field>
          <Field label={<span><Icon name="calendar" size={13} /> Start time</span>}>
            <input disabled={form.instant} onChange={(event) => update('start', event.target.value)} type="datetime-local" value={form.start} />
          </Field>
          <Field label={<span><Icon name="clock" size={13} /> Duration (minutes)</span>}>
            <input min="5" max="600" onChange={(event) => update('duration', +event.target.value)} type="number" value={form.duration} />
          </Field>
          <Field label={<span><Icon name="bell" size={13} /> Reminder (minutes before)</span>}>
            <input min="0" max="10080" onChange={(event) => update('reminder', +event.target.value)} type="number" value={form.reminder} />
          </Field>
        </div>
        <Field label={<span><Icon name="file-text" size={13} /> Agenda / Objective</span>}>
          <textarea onChange={(event) => update('agenda', event.target.value)} placeholder="Key topics and goals..." rows="3" value={form.agenda} />
        </Field>
        <Field label={<span><Icon name="user-plus" size={13} /> Add attendee email</span>}>
          <div className="row input-with-button">
            <input onChange={(event) => setAttendee(event.target.value)} onKeyDown={(event) => {
              if (event.key === 'Enter') { event.preventDefault(); addAttendee() }
            }} placeholder="colleague@example.com" type="email" value={attendee} />
            <Button disabled={!attendee.trim() || form.attendees.includes(attendee.trim())} onClick={addAttendee} type="button">
              <Icon name="plus" size={14} /> Add
            </Button>
          </div>
        </Field>
        <div className="row sp attendees-pills">
          {form.attendees.map((email) => (
            <span className="pill pill-attendee" key={email}>
              <Icon name="user" size={12} /> {email}
              <button aria-label={`Remove ${email}`} className="inline-remove" onClick={() => update('attendees', form.attendees.filter((item) => item !== email))} type="button">
                <Icon name="close" size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="row sp">
          <label className="chk">
            <input checked={form.instant} onChange={(event) => update('instant', event.target.checked)} type="checkbox" />
            <Icon name="video-instant" size={14} /> Start instantly right now
          </label>
        </div>
        {error && <p className="error"><Icon name="alert-circle" size={14} /> {error}</p>}
        <div className="row sp modal-footer-actions">
          <Button disabled={busy} onClick={onClose} type="button">Cancel</Button>
          <Button disabled={busy} primary type="submit">
            {busy ? 'Saving…' : form.instant ? <><Icon name="video-instant" size={15} /> Start meeting</> : <><Icon name="calendar-plus" size={15} /> Schedule meeting</>}
          </Button>
        </div>
      </form>
    </div>
  )
}

function ImportForm({ people, projects, onClose, onImport }) {
  const [rows, setRows] = useState(null)
  const [columns, setColumns] = useState({})
  const [fileName, setFileName] = useState('')
  const [pasted, setPasted] = useState('')
  const [assignee, setAssignee] = useState('')
  const [project, setProject] = useState(projects[0]?.id || 'nathilco')
  const [allDone, setAllDone] = useState(true)
  const [oneAssignee, setOneAssignee] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fields = [
    ['title', 'Task title', /task|title|name|job|subject|tache|mission|activity|description/],
    ['status', 'Status', /status|state|statut|etat|progress|done/],
    ['due', 'Due date', /due|deadline|echeance|limite|target date/],
    ['done', 'Completed on', /complet|done date|finish|closed|end|fin|delivered|date/],
    ['assignee', 'Done by', /assign|owner|responsib|by|who|person|employee|staff|member|resp/],
    ['project', 'Project / brand', /project|projet|brand|client|company|categor|list|department|business/],
    ['priority', 'Priority', /priorit|urgenc|importance/],
    ['note', 'Notes', /note|comment|remark|detail/],
  ]
  const parseDelimited = (text) => {
    const header = (text.replace(/^\uFEFF/, '').split(/\r?\n/)[0] || '')
    const delimiter = ['\t', ';', ','].sort((a, b) => header.split(b).length - header.split(a).length)[0]
    const result = []
    let row = []; let cell = ''; let quoted = false
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index]
      if (quoted) {
        if (char === '"' && text[index + 1] === '"') { cell += '"'; index += 1 }
        else if (char === '"') quoted = false
        else cell += char
      } else if (char === '"' && !cell) quoted = true
      else if (char === delimiter) { row.push(cell); cell = '' }
      else if (char === '\n' || char === '\r') {
        if (char === '\r' && text[index + 1] === '\n') index += 1
        row.push(cell); result.push(row); row = []; cell = ''
      } else cell += char
    }
    if (cell || row.length) { row.push(cell); result.push(row) }
    return result.filter((item) => item.some((value) => String(value).trim()))
  }
  const setData = (data, name) => {
    const header = data[0] || []
    const used = new Set()
    const guesses = {}
    fields.forEach(([key, , pattern]) => {
      const found = header.findIndex((value, index) => !used.has(index) && pattern.test(normalize(value)))
      guesses[key] = found
      if (found >= 0) used.add(found)
    })
    if (guesses.title < 0) guesses.title = 0
    setRows(data); setColumns(guesses); setFileName(name)
  }
  const selectedRows = useMemo(() => {
    if (!rows) return []
    const asDate = (value) => {
      if (!value) return ''
      const text = String(value).trim()
      if (/^\d{5}(\.\d+)?$/.test(text)) return new Date(Date.UTC(1899, 11, 30) + +text * 86_400_000).toISOString().slice(0, 10)
      const match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
      if (match) return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
      const parsed = new Date(text)
      return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('en-CA')
    }
    return rows.slice(1).map((row) => {
      const value = (key) => columns[key] >= 0 ? row[columns[key]] : ''
      const title = String(value('title') || '').trim()
      const done = allDone || /done|complete|closed|finished|yes|oui|true|100/i.test(String(value('status')))
      return {
        title,
        status: done ? 'Done' : 'To Do',
        due: asDate(value('due')),
        doneAt: asDate(value('done')) ? new Date(asDate(value('done'))).getTime() : 0,
        assignee: oneAssignee ? assignee : String(value('assignee') || '').trim(),
        project: String(value('project') || project).trim(),
        priority: String(value('priority') || 'Normal'),
        note: String(value('note') || ''),
      }
    }).filter((item) => item.title)
  }, [allDone, assignee, columns, oneAssignee, project, rows])
  async function readFile(file) {
    try {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (['xlsx', 'xlsm', 'xls', 'ods'].includes(extension)) {
        if (!window.XLSX) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'
            script.onload = resolve
            script.onerror = () => reject(new Error('Could not load Excel reader. Export the sheet as CSV instead.'))
            document.head.appendChild(script)
          })
        }
        const workbook = window.XLSX.read(await file.arrayBuffer(), { cellDates: true })
        const data = workbook.SheetNames.flatMap((name, index) => {
          const sheetRows = window.XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, raw: true, defval: '' })
            .filter((row) => row.some((value) => String(value).trim()))
          return index && String(sheetRows[0]) === String(rows?.[0]) ? sheetRows.slice(1) : sheetRows
        })
        setData(data, file.name)
      } else setData(parseDelimited(await file.text()), file.name)
    } catch (cause) { setError(cause.message) }
  }
  return (
    <div className="react-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="mdl">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon-badge"><Icon name="upload" size={20} /></span>
            <h2>Import past work</h2>
          </div>
          <button aria-label="Close" className="btn-icon-close" onClick={onClose} type="button">
            <Icon name="close" size={18} />
          </button>
        </div>
        <p className="mu">Upload CSV, TSV, Excel, or OpenDocument files—or paste rows copied from a spreadsheet, including the header row.</p>
        <Field label="Choose spreadsheet"><input accept=".csv,.tsv,.txt,.xlsx,.xls,.xlsm,.ods" onChange={(event) => event.target.files?.[0] && readFile(event.target.files[0])} type="file" /></Field>
        <Field label="Or paste spreadsheet rows"><textarea onChange={(event) => setPasted(event.target.value)} rows="4" value={pasted} /></Field>
        <Button onClick={() => setData(parseDelimited(pasted), 'pasted rows')} type="button">Read pasted rows</Button>
        {rows && <>
          <p className="sp"><b>{rows.length - 1} row(s) found.</b> Map the spreadsheet columns:</p>
          <div className="f2">{fields.map(([key, label]) => <Field key={key} label={label}><select onChange={(event) => setColumns({ ...columns, [key]: +event.target.value })} value={columns[key] ?? -1}><option value={-1}>—</option>{(rows[0] || []).map((name, index) => <option key={index} value={index}>{String(name || `Column ${index + 1}`)}</option>)}</select></Field>)}</div>
          <div className="f2 sp">
            <Field label="Credit all tasks to"><input list="import-people" onChange={(event) => setAssignee(event.target.value)} value={assignee} /><datalist id="import-people">{people.map((person) => <option key={person}>{person}</option>)}</datalist></Field>
            <Field label="Default project"><select onChange={(event) => setProject(event.target.value)} value={project}>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
          </div>
          <div className="row sp"><label className="chk"><input checked={allDone} onChange={(event) => setAllDone(event.target.checked)} type="checkbox" /> Count every row as completed</label><label className="chk"><input checked={oneAssignee} onChange={(event) => setOneAssignee(event.target.checked)} type="checkbox" /> Credit all rows to one person</label></div>
          <div aria-label="Spreadsheet preview. Scroll horizontally to view all columns" className="scroll sp" role="region" tabIndex={0}><table><thead><tr>{fields.slice(0, 6).map(([, label]) => <th key={label}>{label}</th>)}</tr></thead><tbody>{selectedRows.slice(0, 6).map((item, index) => <tr key={index}><td>{item.title}</td><td>{item.status}</td><td>{item.due || '—'}</td><td>{item.doneAt ? new Date(item.doneAt).toLocaleDateString() : '—'}</td><td>{item.assignee || '—'}</td><td>{projectName(projects, item.project)}</td></tr>)}</tbody></table></div>
          <div className="row sp" style={{ justifyContent: 'flex-end' }}><Button disabled={busy} onClick={onClose} type="button">Cancel</Button><Button disabled={busy || !selectedRows.length} onClick={async () => {
            setBusy(true); setError('')
            try { await onImport(selectedRows, fileName); onClose() } catch (cause) { setError(cause.message) } finally { setBusy(false) }
          }} primary type="button">{busy ? 'Importing…' : `Import ${selectedRows.length} task(s)`}</Button></div>
        </>}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  )
}

function RolesPage({ users, error, masterPin, onSaveUsers }) {
  const [editingId, setEditingId] = useState('')
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [permissions, setPermissions] = useState([])
  const [formError, setFormError] = useState('')

  function resetForm() {
    setEditingId('')
    setName('')
    setPin('')
    setPermissions([])
    setFormError('')
  }

  function editUser(user) {
    setEditingId(user.id)
    setName(user.name)
    setPin('')
    setPermissions(user.permissions.filter((permission) => ALL_ROLE_PERMISSIONS.includes(permission)))
    setFormError('')
  }

  function submit(event) {
    event.preventDefault()
    const cleanName = name.trim()
    const existing = users.find((user) => user.id === editingId)
    const nextPin = pin || existing?.pin || ''
    if (!cleanName) return setFormError('Enter the user’s name.')
    if (!/^\d{4}$/.test(nextPin)) return setFormError('The PIN must be exactly 4 digits.')
    if (masterPin && nextPin === masterPin) return setFormError('Choose a PIN different from the dashboard admin PIN.')
    if (users.some((user) => user.id !== editingId && user.pin === nextPin)) return setFormError('Each user must have a unique PIN.')

    const user = {
      id: existing?.id || globalThis.crypto?.randomUUID?.() || `user-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: cleanName,
      pin: nextPin,
      permissions: ALL_ROLE_PERMISSIONS.filter((permission) => permissions.includes(permission)),
    }
    const nextUsers = existing
      ? users.map((item) => item.id === existing.id ? user : item)
      : [...users, user]
    if (onSaveUsers(nextUsers)) resetForm()
  }

  function removeUser(user) {
    if (!window.confirm(`Remove ${user.name} and their dashboard access?`)) return
    onSaveUsers(users.filter((item) => item.id !== user.id))
    if (editingId === user.id) resetForm()
  }

  return (
    <section className="roles-page">
      <header className="top">
        <div><h1><Icon name="roles" size={23} /> Roles &amp; permissions</h1><p className="mu">Create user PINs and choose which dashboard sections each person can open.</p></div>
      </header>
      <div className="roles-notice"><Icon name="info" size={17} /><span>Users and permissions are saved in this browser. Individual PIN login is available in frontend-only mode; the connected backend currently supports the dashboard admin PIN only.</span></div>
      {error && <div className="roles-error" role="alert">{error}</div>}
      <div className="roles-layout">
        <form className="card roles-form" onSubmit={submit}>
          <div className="roles-form-heading"><span className="roles-form-icon"><Icon name={editingId ? 'edit' : 'user-plus'} size={18} /></span><div><h2>{editingId ? 'Edit user' : 'Add a user'}</h2><p className="mu">{editingId ? 'Update access or set a new PIN.' : 'Give a user a unique 4-digit login PIN.'}</p></div></div>
          <Field label="User name"><input autoComplete="off" maxLength={70} onChange={(event) => setName(event.target.value)} placeholder="e.g. Hajar Hanafi" required value={name} /></Field>
          <Field label={editingId ? 'New 4-digit PIN (leave blank to keep current)' : '4-digit PIN'}>
            <input autoComplete="new-password" inputMode="numeric" maxLength={4} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" required={!editingId} type="password" value={pin} />
          </Field>
          <fieldset className="roles-permissions">
            <legend>Dashboard sections</legend>
            <div className="roles-permission-grid">
              {ALL_ROLE_PERMISSIONS.map((permission) => (
                <label className="roles-permission-option" key={permission}>
                  <input checked={permissions.includes(permission)} onChange={(event) => setPermissions((current) => event.target.checked ? [...current, permission] : current.filter((value) => value !== permission))} type="checkbox" />
                  <span>{ROLE_PERMISSION_LABELS[permission]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {formError && <p className="roles-error" role="alert">{formError}</p>}
          <div className="roles-form-actions">
            {editingId && <Button onClick={resetForm} type="button">Cancel</Button>}
            <Button primary type="submit"><Icon name={editingId ? 'check' : 'user-plus'} size={15} /> {editingId ? 'Save changes' : 'Add user'}</Button>
          </div>
        </form>

        <section aria-label="Dashboard users" className="card roles-list">
          <div className="roles-list-heading"><div><h2>Users</h2><p className="mu">{users.length} user{users.length === 1 ? '' : 's'} with PIN access</p></div><span className="roles-count">{users.length}</span></div>
          {users.length ? <div className="roles-user-list">{users.map((user) => {
            const userPermissions = user.permissions.filter((permission) => ALL_ROLE_PERMISSIONS.includes(permission))
            return (
              <article className="roles-user" key={user.id}>
                <div className="roles-user-avatar"><Icon name="user" size={19} /></div>
                <div className="roles-user-main">
                  <div className="roles-user-heading"><strong>{user.name}</strong><span className="roles-pin" aria-label="PIN saved">••••</span></div>
                  <div className="roles-user-permissions">{userPermissions.length ? userPermissions.map((permission) => <span className="roles-tag" key={permission}>{ROLE_PERMISSION_LABELS[permission]}</span>) : <span className="roles-no-access">No sections assigned</span>}</div>
                </div>
                <div className="roles-user-actions">
                  <button aria-label={`Edit ${user.name}`} className="roles-icon-button" onClick={() => editUser(user)} title="Edit permissions" type="button"><Icon name="edit" size={15} /></button>
                  <button aria-label={`Remove ${user.name}`} className="roles-icon-button danger" onClick={() => removeUser(user)} title="Remove user" type="button"><Icon name="trash" size={15} /></button>
                </div>
              </article>
            )
          })}</div> : <div className="roles-empty"><span><Icon name="users" size={23} /></span><b>No users added yet</b><p>Add a user and assign their dashboard sections.</p></div>}
        </section>
      </div>
    </section>
  )
}

export function App() {
  const [auth, setAuth] = useState(null)
  const [roleStore, setRoleStore] = useState(loadRoleUsers)
  const roleUsers = roleStore.users
  const [demoPin, setDemoPin] = useState(() => {
    try { return localStorage.getItem('taskflow_demo_pin') || '' } catch { return '' }
  })
  const [page, setPage] = useState('dash')
  const [foodicsSection, setFoodicsSection] = useState('reports')
  const [foodicsNavOpen, setFoodicsNavOpen] = useState(true)
  const [natheelGulfOpen, setNatheelGulfOpen] = useState(false)
  const [gulfActiveSection, setGulfActiveSection] = useState('files')
  const [gulfNodes, setGulfNodes] = useState(GULF_INITIAL_NODES)
  const [gulfAssets, setGulfAssets] = useState(GULF_INITIAL_ASSETS)
  const [gulfSelectedNode, setGulfSelectedNode] = useState('natheel-gulf')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [tasks, setTasks] = useState([])
  const [history, setHistory] = useState([])
  const [meetings, setMeetings] = useState([])
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [clickup, setClickup] = useState({ configured: false, tasks: [], members: [], workspaces: [], spaces: [] })
  const [integrations, setIntegrations] = useState({ google: false, zoom: false, timezone: 'Asia/Riyadh' })
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ project: '', assignee: '', status: '', search: '', space: '', closed: true })
  const [taskDialog, setTaskDialog] = useState(false)
  const [meetingDialog, setMeetingDialog] = useState('')
  const [importDialog, setImportDialog] = useState(false)
  const [meetingDetail, setMeetingDetail] = useState(null)
  const [newEmployee, setNewEmployee] = useState('')
  const [newProject, setNewProject] = useState('')
  const [newColor, setNewColor] = useState('#2563eb')
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [calendarEventDetail, setCalendarEventDetail] = useState(null)
  const [calendarPerson, setCalendarPerson] = useState(() => {
    try { return localStorage.getItem('who') || '' } catch { return '' }
  })
  const [reminders, setReminders] = useState([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [clickupStatus, setClickupStatus] = useState('Connecting…')
  const [lastSync, setLastSync] = useState(0)
  const [taskMode, setTaskMode] = useState('list')
  const [minutesBusy, setMinutesBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const configDraftDirty = useRef(false)

  const showError = useCallback((message) => {
    setError(message)
    setToast('')
  }, [])
  const showToast = useCallback((message) => {
    setToast(message)
    setError('')
    window.setTimeout(() => setToast(''), 4500)
  }, [])

  const refresh = useCallback(async () => {
    const [taskRows, historyRows, meetingRows, configRow] = await Promise.all([
      api.list('tasks'), api.list('history'), api.list('meetings'), api.get('config/main'),
    ])
    setTasks(taskRows.map((row) => ({ id: row.id, ...row.data })))
    setHistory(historyRows.map((row) => ({ id: row.id, ...row.data })))
    setMeetings(meetingRows.map((row) => ({ id: row.id, ...row.data })))
    if (!configDraftDirty.current) {
      const data = configRow.exists ? configRow.data : {}
      setConfig({
        ...DEFAULT_CONFIG, ...data,
        w: { ...DEFAULT_CONFIG.w, ...(data.w || {}) },
        credit: { ...DEFAULT_CONFIG.credit, ...(data.credit || {}) },
        emails: { ...EMAIL_DEFAULTS, ...(data.emails || {}) },
        projects: data.projects || DEFAULT_PROJECTS,
        team: data.team || DEFAULT_CONFIG.team,
      })
    }
  }, [])

  const syncClickup = useCallback(async (force = false) => {
    try {
      setClickupStatus('Syncing…')
      const data = await request(`/api/clickup${force ? '?force=1' : ''}`)
      setClickup(data)
      setClickupStatus(data.configured ? `${data.tasks?.length || 0} tasks • live` : 'Not connected')
      setLastSync(Date.now())
      return data
    } catch (cause) {
      setClickupStatus(`ClickUp: ${cause.message}`)
      return null
    }
  }, [])

  useEffect(() => {
    let active = true
    const savedPin = typeof window !== 'undefined' ? localStorage.getItem('taskflow_demo_pin') : null
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem(FRONTEND_SESSION_USER_KEY) || 'admin' : 'admin'
    const rememberedUser = savedUserId === 'admin'
      ? { id: 'admin', name: 'Admin', isAdmin: true }
      : roleUsers.find((user) => user.id === savedUserId)
    const hasRememberedSession = hasFrontendRememberedSession()
    const remembered = Boolean(savedPin && rememberedUser && hasRememberedSession)
    if (savedPin && !rememberedUser && hasRememberedSession) clearFrontendRememberedSession()
    if (FRONTEND_ONLY) {
      setAuth({ configured: Boolean(savedPin), authed: remembered, frontendOnly: true, activeUser: rememberedUser })
    } else {
      request('/api/auth')
        .then((data) => { if (active) setAuth(data) })
        .catch((cause) => {
          if (active) {
            console.warn('Backend API unavailable, falling back to frontend-only mode:', cause.message)
            setAuth({ configured: Boolean(savedPin), authed: remembered, frontendOnly: true, activeUser: rememberedUser })
          }
        })
    }
    const lockHandler = () => {
      clearFrontendRememberedSession()
      setAuth((current) => ({ ...current, authed: false }))
    }
    window.addEventListener('taskflow:locked', lockHandler)
    return () => { active = false; window.removeEventListener('taskflow:locked', lockHandler) }
  }, [showError])

  function saveRoleUsers(users) {
    try {
      localStorage.setItem(ROLE_USERS_KEY, JSON.stringify(users))
      setRoleStore({ users, error: '' })
      return true
    } catch (cause) {
      setRoleStore((current) => ({ ...current, error: `Could not save users: ${cause.message}` }))
      return false
    }
  }

  useEffect(() => {
    if (!auth?.authed || auth.frontendOnly) return undefined
    let active = true
    const load = async () => {
      try { await refresh() } catch (cause) { if (active) showError(cause.message) }
    }
    const loadIntegrations = async () => {
      try { const data = await request('/api/meetings'); if (active) setIntegrations(data) } catch (cause) { if (active) showError(cause.message) }
    }
    load()
    loadIntegrations()
    syncClickup()
    const poll = window.setInterval(load, 5000)
    const sync = window.setInterval(() => { if (!document.hidden) syncClickup() }, 30000)
    return () => { active = false; window.clearInterval(poll); window.clearInterval(sync) }
  }, [auth?.authed, auth?.frontendOnly, refresh, showError, syncClickup])

  useEffect(() => {
    const user = auth?.activeUser
    if (!auth?.authed || !user || user.isAdmin || user.permissions?.includes(page)) return
    setPage(user.permissions?.find((permission) => ALL_ROLE_PERMISSIONS.includes(permission)) || 'dash')
  }, [auth?.activeUser, auth?.authed, page])

  const projects = useMemo(() => {
    const configured = config.projects || DEFAULT_PROJECTS
    const known = new Set(configured.map((project) => project.id))
    const extras = [...new Set([...tasks, ...history].map((task) => task.project).filter((id) => id && !known.has(id)))]
      .map((id) => ({ id, name: id, color: '#64748b', parent: 'nathilco' }))
    return [...configured, ...extras]
  }, [config.projects, tasks, history])

  const cuTasks = useMemo(() => (clickup.tasks || []).map((task) => {
    const status = String(task.status || '').toLowerCase()
    const type = task.status_type || ''
    const done = type === 'done' || type === 'closed' || (!type && /complete|closed|done/.test(status))
    return {
      id: `cu:${task.id}`, externalId: task.id, url: task.url, title: task.name,
      project: task.list?.name || 'ClickUp',
      assignee: task.assignees?.[0]?.username || '',
      assignees: (task.assignees || []).map((person) => person.username),
      status: done ? 'Done' : type === 'open' || status === 'to do' || status === 'open' ? 'To Do' : /review|approv|qa/.test(status) ? 'Review' : 'In Progress',
      rawStatus: task.status || '', statusColor: task.status_color,
      due: task.due_date ? new Date(+task.due_date).toLocaleDateString('en-CA') : '',
      priority: task.priority ? task.priority[0].toUpperCase() + task.priority.slice(1) : 'Normal',
      tags: (task.tags || []).map((tag) => tag.name),
      doneAt: task.date_closed ? +task.date_closed : 0,
      space: task.space?.name || '', folder: task.folder?.name || '', list: task.list?.name || '',
      created: task.date_created ? +task.date_created : 0,
      updated: task.date_updated ? +task.date_updated : 0,
      parent: task.parent || '', demo: false, source: 'clickup',
    }
  }), [clickup.tasks])

  const historicalTasks = useMemo(() => {
    const used = new Set()
    const normalizedHistory = new Map()
    history.forEach((item) => {
      const key = normalize(item.title)
      if (key && !normalizedHistory.has(key)) normalizedHistory.set(key, item)
    })
    const credited = cuTasks.map((task) => {
      const imported = normalizedHistory.get(normalize(task.title))
      const rule = config.credit || {}
      const matchesRule = (rule.list && [task.list, task.folder, task.space].some((value) => normalize(value) === normalize(rule.list)))
        || (rule.tag && task.tags.some((tag) => normalize(tag) === normalize(rule.tag)))
        || (rule.before && task.created && task.created <= endOf(rule.before))
      if (!imported && !(config.credit?.name && matchesRule)) return task
      if (imported) used.add(normalize(task.title))
      const owner = imported?.assignee || config.credit?.name || ''
      return {
        ...task, assignee: owner, assignees: owner ? [owner] : [],
        status: imported?.status === 'Done' ? 'Done' : task.status,
        doneAt: imported?.doneAt || task.doneAt, due: task.due || imported?.due || '',
        credited: true, imported,
      }
    })
    const importedRows = history.filter((item) => !used.has(normalize(item.title))).map((item) => ({
      id: `history:${item.id}`, title: item.title, project: item.project || 'nathilco',
      assignee: item.assignee || '', assignees: item.assignee ? [item.assignee] : [],
      status: item.status || 'Done', priority: item.priority || 'Normal',
      due: item.due || '', doneAt: item.doneAt || 0, note: item.note || '',
      hist: true, tags: ['Google Sheets'], source: 'history',
    }))
    return [...credited, ...tasks.map((task) => ({ ...task, assignees: task.assignee ? [task.assignee] : [], source: 'taskflow' })), ...importedRows]
  }, [config.credit, cuTasks, history, tasks])

  const demoTasks = useMemo(() => {
    if (cuTasks.length || tasks.length || history.length) return []
    const data = [
      ['Launch autumn menu photos', 'hajiss', 'Done', 'High', -6],
      ['Barista training schedule', 'hajiss', 'Done', 'Normal', -3],
      ['Fix POS receipt printer', 'hajiss', 'In Progress', 'Urgent', -2],
      ['Weekly supplier order', 'hajiss', 'To Do', 'Normal', 0],
      ['Instagram reels – October', 'hajiss', 'Review', 'High', 1],
      ['Oven maintenance visit', 'odin', 'Done', 'High', -9],
      ['New pide recipe costing', 'odin', 'In Progress', 'Normal', 3],
      ['Delivery app menu update', 'odin', 'To Do', 'High', -1],
      ['Staff rota November', 'odin', 'Done', 'Normal', -4],
      ['Ghalia lookbook shoot', 'ghalia', 'In Progress', 'Urgent', 2],
      ['Website product upload', 'ghalia', 'Done', 'Normal', -2],
      ['Influencer outreach list', 'ghalia', 'To Do', 'Low', 6],
      ['Client logo – Al Noor', 'danny', 'Review', 'High', 0],
      ['Brand guideline PDF', 'danny', 'Done', 'Normal', -12],
      ['Packaging mockups', 'danny', 'To Do', 'Normal', 8],
      ['Quarterly KPI review', 'nathilco', 'To Do', 'Urgent', 4],
      ['Budget approval Q4', 'nathilco', 'Done', 'High', -15],
      ['Hire part-time cashier', 'nathilco', 'In Progress', 'Normal', 5],
    ]
    return data.map(([title, project, status, priority, offset], index) => {
      const due = new Date(); due.setDate(due.getDate() + offset)
      return {
        id: `demo${index}`, title, project, status, priority,
        assignee: '', assignees: [], due: due.toLocaleDateString('en-CA'),
        doneAt: status === 'Done' ? Date.now() - Math.abs(offset || 1) * 86_400_000 : 0,
        demo: true, tags: [],
      }
    })
  }, [cuTasks.length, tasks.length, history.length])

  const allTasks = historicalTasks.length ? historicalTasks : demoTasks
  const people = useMemo(() => [...new Set(['CEO', ...(config.team || []), ...(clickup.members || []).map((person) => person.name), ...allTasks.flatMap((task) => task.assignees || [])])], [allTasks, clickup.members, config.team])
  const projectScope = useCallback((projectId, source = allTasks) => source.filter((task) => {
    if (!projectId) return true
    let taskProject = projects.find((item) => item.id === task.project)
    while (taskProject) {
      if (taskProject.id === projectId) return true
      taskProject = projects.find((item) => item.id === taskProject.parent)
    }
    return task.project === projectId
  }), [allTasks, projects])
  const scopedTasks = useMemo(() => projectScope(filters.project).filter((task) => {
    const matchesPerson = !filters.assignee || (task.assignees || [task.assignee]).includes(filters.assignee)
    const matchesStatus = !filters.status || (filters.status === 'Overdue' ? isLate(task) : task.status === filters.status)
    return matchesPerson && matchesStatus
  }), [filters.assignee, filters.project, filters.status, projectScope])
  const kpiRows = useMemo(() => {
    const staff = people.filter((person) => person !== 'CEO')
    const busiest = Math.max(1, ...staff.map((person) => scopedTasks.filter((task) => (task.assignees || [task.assignee]).includes(person)).length))
    return staff.map((name) => {
      const owned = scopedTasks.filter((task) => (task.assignees || [task.assignee]).includes(name))
      const completed = owned.filter((task) => task.status === 'Done')
      const onTime = completed.filter((task) => !task.due || task.doneAt <= endOf(task.due)).length
      const overdue = owned.filter(isLate).length
      const weights = config.w || DEFAULT_CONFIG.w
      const metrics = {
        ontime: completed.length ? (onTime / completed.length) * 100 : owned.length ? 0 : 100,
        target: Math.min(completed.length / Math.max(1, config.target || 1), 1) * 100,
        overdue: owned.length ? (1 - overdue / owned.length) * 100 : 100,
        volume: (owned.length / busiest) * 100,
      }
      const weightTotal = Object.values(weights).reduce((sum, value) => sum + (+value || 0), 0) || 1
      const score = owned.length ? Object.keys(metrics).reduce((sum, key) => sum + metrics[key] * (+weights[key] || 0), 0) / weightTotal : 0
      return { name, total: owned.length, done: completed.length, open: owned.length - completed.length, overdue, onTime, score, tasks: owned }
    }).sort((a, b) => b.score - a.score || b.total - a.total)
  }, [config.target, config.w, people, scopedTasks])

  const saveConfig = useCallback(async (updated) => {
    await api.put('config/main', updated)
    configDraftDirty.current = false
    setConfig(updated)
  }, [])
  const updateConfigDraft = useCallback((update) => {
    configDraftDirty.current = true
    setConfig(update)
  }, [])

  const saveTask = async (data, id = `t${Date.now()}`) => {
    await api.put(`tasks/${id}`, {
      ...data, status: data.status || 'To Do', created: data.created || Date.now(),
      doneAt: data.status === 'Done' ? Date.now() : data.doneAt || 0,
    })
    setTaskDialog(false)
    await refresh()
    showToast('Task saved.')
  }

  const visibleClickup = useMemo(() => cuTasks.filter((task) =>
    (!filters.space || task.space === filters.space)
    && (!filters.assignee || task.assignees.includes(filters.assignee))
    && (filters.closed || !['closed', 'done'].includes((clickup.tasks?.find((item) => item.id === task.externalId)?.status_type || '').toLowerCase()))
    && (!filters.search || task.title.toLowerCase().includes(filters.search.toLowerCase())),
  ), [clickup.tasks, cuTasks, filters.assignee, filters.closed, filters.search, filters.space])

  async function syncClickupNow() {
    const data = await syncClickup(true)
    if (!data) showError('ClickUp sync failed. Check the connection and server configuration.')
    else if (!data.configured) showError('ClickUp is not connected. Add CLICKUP_API_TOKEN to the server environment.')
    else showToast('ClickUp sync complete.')
  }

  async function createMeeting(data) {
    const result = await request('/api/meetings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    setMeetingDialog('')
    await refresh()
    setMeetingDetail(result.meeting)
    if (result.warning) showError(result.warning)
    else showToast('Meeting saved.')
  }

  async function saveMeeting(meeting, patch = {}) {
    try {
      const updated = { ...meeting, ...patch }
      await api.patch(`meetings/${meeting.id}`, {
        notes: updated.notes || '', summary: updated.summary || '',
        decisions: updated.decisions || [], actions: updated.actions || [],
        status: updated.status || 'scheduled',
      })
      setMeetingDetail(updated)
      await refresh()
      showToast(updated.status === 'cancelled' ? 'Meeting cancelled.' : 'Meeting saved.')
    } catch (cause) {
      showError(cause.message)
    }
  }

  async function generateMinutes(meeting) {
    setMinutesBusy(true)
    try {
      const result = await request('/api/summarize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: meeting.title, attendees: meeting.attendees, notes: meeting.notes }),
      })
      setMeetingDetail({
        ...meeting, summary: result.summary || meeting.summary,
        decisions: [...(meeting.decisions || []), ...(result.decisions || [])],
        actions: [...(meeting.actions || []), ...(result.actions || [])],
      })
      showToast('Minutes drafted. Review and save.')
    } catch (cause) { showError(cause.message) } finally { setMinutesBusy(false) }
  }

  async function importHistory(items, source) {
    const unique = new Map()
    items.forEach((item) => {
      const id = [...`${normalize(item.title)}|${item.due}`].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7).toString(36)
      unique.set(id, { id, data: { ...item, imported: Date.now(), source } })
    })
    const records = [...unique.values()]
    for (let index = 0; index < records.length; index += 500) {
      await request('/api/docs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection: 'history', items: records.slice(index, index + 500) }),
      })
    }
    if (items[0]?.assignee && !config.credit?.name) {
      const updated = { ...config, credit: { ...config.credit, name: items[0].assignee } }
      await saveConfig(updated)
    }
    await refresh()
    showToast(`Imported ${records.length} task(s).`)
  }

  const realMeetings = useMemo(() => [...meetings].sort((a, b) => a.start - b.start), [meetings])
  const sampleMeetings = useMemo(() => {
    if (realMeetings.length) return []
    const week = new Date(); week.setDate(week.getDate() - ((week.getDay() + 6) % 7))
    return [
      { id: 'demo-meet-1', demo: true, platform: 'google', title: 'Weekly leadership sync', project: 'nathilco', start: week.getTime() + 2 * 86_400_000, duration: 45, reminder: 30, status: 'scheduled', attendees: [], joinUrl: 'https://meet.google.com/new', summary: '', notes: '', decisions: [], actions: [] },
      { id: 'demo-meet-2', demo: true, platform: 'zoom', title: 'Investor update call', project: 'nathilco', start: week.getTime() + 8 * 86_400_000, duration: 60, reminder: 30, status: 'scheduled', attendees: [], joinUrl: 'https://zoom.us/start/videomeeting', summary: '', notes: '', decisions: [], actions: [] },
    ]
  }, [realMeetings])
  const allMeetings = realMeetings.length ? realMeetings : sampleMeetings

  useEffect(() => {
    if (!auth?.authed || auth.frontendOnly) return undefined
    const tick = () => {
      const seen = new Set(JSON.parse(localStorage.getItem('rem') || '[]'))
      const now = Date.now()
      const due = realMeetings.filter((meeting) => !seen.has(meeting.id) && meeting.status === 'scheduled'
        && meeting.start - (meeting.reminder ?? 30) * 60_000 <= now && meeting.start > now - 60_000)
      if (!due.length) return
      due.forEach((meeting) => seen.add(meeting.id))
      localStorage.setItem('rem', JSON.stringify([...seen].slice(-500)))
      setReminders((current) => [...due, ...current])
    }
    const interval = window.setInterval(tick, 30_000)
    return () => window.clearInterval(interval)
  }, [auth?.authed, auth?.frontendOnly, realMeetings])

  if (!auth) return <div id="lock"><div className="lk">Connecting to TaskFlow…</div></div>
  if (!auth.authed) return <PinGate auth={auth} demoPin={demoPin} roleUsers={roleUsers} onPinCreated={setDemoPin} onAuthenticated={(session) => {
    setAuth(session)
    const permissions = session.activeUser?.permissions || []
    setPage(session.activeUser?.isAdmin ? 'dash' : permissions[0] || 'dash')
  }} />

  const activeUser = auth.activeUser || { id: 'admin', name: 'Admin', isAdmin: true }
  const canAccessPage = (pageKey) => activeUser.isAdmin || (pageKey === 'gulf'
    ? activeUser.permissions?.includes('gulf')
    : pageKey !== 'roles' && activeUser.permissions?.includes(pageKey))
  const visiblePages = PAGES.filter(([key]) => key !== 'foodics' && canAccessPage(key))
  const selectedProject = projects.find((project) => project.id === filters.project)
  const filteredClickup = visibleClickup
  const pageTitle = page === 'gulf' ? 'Natheel Gulf' : page === 'foodics'
    ? `Foodics Management · ${FOODICS_SECTIONS.find((section) => section.id === foodicsSection)?.shortLabel || 'Reports'}`
    : PAGES.find((item) => item[0] === page)?.[2] || 'CEO Dashboard'

  function Dashboard() {
    const completed = scopedTasks.filter((task) => task.status === 'Done')
    const overdue = scopedTasks.filter(isLate)
    const onTime = completed.filter((task) => !task.due || task.doneAt <= endOf(task.due))
    const isWithinSelectedProject = (projectId) => {
      let project = projects.find((item) => item.id === projectId)
      while (project) {
        if (project.id === filters.project) return true
        project = projects.find((item) => item.id === project.parent)
      }
      return false
    }
    const projectsSummary = projects.filter((item) => item.parent && (!filters.project || isWithinSelectedProject(item.id))).map((item) => {
      const work = projectScope(item.id)
      return { ...item, tasks: work.length, done: work.filter((task) => task.status === 'Done').length }
    })
    const visibleKpiRows = filters.project ? kpiRows.filter((row) => row.total > 0) : kpiRows
    const dashboardMeetings = filters.project ? allMeetings.filter((meeting) => projectScope(filters.project, [meeting]).length > 0) : allMeetings
    return <>
      <header className="top dashboard-top"><div><h1>CEO Dashboard</h1><div className="mu">{selectedProject ? `Live view for ${selectedProject.name}` : 'Live view of every project and employee'} • {new Date().toDateString()}</div></div><div className="row"><ProjectSelect value={filters.project} projects={projects} onChange={(value) => setFilters((current) => ({ ...current, project: value }))} /><NotificationButton count={reminders.length} onClick={() => setNotificationsOpen(!notificationsOpen)} /></div></header>
      <FilterChips filters={filters} setFilters={setFilters} projects={projects} />
      {overdue.length > 0 && <button className="alert" onClick={() => setFilters({ ...filters, status: filters.status === 'Overdue' ? '' : 'Overdue' })}><span className="alert-icon"><Icon name="alert-triangle" size={18} /></span><span className="alert-text"><b>{overdue.length} overdue task(s)</b> — {overdue.slice(0, 4).map((task) => task.title).join(' | ')}</span></button>}
      <div className="grid k4 dashboard-kpis">
        <Metric label="Tasks managed" value={scopedTasks.length} detail={`${scopedTasks.length - completed.length} open`} />
        <Metric label="Completed" value={completed.length} detail={`${scopedTasks.length ? Math.round(completed.length / scopedTasks.length * 100) : 0}% of tasks`} />
        <Metric label="On-time rate" value={`${completed.length ? Math.round(onTime.length / completed.length * 100) : 0}%`} detail={`${onTime.length} of ${completed.length} done`} />
        <Metric label="Overdue" value={overdue.length} detail={overdue.length ? 'Needs attention' : 'All on track'} />
        <Metric label="Team KPI score" value={Math.round(visibleKpiRows.reduce((sum, row) => sum + row.score, 0) / (visibleKpiRows.length || 1))} detail={`${visibleKpiRows.length} employee(s)`} />
      </div>
      <div className="grid k2 sp">
        <div className="card"><h2>Status breakdown</h2>{STATUSES.map((status) => {
          const count = scopedTasks.filter((task) => task.status === status).length
          return <button className="status-line" key={status} onClick={() => setFilters({ ...filters, status: filters.status === status ? '' : status })}><span className="dot" style={{ background: STATUS_COLORS[status] }} />{status}<b>{count}</b><div className="bar"><i style={{ width: `${scopedTasks.length ? count / scopedTasks.length * 100 : 0}%`, background: STATUS_COLORS[status] }} /></div></button>
        })}</div>
        <div className="card"><h2>Progress by project</h2>{projectsSummary.map((project) => <button className="project-progress" key={project.id} onClick={() => setFilters({ ...filters, project: filters.project === project.id ? '' : project.id })}><span>{project.name}</span><b>{project.done}/{project.tasks}</b><div className="bar"><i style={{ width: `${project.tasks ? project.done / project.tasks * 100 : 0}%`, background: project.color }} /></div></button>)}</div>
      </div>
      <div className="card sp"><h2>Employee KPI scorecard</h2>{visibleKpiRows.length ? <KpiTable rows={visibleKpiRows} members={clickup.members} onSelect={(name) => setFilters((current) => ({ ...current, assignee: current.assignee === name ? '' : name }))} /> : <p className="mu">No employee task data for {selectedProject?.name || 'this project'} yet.</p>}</div>
      <div className="card sp"><div className="row" style={{ justifyContent: 'space-between' }}><h2>Recently updated tasks</h2><Button onClick={() => setPage('tasks')}><Icon name="arrow-right" size={14} /> Open Tasks</Button></div><TaskTable tasks={[...scopedTasks].sort((a, b) => (b.updated || b.doneAt || 0) - (a.updated || a.doneAt || 0)).slice(0, 10)} projects={projects} members={clickup.members} onUpdate={updateTask} onRemove={removeTask} /></div>
      <MeetingSummary meetings={dashboardMeetings} projects={projects} onOpen={setMeetingDetail} onCreate={() => setMeetingDialog('google')} onStart={startMeeting} />
    </>
  }

  async function updateTask(task, patch) {
    try {
      await api.patch(`tasks/${task.id}`, patch)
      await refresh()
      showToast('Task updated.')
    } catch (cause) {
      showError(cause.message)
    }
  }
  async function removeTask(task) {
    const message = task.hist ? `Remove imported task "${task.title}"?` : `Delete "${task.title}"?`
    if (!window.confirm(message)) return
    try {
      await api.remove(task.hist ? `history/${task.id.replace(/^history:/, '')}` : `tasks/${task.id}`)
      await refresh()
      showToast(task.hist ? 'Imported task removed.' : 'Task deleted.')
    } catch (cause) {
      showError(cause.message)
    }
  }
  async function startMeeting(platform) {
    const meetingWindow = window.open('about:blank', '_blank')
    if (!meetingWindow) {
      showError('Allow pop-ups for this site to open the meeting.')
      return
    }
    let meetingCreated = false
    try {
      const result = await request('/api/meetings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, instant: true, start: Date.now(), title: `${platform === 'google' ? 'Google Meet' : 'Zoom'} meeting`, project: filters.project || 'nathilco' }),
      })
      meetingCreated = true
      meetingWindow.opener = null
      meetingWindow.location.href = result.meeting.joinUrl
      try {
        await refresh()
      } catch (cause) {
        showError(`Meeting started, but the dashboard could not refresh: ${cause.message}`)
        return
      }
      if (result.warning) showError(result.warning)
      else showToast('Meeting started.')
    } catch (cause) {
      if (!meetingCreated) meetingWindow.close()
      showError(cause.message)
    }
  }

  async function changePin() {
    const current = window.prompt('Current PIN')
    if (current === null) return
    const next = window.prompt('New PIN (4–8 digits)')
    if (next === null) return
    if (auth?.frontendOnly) {
      if (!/^\d{4,8}$/.test(next)) {
        showError('PIN must be 4–8 digits.')
        return
      }
      if (roleUsers.some((user) => user.pin === next)) {
        showError('The admin PIN must be different from every user PIN.')
        return
      }
      const stored = demoPin || (typeof window !== 'undefined' && localStorage.getItem('taskflow_demo_pin')) || ''
      if (stored && current !== stored) {
        showError('Current PIN is incorrect.')
        return
      }
      setDemoPin(next)
      try { localStorage.setItem('taskflow_demo_pin', next) } catch {}
      showToast('PIN changed.')
      return
    }
    try {
      await request('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'change', current, pin: next }) })
      showToast('PIN changed.')
    } catch (cause) { showError(cause.message) }
  }

  function MainPage() {
    if (!canAccessPage(page)) return <section className="card roles-access-denied"><span><Icon name="lock" size={20} /></span><h1>Access not assigned</h1><p className="mu">Your account doesn’t have permission to open this dashboard section.</p></section>
    if (page === 'dash') return Dashboard()
    if (page === 'roles') return <RolesPage error={roleStore.error} masterPin={demoPin} onSaveUsers={saveRoleUsers} users={roleUsers} />
    if (page === 'gulf') return <GulfAssetPage activeSection={gulfActiveSection} assets={gulfAssets} config={config} nodes={gulfNodes} onLock={logout} onToast={showToast} selectedNode={gulfSelectedNode} setActiveSection={setGulfActiveSection} setAssets={setGulfAssets} setNodes={setGulfNodes} setSelectedNode={setGulfSelectedNode} />
    if (page === 'foodics') return <FoodicsManagement activeSection={foodicsSection} />
    if (page === 'tasks' || page === 'day') {
      const mine = page === 'day'
      const visible = (mine ? allTasks.filter((task) => task.status !== 'Done' && (!calendarPerson || calendarPerson === 'CEO' || (task.assignees || []).includes(calendarPerson))) : scopedTasks)
        .filter((task) => !mine || !calendarPerson || calendarPerson === 'CEO' || !filters.assignee || (task.assignees || []).includes(filters.assignee))
      const groups = mine ? [
        ['Overdue', visible.filter(isLate)],
        ['Due today', visible.filter((task) => task.due === today())],
        ['In progress', visible.filter((task) => task.status === 'In Progress' && !isLate(task) && task.due !== today())],
        ['Upcoming', visible.filter((task) => task.status === 'To Do' && task.due > today())],
      ] : STATUSES.map((status) => [status, visible.filter((task) => task.status === status)])
      return <>
        <header className="top"><div><h1>{mine ? 'My Day' : selectedProject?.name || 'All tasks'}</h1><div className="mu">{visible.length} task(s)</div></div><div className="row">{mine && <select onChange={(event) => { setCalendarPerson(event.target.value); localStorage.setItem('who', event.target.value) }} value={calendarPerson}><option value="">Who are you?</option>{people.map((person) => <option key={person}>{person}</option>)}</select>}{!mine && <><ProjectSelect projects={projects} value={filters.project} onChange={(value) => setFilters({ ...filters, project: value })} /><PersonSelect people={people} value={filters.assignee} onChange={(value) => setFilters({ ...filters, assignee: value })} /><Button onClick={() => setTaskMode(taskMode === 'list' ? 'board' : 'list')}>{taskMode === 'list' ? 'Board view' : 'List view'}</Button></>}<Button onClick={() => setTaskDialog(true)} primary>+ New task</Button></div></header>
        {mine && !calendarPerson && <div className="card">Select your name to see your daily task list.</div>}
        {mine && calendarPerson && <div className="card"><b>Good day, {calendarPerson}.</b> You have <b className={groups[0][1].length ? 'late' : ''}>{groups[0][1].length} overdue</b> and <b>{groups[1][1].length} due today</b>.</div>}
        {taskMode === 'board' && !mine ? <div className="board">{groups.map(([label, items]) => <section className="col" key={label}><h3>{label} <span className="mu">{items.length}</span></h3>{items.map((task) => <TaskCard key={task.id} task={task} projects={projects} members={clickup.members} onUpdate={updateTask} onRemove={removeTask} />)}</section>)}</div> : groups.map(([label, items]) => <section className="card sp" key={label}><h2>{label} <span className="mu">{items.length}</span></h2><TaskTable tasks={items} projects={projects} members={clickup.members} onUpdate={updateTask} onRemove={removeTask} /></section>)}
      </>
    }
    if (page === 'clickup') return <ClickupPage tasks={filteredClickup} config={clickup} status={clickupStatus} lastSync={lastSync} filters={filters} setFilters={setFilters} members={clickup.members || []} onSync={syncClickupNow} />
    if (page === 'projects') return <ProjectsPage projects={projects} tasks={allTasks} onSave={saveConfig} config={config} newProject={newProject} setNewProject={setNewProject} newColor={newColor} setNewColor={setNewColor} onError={showError} />
    if (page === 'team') return <TeamPage config={config} setConfig={updateConfigDraft} saveConfig={saveConfig} people={people} kpis={kpiRows} history={history} onImport={() => setImportDialog(true)} onRemoveHistory={removeHistory} onChangePin={changePin} onLogo={uploadLogo} onError={showError} onSuccess={showToast} onSelectEmployee={(name) => { setFilters((current) => ({ ...current, assignee: current.assignee === name ? '' : name })); setPage('tasks') }} />
    if (page === 'hr') return <HumanResourcesPage />
    if (page === 'kpi') return <AnalyticsPage tasks={scopedTasks} rows={kpiRows} projects={projects} filters={filters} setFilters={setFilters} people={people} members={clickup.members} config={config} onUpdate={updateTask} onRemove={removeTask} onSelectEmployee={(name) => setFilters((current) => ({ ...current, assignee: current.assignee === name ? '' : name }))} />
    if (page === 'meet' || page === 'zoom') return <MeetingsPage platform={page === 'meet' ? 'google' : 'zoom'} meetings={allMeetings.filter((meeting) => meeting.platform === (page === 'meet' ? 'google' : 'zoom'))} integration={integrations} projects={projects} onOpen={setMeetingDetail} onSchedule={() => setMeetingDialog(page === 'meet' ? 'google' : 'zoom')} onStart={startMeeting} />
    return <CalendarPage date={calendarDate} setDate={setCalendarDate} meetings={allMeetings} tasks={allTasks} onOpen={(event) => setCalendarEventDetail(event)} onSchedule={() => setMeetingDialog('google')} />
  }

  async function removeHistory() {
    if (!window.confirm(`Remove all ${history.length} imported rows? ClickUp tasks are not affected.`)) return
    await request('/api/docs?collection=history', { method: 'DELETE' })
    await refresh()
    showToast('Imported rows removed.')
  }
  async function uploadLogo(file) {
    const formData = new FormData()
    formData.append('file', file)
    const result = await request('/api/upload', { method: 'POST', body: formData })
    await saveConfig({ ...config, logo: result.url })
    showToast('Logo uploaded.')
  }
  async function logout() {
    if (auth.frontendOnly) {
      clearFrontendRememberedSession()
      setAuth({ ...auth, authed: false })
      return
    }
    try {
      await request('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) })
      clearFrontendRememberedSession()
      setAuth({ ...auth, authed: false })
    } catch (cause) {
      showError(cause.message)
    }
  }

  return (
    <>
      <header className="mobile-header">
        <div className="mobile-header-brand">
          {config.logo ? <img src={config.logo} alt="" className="mobile-logo-img" /> : <div className="mobile-logo">N</div>}
          <div className="mobile-header-titles">
            <span className="mobile-title">Natheelco</span>
            <span className="mobile-subtitle">{pageTitle}</span>
          </div>
        </div>
        <div className="mobile-header-actions">
          <NotificationButton count={reminders.length} onClick={() => setNotificationsOpen((current) => !current)} />
          <button
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="btn g mobile-menu-btn"
            onClick={() => setMobileMenuOpen((open) => !open)}
            type="button"
          >
            <Icon name={mobileMenuOpen ? 'close' : 'menu'} size={20} />
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="mobile-header-brand">
                {config.logo ? <img src={config.logo} alt="" className="mobile-logo-img" /> : <div className="mobile-logo">N</div>}
                <div>
                  <b>Natheelco TaskFlow</b>
                  <div className="mu">Menu & navigation</div>
                </div>
              </div>
              <button aria-label="Close menu" className="btn-icon-close" onClick={() => setMobileMenuOpen(false)} type="button">
                <Icon name="close" size={20} />
              </button>
            </div>
            <nav className="mobile-drawer-nav">
              {visiblePages.map(([key, icon, label]) => (
                <button
                  className={`mobile-drawer-item nav-item nav-${key}${page === key ? ' on' : ''}`}
                  key={key}
                  onClick={() => { setPage(key); setMobileMenuOpen(false) }}
                  type="button"
                >
                  <span className="drawer-icon"><Icon name={icon} size={20} /></span>
                  <span className="drawer-label">{label}</span>
                  {page === key && <span className="drawer-active-dot" />}
                </button>
              ))}
              {canAccessPage('gulf') && <NatheelGulfNav
                filters={filters}
                id="natheel-gulf-mobile-sections"
                mobile
                onSelect={(projectId) => {
                  setGulfSelectedNode(GULF_PROJECT_NODES[projectId] || 'natheel-gulf')
                  setGulfActiveSection('files')
                  setPage('gulf')
                  setMobileMenuOpen(false)
                }}
                onSelectRoot={() => { setGulfSelectedNode('natheel-gulf'); setGulfActiveSection('files'); setPage('gulf'); setNatheelGulfOpen(true); setMobileMenuOpen(false) }}
                onToggle={() => setNatheelGulfOpen((open) => !open)}
                open={natheelGulfOpen}
                page={page}
                projects={projects}
                selectedNode={gulfSelectedNode}
              />}
              {canAccessPage('foodics') && <FoodicsManagementNav
                activeSection={foodicsSection}
                mobile
                onSelect={(section) => { setFoodicsSection(section); setPage('foodics'); setMobileMenuOpen(false) }}
                onToggle={() => setFoodicsNavOpen((open) => !open)}
                open={foodicsNavOpen}
                page={page}
              />}
              <button
                className="mobile-drawer-item nav-item nav-lock lkb"
                onClick={() => { setMobileMenuOpen(false); logout() }}
                type="button"
              >
                <span className="drawer-icon"><Icon name="lock" size={20} /></span>
                <span className="drawer-label">Lock Dashboard</span>
              </button>
            </nav>
            {canAccessPage('tasks') && <div className="mobile-drawer-projects">
              <h4>Filter Tasks by Project</h4>
              <div className="mobile-projects-grid">
                {projects.map((project) => (
                  <button
                    className={`mobile-project-chip ${filters.project === project.id && page === 'tasks' ? 'on' : ''}`}
                    key={project.id}
                    onClick={() => {
                      setFilters({ ...filters, project: project.id })
                      setPage('tasks')
                      setMobileMenuOpen(false)
                    }}
                    type="button"
                  >
                    <span className="dot" style={{ background: project.color }} />
                    <span>{project.name}</span>
                  </button>
                ))}
              </div>
            </div>}
          </div>
        </div>
      )}

      <div className="app">
        <aside>
          <div className="brand">{config.logo ? <img src={config.logo} alt="" /> : <div className="logo">N</div>}<span>Natheelco<br /><span className="mu">TaskFlow</span></span></div>
          <nav aria-label="Main navigation" className="primary-nav">
            {visiblePages.map(([key, icon, label]) => (
              <button className={`nav-item nav-${key}${page === key ? ' on' : ''}`} key={key} onClick={() => setPage(key)} type="button">
                <span className="nav-icon"><Icon name={icon} size={16} /></span>
                <span className="nav-label">{label}</span>
              </button>
            ))}
            {canAccessPage('gulf') && <NatheelGulfNav
              filters={filters}
              id="natheel-gulf-desktop-sections"
              onSelect={(projectId) => {
                setGulfSelectedNode(GULF_PROJECT_NODES[projectId] || 'natheel-gulf')
                setGulfActiveSection('files')
                setPage('gulf')
              }}
              onSelectRoot={() => { setGulfSelectedNode('natheel-gulf'); setGulfActiveSection('files'); setPage('gulf'); setNatheelGulfOpen(true) }}
              onToggle={() => setNatheelGulfOpen((open) => !open)}
              open={natheelGulfOpen}
              page={page}
              projects={projects}
              selectedNode={gulfSelectedNode}
            />}
            {canAccessPage('foodics') && <FoodicsManagementNav
              activeSection={foodicsSection}
              onSelect={(section) => { setFoodicsSection(section); setPage('foodics') }}
              onToggle={() => setFoodicsNavOpen((open) => !open)}
              open={foodicsNavOpen}
              page={page}
            />}
            <button className="nav-item nav-lock lkb" onClick={logout} type="button">
              <span className="nav-icon"><Icon name="lock" size={16} /></span>
              <span className="nav-label">Lock</span>
            </button>
          </nav>
          <div className="sidebar-extra">
            {canAccessPage('clickup') && <>
              <div className="sidebar-section-head">
                <h4>ClickUp</h4>
                <button className="sidebar-sync-btn" onClick={syncClickupNow} title="Sync ClickUp now" type="button"><Icon name="sync" size={11} /> Sync</button>
              </div>
              <div className="sidebar-meta">{clickupStatus}{lastSync ? <> • {Math.max(1, Math.round((Date.now() - lastSync) / 60_000))}m ago</> : null}</div>
              {(clickup.workspaces || []).map((workspace) => <a className="ws" href={workspace.url} key={workspace.id} rel="noreferrer" target="_blank" title={'Open ' + workspace.name + ' in ClickUp'}><Icon name="external-link" size={11} /> {workspace.name}</a>)}
            </>}
            {canAccessPage('tasks') && <>
              <h4>Projects</h4>
              <div className="sidebar-projects-list">
                {projects.map((project) => (
                  <button className={filters.project === project.id && page === 'tasks' ? 'on project-btn' : 'project-btn'} key={project.id} onClick={() => { setFilters({ ...filters, project: project.id }); setPage('tasks') }} type="button">
                    <span className="dot" style={{ background: project.color }} />
                    <span className="project-btn-label">{project.name}</span>
                  </button>
                ))}
              </div>
            </>}
          </div>
        </aside>
        <main>
          {auth.frontendOnly && <div className="card sp alert-banner" role="status"><Icon name="alert-circle" size={16} /> <span>Frontend-only preview: PINs and section permissions are stored in this browser and do not secure API or dashboard data.</span></div>}
          {error && <div className="toast err react-toast" role="alert"><Icon name="alert-triangle" size={16} /> {error}<button aria-label="Close" onClick={() => setError('')} type="button"><Icon name="close" size={14} /></button></div>}
          {toast && <div className="toast react-toast" role="status"><Icon name="check-circle" size={16} /> {toast}</div>}
          {notificationsOpen && <div className="card notifications"><div className="row" style={{ justifyContent: 'space-between' }}><b><Icon name="bell" size={15} /> Reminders</b><button className="btn g" onClick={() => { setReminders([]); setNotificationsOpen(false) }}>Close</button></div>{reminders.length ? reminders.map((meeting) => <button className="notification-item" key={meeting.id} onClick={() => { setMeetingDetail(meeting); setNotificationsOpen(false) }}><span className="notif-dot" /><b>{meeting.title}</b> • <span className="mu">{fmtDay(meeting.start)}</span></button>) : <p className="mu empty-hint">No new reminders.</p>}</div>}
          {MainPage()}
        </main>
      </div>

      <nav aria-label="Mobile Bottom Navigation" className="mobile-bottom-bar">
        {canAccessPage('dash') && <button
          className={`mobile-tab-btn nav-item nav-dash ${page === 'dash' ? 'on' : ''}`}
          onClick={() => { setPage('dash'); setMobileMenuOpen(false); }}
          type="button"
        >
          <Icon name="dashboard" size={20} />
          <span>Dashboard</span>
        </button>}
        {canAccessPage('tasks') && <button
          className={`mobile-tab-btn nav-item nav-tasks ${page === 'tasks' ? 'on' : ''}`}
          onClick={() => { setPage('tasks'); setMobileMenuOpen(false); }}
          type="button"
        >
          <Icon name="tasks" size={20} />
          <span>Tasks</span>
        </button>}
        {(canAccessPage('meet') || canAccessPage('zoom')) && <button
          className={`mobile-tab-btn nav-item nav-meet ${page === 'meet' || page === 'zoom' ? 'on' : ''}`}
          onClick={() => { setPage(canAccessPage('meet') ? 'meet' : 'zoom'); setMobileMenuOpen(false); }}
          type="button"
        >
          <Icon name="video" size={20} />
          <span>Meetings</span>
        </button>}
        {canAccessPage('cal') && <button
          className={`mobile-tab-btn nav-item nav-cal ${page === 'cal' ? 'on' : ''}`}
          onClick={() => { setPage('cal'); setMobileMenuOpen(false); }}
          type="button"
        >
          <Icon name="calendar-clock" size={20} />
          <span>Calendar</span>
        </button>}
        <button
          className={`mobile-tab-btn ${mobileMenuOpen ? 'on' : ''}`}
          onClick={() => setMobileMenuOpen((open) => !open)}
          type="button"
        >
          <Icon name={mobileMenuOpen ? 'close' : 'menu'} size={20} />
          <span>Menu</span>
        </button>
      </nav>
      {taskDialog && <TaskForm onClose={() => setTaskDialog(false)} onSave={(data) => saveTask(data)} people={people} projects={projects} />}
      {meetingDialog && <MeetingForm onClose={() => setMeetingDialog('')} onSave={createMeeting} people={people} platform={meetingDialog} projects={projects} />}
      {importDialog && <ImportForm onClose={() => setImportDialog(false)} onImport={importHistory} people={people} projects={projects} />}
      {calendarEventDetail && <CalendarEventDetail event={calendarEventDetail} projects={projects} onClose={() => setCalendarEventDetail(null)} onOpenMeeting={(meeting) => { setCalendarEventDetail(null); setMeetingDetail(meeting) }} />}
      {meetingDetail && <MeetingDetail meeting={meetingDetail} members={clickup.members} projects={projects} busy={minutesBusy} onClose={() => setMeetingDetail(null)} onSave={saveMeeting} onSummarize={generateMinutes} onCreateTask={async (action) => {
        try {
          await saveTask({ title: action.text, assignee: action.owner || '', due: action.due || '', project: meetingDetail.project || 'nathilco', priority: 'Normal', note: `From meeting: ${meetingDetail.title}`, status: 'To Do' })
          setMeetingDetail(null)
        } catch (cause) {
          showError(cause.message)
        }
      }} />}
    </>
  )
}

function Metric({ label, value, detail, icon, variant }) {
  let iconName = icon
  let type = variant

  if (!iconName) {
    const l = (label || '').toLowerCase()
    if (l.includes('task') && l.includes('manage')) iconName = 'tasks'
    else if (l.includes('completed') || l.includes('completion')) iconName = 'check-circle'
    else if (l.includes('on-time')) iconName = 'percent'
    else if (l.includes('overdue')) iconName = 'alert-triangle'
    else if (l.includes('kpi') || l.includes('score')) iconName = 'trophy'
    else if (l.includes('meeting')) iconName = 'video'
    else if (l.includes('upcoming')) iconName = 'calendar-clock'
    else if (l.includes('decision')) iconName = 'decision'
    else if (l.includes('minute') || l.includes('awaiting')) iconName = 'file-text'
    else iconName = 'chart'
  }

  if (!type) {
    const l = (label || '').toLowerCase()
    const d = (detail || '').toLowerCase()
    if (l.includes('overdue') && (value > 0 || (typeof value === 'string' && value !== '0'))) type = 'danger'
    else if (l.includes('overdue') && (value === 0 || value === '0')) type = 'success'
    else if (l.includes('on-time') || l.includes('completed') || l.includes('completion')) type = 'success'
    else if (l.includes('kpi') || l.includes('score')) type = 'accent'
    else if (d.includes('attention')) type = 'danger'
    else type = 'neutral'
  }

  return (
    <div className={`card kc kpi-card kpi-${type}`}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className="kpi-icon-wrap">
          <Icon name={iconName} size={18} />
        </span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-footer">
        <span className="kpi-detail">{detail}</span>
      </div>
    </div>
  )
}

function ProjectSelect({ projects, value, onChange }) {
  return <select aria-label="Filter by project" onChange={(event) => onChange(event.target.value)} value={value}><option value="">All projects (Natheelco)</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
}

function PersonSelect({ people, value, onChange }) {
  return <select aria-label="Filter by employee" onChange={(event) => onChange(event.target.value)} value={value}><option value="">Everyone</option>{people.filter((person) => person !== 'CEO').map((person) => <option key={person}>{person}</option>)}</select>
}

function NotificationButton({ count, onClick }) {
  return (
    <button aria-label={`Notifications${count ? ` (${count})` : ''}`} className="btn g bell" onClick={onClick} type="button">
      <Icon name="bell" size={18} />
      {count > 0 && <b className="bell-badge">{count}</b>}
    </button>
  )
}

function FilterChips({ filters, setFilters, projects }) {
  const active = [['project', projectName(projects, filters.project)], ['status', filters.status], ['assignee', filters.assignee]].filter(([key]) => filters[key])
  if (!active.length) return null
  return (
    <div className="chips">
      <span className="chips-label"><Icon name="filter" size={13} /> Filtered by:</span>
      {active.map(([key, label]) => (
        <span className="chip" key={key}>
          {label}
          <button aria-label={`Clear filter ${label}`} onClick={() => setFilters({ ...filters, [key]: '' })} type="button">
            <Icon name="close" size={11} />
          </button>
        </span>
      ))}
      <Button className="btn-clear-chips" onClick={() => setFilters({ ...filters, project: '', status: '', assignee: '' })}>Clear all</Button>
    </div>
  )
}

function NatheelGulfNav({ id, open, onToggle, projects, filters, page, selectedNode, onSelectRoot, onSelect, mobile = false }) {
  return (
    <div className={`natheel-gulf-nav${mobile ? ' mobile-natheel-gulf-nav' : ''}`}>
      <div className={`natheel-gulf-trigger${page === 'gulf' ? ' on' : ''}`}>
        <button aria-current={page === 'gulf' ? 'page' : undefined} className="natheel-gulf-main" onClick={onSelectRoot} type="button">
          <span className="natheel-gulf-icon"><Icon name="award" size={18} /></span>
          <span className="natheel-gulf-label">Natheel Gulf</span>
        </button>
        <button aria-controls={id} aria-expanded={open} aria-label={`${open ? 'Collapse' : 'Expand'} Natheel Gulf sections`} className="natheel-gulf-toggle" onClick={onToggle} type="button">
          <Icon className={`natheel-gulf-chevron${open ? ' expanded' : ''}`} name="chevron-right" size={14} />
        </button>
      </div>
      {open && (
        <div aria-label="Natheel Gulf projects" className="natheel-gulf-sections" id={id}>
          <span className="natheel-gulf-sections-label">Projects</span>
          {NATHEEL_GULF_SECTIONS.map(([projectId, label]) => {
            const project = projects.find((item) => item.id === projectId)
            const selected = GULF_PROJECT_NODES[projectId] === selectedNode
            return (
              <button
                aria-current={selected ? 'location' : undefined}
                className={`natheel-gulf-section${selected ? ' on' : ''}`}
                disabled={!project}
                key={projectId}
                onClick={() => onSelect(project.id)}
                title={project ? `Show tasks for ${label}` : `${label} is not configured in Projects`}
                type="button"
              >
                <span className="natheel-gulf-project-icon" style={{ '--project-color': project?.color || '#64748b' }}><Icon name="folder" size={13} /></span>
                <span className="natheel-gulf-project-name">{label}</span>
                <Icon className="natheel-gulf-project-chevron" name="chevron-right" size={13} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function GulfCoreHubOverview({ assets, nodes, onOpenAssets }) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const byId = new Map(assets.map((asset) => [asset.id, asset]))
  const projectStorage = [
    { name: 'Natheel Gulf', size: '3.6 MB', count: 3, color: '#2563eb', ratio: 46 },
    { name: 'Hajiss Cafe Outlet', size: '3.0 MB', count: 2, color: '#d97706', ratio: 39 },
    { name: 'Dani Square', size: '1.1 MB', count: 1, color: '#0891b2', ratio: 14 },
    { name: 'Hajiss Cafe Holding Block', size: '32.1 KB', count: 1, color: '#7c3aed', ratio: 1 },
  ]
  const recent = [
    ['gulf-zatca'],
    ['gulf-crn'],
    ['gulf-presentations'],
    ['gulf-dani-presentation'],
    ['gulf-hajiss-spreadsheet', 'Hail_Cafes_Influencers_Database.xlsx'],
    ['gulf-hajiss-suppliers'],
  ].map(([id, name]) => ({ ...byId.get(id), name: name || byId.get(id)?.name })).filter((asset) => asset.id)
  const activity = [8, 12, 9, 15, 11, 18, 12, 22, 16, 14, 25, 18, 21, 17, 29, 20, 24, 19, 32, 23, 27, 21, 35, 29, 24, 38, 31, 35, 43, 48]

  return (
    <section aria-labelledby="gulf-overview-title" className="gulf-overview">
      <header className="gulf-overview-heading">
        <div><span className="gulf-eyebrow"><Icon name="dashboard" size={14} /> CORE HUB</span><h1 id="gulf-overview-title">Overview</h1><p>Everything stored in the Data Bank.</p></div>
        <Button onClick={onOpenAssets}><Icon name="folder" size={15} /> Browse files</Button>
      </header>
      <div className="gulf-overview-metrics">
        <article className="gulf-overview-metric"><span className="gulf-overview-metric-icon blue"><Icon name="file-text" size={18} /></span><span className="gulf-overview-metric-label">Files stored</span><strong>7</strong></article>
        <article className="gulf-overview-metric"><span className="gulf-overview-metric-icon green"><Icon name="database" size={18} /></span><span className="gulf-overview-metric-label">Total size</span><strong>7.7 MB</strong></article>
        <article className="gulf-overview-metric"><span className="gulf-overview-metric-icon violet"><Icon name="folder" size={18} /></span><span className="gulf-overview-metric-label">Active projects</span><strong>8 / 8</strong></article>
        <article className="gulf-overview-metric"><span className="gulf-overview-metric-icon amber"><Icon name="clock" size={18} /></span><span className="gulf-overview-metric-label">Added in the last 7 days</span><strong>4</strong></article>
      </div>
      <div className="gulf-overview-grid">
        <section className="gulf-overview-card">
          <div className="gulf-overview-card-heading"><div><h2>Storage by project</h2><p>Files and storage used</p></div><Icon name="chart" size={18} /></div>
          <div className="gulf-storage-list">
            {projectStorage.map((project) => (
              <div className="gulf-storage-item" key={project.name}>
                <div className="gulf-storage-label"><span><i style={{ background: project.color }} />{project.name}</span><b>{project.size} · {project.count}</b></div>
                <div className="gulf-storage-track"><i style={{ width: `${project.ratio}%`, background: project.color }} /></div>
              </div>
            ))}
          </div>
        </section>
        <section className="gulf-overview-card gulf-file-types-card">
          <div className="gulf-overview-card-heading"><div><h2>File types</h2><p>Breakdown by format</p></div><Icon name="file-text" size={18} /></div>
          <div className="gulf-type-row"><span className="gulf-type-icon pdf"><Icon name="file-text" size={17} /></span><span>PDF</span><b>5</b></div>
          <div className="gulf-type-row"><span className="gulf-type-icon spreadsheet"><Icon name="table" size={17} /></span><span>Spreadsheets &amp; data</span><b>2</b></div>
        </section>
        <section className="gulf-overview-card gulf-activity-card">
          <div className="gulf-overview-card-heading"><div><h2>Added, last 30 days</h2><p>Asset activity over time</p></div><Icon name="chart" size={18} /></div>
          <div aria-label="File activity from October 3, 2026 to today" className="gulf-activity-chart" role="img">
            {activity.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
          </div>
          <div className="gulf-chart-axis"><span>Oct 3, 2026</span><span>Today</span></div>
        </section>
        <section className="gulf-overview-card gulf-recent-card">
          <div className="gulf-overview-card-heading"><div><h2>Recent files</h2><p>Latest assets added to the Data Bank</p></div><Button className="gulf-recent-link" onClick={onOpenAssets}>View all <Icon name="arrow-right" size={14} /></Button></div>
          <div className="gulf-recent-list">
            {recent.map((asset) => (
              <button className="gulf-recent-file" key={asset.id} onClick={onOpenAssets} type="button">
                <span className={`gulf-file-type ${asset.type === 'PDF' ? 'pdf' : 'sheet'}`}><Icon name="file-text" size={17} /></span>
                <span className="gulf-recent-file-main"><b dir="auto" title={asset.name}>{asset.name}</b><small>{nodeById.get(asset.node)?.name || 'Natheel Gulf'} · {asset.size} · {asset.added}</small></span>
                <Icon className="gulf-recent-chevron" name="chevron-right" size={15} />
              </button>
            ))}
          </div>
        </section>
      </div>
      <footer className="gulf-footnote"><Icon name="lock" size={14} /> Protected by an access code. Labels such as Confidential describe a file; they do not hide it.</footer>
    </section>
  )
}

function EmailClientPage({ assets, nodes, config, onToast }) {
  const [activeTab, setActiveTab] = useState('compose')
  const [contacts, setContacts] = useState([])
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [footer, setFooter] = useState('')
  const [oneEmail, setOneEmail] = useState(true)
  const [selectedDataBank, setSelectedDataBank] = useState([])
  const [deviceFiles, setDeviceFiles] = useState([])
  const [showDataBank, setShowDataBank] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const deviceInput = useRef(null)
  const sender = config.emails?.['Asma Ghidhaoui'] || 'asma.g@natheelco.com'
  const parseAddresses = (value) => value.split(/[;,\n]+/).map((part) => {
    const bracketed = part.match(/<([^<>]+)>/)
    return (bracketed ? bracketed[1] : part).trim()
  }).filter(Boolean)
  const recipientCount = new Set([...parseAddresses(to), ...parseAddresses(cc), ...parseAddresses(bcc)].map((email) => email.toLowerCase())).size
  const dataBankSize = selectedDataBank.reduce((total, assetId) => {
    const asset = assets.find((item) => item.id === assetId)
    if (!asset) return total
    const match = asset.size.match(/^([\d.]+)\s*(KB|MB)$/i)
    if (!match) return total
    return total + Number(match[1]) * (match[2].toUpperCase() === 'MB' ? 1 : 1 / 1024)
  }, 0)
  const deviceSize = deviceFiles.reduce((total, file) => total + file.size / (1024 * 1024), 0)
  const totalAttachmentSize = dataBankSize + deviceSize
  const formatAttachmentSize = (size) => size < 1 ? `${(size * 1024).toFixed(1)} KB` : `${size.toFixed(1)} MB`
  const updateDeviceFiles = (fileList) => {
    const nextFiles = [...deviceFiles, ...fileList]
    const nextSize = nextFiles.reduce((total, file) => total + file.size / (1024 * 1024), dataBankSize)
    if (nextSize > 18) {
      onToast('Attachments must be 18 MB or less in total.')
      return
    }
    setDeviceFiles(nextFiles)
  }
  const openDraft = (test = false) => {
    const recipients = test ? sender : parseAddresses(to).join(',')
    if (!recipients) {
      onToast('Add at least one To address before continuing.')
      return
    }
    const body = [message, footer && `\n\n${footer}`].filter(Boolean).join('')
    const params = new URLSearchParams()
    if (cc.trim()) params.set('cc', cc)
    if (bcc.trim()) params.set('bcc', bcc)
    if (subject || test) params.set('subject', `${test ? '[Test] ' : ''}${subject}`)
    if (body) params.set('body', body)
    window.location.href = `mailto:${encodeURIComponent(recipients)}?${params.toString()}`
    onToast('Email draft opened in your mail app. Add the selected attachments there before sending.')
  }
  const addContact = (event) => {
    event.preventDefault()
    const email = contactEmail.trim()
    if (!contactName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      onToast('Enter a contact name and a valid email address.')
      return
    }
    if (contacts.some((contact) => contact.email.toLowerCase() === email.toLowerCase())) {
      onToast('That contact is already saved.')
      return
    }
    setContacts((current) => [...current, { name: contactName.trim(), email }])
    setContactName('')
    setContactEmail('')
    onToast('Contact saved for this session.')
  }
  const addContactToRecipients = (contact) => {
    setTo((current) => current.trim() ? `${current.trim()}, ${contact.name} <${contact.email}>` : `${contact.name} <${contact.email}>`)
    setActiveTab('compose')
  }

  return (
    <section aria-labelledby="gulf-email-title" className="gulf-email-page">
      <header className="gulf-page-heading">
        <div><span className="gulf-eyebrow"><Icon name="mail" size={14} /> NATHEEL GULF</span><h1 id="gulf-email-title">Email Client</h1><p>Write it like a Gmail message, with To, Cc, Bcc, a subject and any attachments. Send one email to everyone, or a separate copy to each person.</p></div>
      </header>
      <div className="gulf-email-shell">
        <div className="gulf-email-sidebar" role="complementary">
          <div className="gulf-email-sender"><span><Icon name="user" size={16} /></span><div><small>Sending from</small><b>{sender}</b></div></div>
          <nav aria-label="Email client sections" className="gulf-email-tabs">
            <button aria-current={activeTab === 'compose' ? 'page' : undefined} className={activeTab === 'compose' ? 'active' : ''} onClick={() => setActiveTab('compose')} type="button"><Icon name="edit" size={16} /> Compose</button>
            <button aria-current={activeTab === 'contacts' ? 'page' : undefined} className={activeTab === 'contacts' ? 'active' : ''} onClick={() => setActiveTab('contacts')} type="button"><Icon name="users" size={16} /> Contacts ({contacts.length})</button>
            <button aria-current={activeTab === 'history' ? 'page' : undefined} className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')} type="button"><Icon name="clock" size={16} /> History</button>
          </nav>
        </div>
        <div className="gulf-email-content">
          {activeTab === 'compose' && (
            <div className="gulf-email-compose">
              <div className="gulf-email-compose-heading"><div><h2>New message</h2><p>Compose and review your email before sending.</p></div><span className="gulf-email-badge"><Icon name="mail" size={14} /> Gmail-style compose</span></div>
              <label className="gulf-email-field"><span>To</span><textarea onChange={(event) => setTo(event.target.value)} placeholder="type or paste addresses" rows={2} value={to} /><small>Separate with commas, semicolons or new lines. You can also write Name &lt;email&gt;. One address or hundreds.</small></label>
              <div className="gulf-email-recipient-row">
                <label className="gulf-email-field"><span>Cc <small>(optional)</small></span><textarea onChange={(event) => setCc(event.target.value)} placeholder="Add carbon copy recipients" rows={2} value={cc} /></label>
                <label className="gulf-email-field"><span>Bcc <small>(optional, hidden from everyone)</small></span><textarea onChange={(event) => setBcc(event.target.value)} placeholder="Add blind carbon copy recipients" rows={2} value={bcc} /></label>
              </div>
              <label className="gulf-email-one-copy"><input checked={oneEmail} onChange={(event) => setOneEmail(event.target.checked)} type="checkbox" /><span><b>Send as one email to everyone in To</b> (they all see each other, like a normal Gmail message). Leave this off to send each person their own separate email.</span></label>
              <div aria-live="polite" className="gulf-email-recipient-count"><b>{recipientCount}</b> {recipientCount === 1 ? 'recipient' : 'recipients'}</div>
              <label className="gulf-email-field"><span>Subject</span><input onChange={(event) => setSubject(event.target.value)} placeholder="Add a subject" value={subject} /></label>
              <label className="gulf-email-field"><span>Message</span><textarea className="gulf-email-message" onChange={(event) => setMessage(event.target.value)} placeholder={'Write your message here. Use {{name}} to insert each person’s name (or “there” if we have no name).'} rows={8} value={message} /><small>Write {'{{name}}'} to insert each person's name (or "there" if we have no name).</small></label>
              <label className="gulf-email-field"><span>Footer <small>(optional, added under the message)</small></span><textarea onChange={(event) => setFooter(event.target.value)} placeholder="Your signature or footer" rows={2} value={footer} /></label>
              <section className="gulf-email-attachments">
                <div className="gulf-email-attachments-heading"><div><h3><Icon name="paperclip" size={16} /> Attachments</h3><p>Any file type: PDF, video, images, Word, Excel, zip</p></div><b>{formatAttachmentSize(totalAttachmentSize)} / 18.0 MB</b></div>
                <div className="gulf-email-attachment-actions">
                  <Button onClick={() => setShowDataBank((current) => !current)}><Icon name="folder" size={15} /> Add from the Data Bank</Button>
                  <Button onClick={() => deviceInput.current?.click()}><Icon name="upload" size={15} /> Add from this device</Button>
                  <input aria-label="Add attachments from this device" className="gulf-upload-input" multiple onChange={(event) => { updateDeviceFiles(event.target.files || []); event.target.value = '' }} ref={deviceInput} type="file" />
                </div>
                {showDataBank && (
                  <div className="gulf-email-databank">
                    <b>Select Data Bank files</b>
                    {assets.map((asset) => {
                      const project = nodes.find((node) => node.id === asset.node)?.name || 'Unfiled files'
                      return <label key={asset.id}><input checked={selectedDataBank.includes(asset.id)} onChange={(event) => {
                        const next = event.target.checked ? [...selectedDataBank, asset.id] : selectedDataBank.filter((id) => id !== asset.id)
                        const nextSize = next.reduce((sum, id) => {
                          const record = assets.find((item) => item.id === id)
                          const match = record?.size.match(/^([\d.]+)\s*(KB|MB)$/i)
                          return sum + (match ? Number(match[1]) * (match[2].toUpperCase() === 'MB' ? 1 : 1 / 1024) : 0)
                        }, deviceSize)
                        if (nextSize > 18) { onToast('Attachments must be 18 MB or less in total.'); return }
                        setSelectedDataBank(next)
                      }} type="checkbox" /><span><b>{asset.name}</b><small>{project} · {asset.size}</small></span></label>
                    })}
                    {!assets.length && <p>No Data Bank files are available.</p>}
                  </div>
                )}
                {(selectedDataBank.length > 0 || deviceFiles.length > 0) && (
                  <ul className="gulf-email-attachment-list">
                    {selectedDataBank.map((id) => {
                      const asset = assets.find((item) => item.id === id)
                      return asset ? <li key={id}><Icon name="file-text" size={16} /><span>{asset.name}</span><b>{asset.size}</b><button aria-label={`Remove ${asset.name}`} onClick={() => setSelectedDataBank((current) => current.filter((item) => item !== id))} type="button"><Icon name="close" size={14} /></button></li> : null
                    })}
                    {deviceFiles.map((file, index) => <li key={`${file.name}-${file.lastModified}-${index}`}><Icon name="file-text" size={16} /><span>{file.name}</span><b>{formatAttachmentSize(file.size / (1024 * 1024))}</b><button aria-label={`Remove ${file.name}`} onClick={() => setDeviceFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} type="button"><Icon name="close" size={14} /></button></li>)}
                  </ul>
                )}
                <p className="gulf-email-limit">Limit 18.0 MB in total (Gmail allows about 25 MB per email). For larger files such as long videos, share a Drive link in the message instead.</p>
              </section>
              <div className="gulf-email-send-actions"><Button disabled={!recipientCount} onClick={() => openDraft(true)}><Icon name="send" size={15} /> Send a test first <span>Send test</span></Button><Button className="p" disabled={!recipientCount} onClick={() => setReviewOpen(true)}>Review and send <Icon name="arrow-right" size={15} /></Button></div>
              <p className="gulf-email-preview-note"><Icon name="info" size={14} /> Email delivery is not connected in this preview. Review opens one draft in your default mail app; send separate copies and add selected attachments there manually.</p>
            </div>
          )}
          {activeTab === 'contacts' && (
            <div className="gulf-email-compose">
              <div className="gulf-email-compose-heading"><div><h2>Contacts</h2><p>Save recipients for quick access when composing a message.</p></div><span className="gulf-email-badge">{contacts.length} saved</span></div>
              <form className="gulf-email-contact-form" onSubmit={addContact}>
                <label className="gulf-email-field"><span>Name</span><input onChange={(event) => setContactName(event.target.value)} placeholder="Contact name" value={contactName} /></label>
                <label className="gulf-email-field"><span>Email</span><input onChange={(event) => setContactEmail(event.target.value)} placeholder="name@example.com" type="email" value={contactEmail} /></label>
                <Button className="p" type="submit"><Icon name="user-plus" size={15} /> Add contact</Button>
              </form>
              {contacts.length ? <ul className="gulf-email-contact-list">{contacts.map((contact) => <li key={contact.email}><span><b>{contact.name}</b><small>{contact.email}</small></span><Button onClick={() => addContactToRecipients(contact)}>Add to To</Button></li>)}</ul> : <div className="gulf-email-empty"><Icon name="users" size={24} /><b>No saved contacts yet.</b><span>Add them on the Contacts tab.</span></div>}
            </div>
          )}
          {activeTab === 'history' && <div className="gulf-email-empty gulf-email-history"><Icon name="clock" size={25} /><h2>History</h2><p>Email drafts opened from this preview are handled by your mail app and aren’t recorded here.</p></div>}
        </div>
      </div>
      {reviewOpen && (
        <div className="react-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setReviewOpen(false)}>
          <section aria-labelledby="gulf-email-review-title" aria-modal="true" className="mdl gulf-email-review" role="dialog">
            <header><div><span className="gulf-eyebrow">MESSAGE REVIEW</span><h2 id="gulf-email-review-title">Review and send</h2></div><button aria-label="Close review" className="btn-icon-close" onClick={() => setReviewOpen(false)} type="button"><Icon name="close" size={17} /></button></header>
            <dl><dt>From</dt><dd>{sender}</dd><dt>To</dt><dd>{to || '—'}</dd>{cc && <><dt>Cc</dt><dd>{cc}</dd></>}{bcc && <><dt>Bcc</dt><dd>{bcc}</dd></>}<dt>Subject</dt><dd>{subject || '(no subject)'}</dd><dt>Recipients</dt><dd>{recipientCount}</dd><dt>Attachments</dt><dd>{selectedDataBank.length + deviceFiles.length} · {formatAttachmentSize(totalAttachmentSize)}</dd></dl>
            <div className="gulf-email-review-message">{message || 'No message content.'}{footer && <p>{footer}</p>}</div>
            <footer><Button onClick={() => setReviewOpen(false)}>Back to compose</Button><Button className="p" onClick={() => { setReviewOpen(false); openDraft() }}><Icon name="send" size={15} /> Open email draft</Button></footer>
          </section>
        </div>
      )}
    </section>
  )
}

function GulfAssetPage({ nodes, setNodes, assets, setAssets, selectedNode, setSelectedNode, activeSection, setActiveSection, onLock, onToast, config }) {
  const [query, setQuery] = useState('')
  const [pendingFiles, setPendingFiles] = useState([])
  const [uploadLabel, setUploadLabel] = useState('Internal')
  const [uploadTags, setUploadTags] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)
  const uploadInput = useRef(null)
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const getDescendantIds = (nodeId) => {
    const children = nodes.filter((node) => node.parent === nodeId)
    return [nodeId, ...children.flatMap((child) => getDescendantIds(child.id))]
  }
  const scopedNodeIds = new Set(getDescendantIds(selectedNode))
  const visibleAssets = assets.filter((asset) =>
    scopedNodeIds.has(asset.node) &&
    (!query || `${asset.name} ${asset.description} ${nodeById.get(asset.node)?.name || ''}`.toLowerCase().includes(query.toLowerCase()))
  )
  useEffect(() => setQuery(''), [selectedNode])
  const selected = nodeById.get(selectedNode) || nodes[0]
  const isRoot = selectedNode === 'natheel-gulf'
  const sizeLabel = (size) => size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`
  const getNodePath = (node) => {
    const parts = []
    let current = node
    while (current) {
      parts.unshift(current.name)
      current = nodeById.get(current.parent)
    }
    return parts.join(' › ')
  }
  const addPendingFiles = (fileList) => {
    const validFiles = []
    const oversizedNames = []
    for (const file of fileList) {
      if (file.size > 100 * 1024 * 1024) oversizedNames.push(file.name)
      else validFiles.push(file)
    }
    if (oversizedNames.length) {
      onToast(`${oversizedNames.join(', ')} ${oversizedNames.length === 1 ? 'exceeds' : 'exceed'} the 100 MB per-file limit.`)
    }
    if (validFiles.length) setPendingFiles((current) => [...current, ...validFiles])
  }
  const addProject = (parent) => {
    const name = window.prompt(parent ? 'New sub-project name' : 'New core project name')
    if (!name?.trim()) return
    const id = `gulf-${Date.now()}`
    setNodes((current) => [...current, { id, name: name.trim(), parent, color: '#0f766e' }])
    setSelectedNode(id)
    onToast(`${name.trim()} added to the asset structure.`)
  }
  const uploadFiles = () => {
    const records = pendingFiles.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      name: file.name,
      description: uploadDescription.trim() || file.type || 'Uploaded asset',
      node: selectedNode,
      security: uploadLabel,
      size: sizeLabel(file.size),
      uploadedBy: 'Current session',
      added: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
      type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
      tags: uploadTags.split(',').map((tag) => tag.trim()).filter(Boolean),
    }))
    if (records.length) {
      setAssets((current) => [...records, ...current])
      setPendingFiles([])
      setUploadTags('')
      setUploadDescription('')
      onToast(`${records.length} file${records.length === 1 ? '' : 's'} added to this browser session.`)
    }
  }
  return (
    <div className="gulf-asset-page">
      <header className="gulf-brand-bar">
        <div className="gulf-brand">
          <img alt="" onError={(event) => { event.currentTarget.hidden = true }} src="/img/logo.png" />
          <div><b lang="ar" dir="rtl">مؤسسة نثيل الخليج للخدمات التجارية</b><span>Natheel Gulf Commercial Services</span></div>
        </div>
        <div className="gulf-brand-actions">
          <span className="gulf-user"><Icon name="user" size={15} /> bilel</span>
          <span className="gulf-protected"><Icon name="lock" size={14} /> Protected</span>
          <Button className="gulf-lock-btn" onClick={onLock}><Icon name="lock" size={14} /> Lock</Button>
        </div>
      </header>
      <nav aria-label="Asset workspace navigation" className="gulf-workspace-nav">
        <button aria-current={activeSection === 'overview' ? 'page' : undefined} className={activeSection === 'overview' ? 'active' : ''} onClick={() => setActiveSection('overview')} type="button"><Icon name="dashboard" size={15} /> Core Hub</button>
        <button aria-current={activeSection === 'files' ? 'page' : undefined} className={activeSection === 'files' ? 'active' : ''} onClick={() => setActiveSection('files')} type="button"><Icon name="folder" size={15} /> Matrix Hierarchy &amp; Files</button>
        <button aria-current={activeSection === 'ingestion' ? 'page' : undefined} className={activeSection === 'ingestion' ? 'active' : ''} onClick={() => setActiveSection('ingestion')} type="button"><Icon name="upload" size={15} /> Asset Ingestion</button>
        <button aria-current={activeSection === 'email' ? 'page' : undefined} className={activeSection === 'email' ? 'active' : ''} onClick={() => setActiveSection('email')} type="button"><Icon name="mail" size={15} /> Email Client</button>
      </nav>
      <input aria-label="Choose files to upload" className="gulf-upload-input" multiple onChange={(event) => { addPendingFiles(event.target.files || []); event.target.value = '' }} ref={uploadInput} type="file" />
      {activeSection === 'overview' ? <GulfCoreHubOverview assets={assets} nodes={nodes} onOpenAssets={() => setActiveSection('files')} /> : activeSection === 'ingestion' ? (
        <section aria-labelledby="gulf-upload-title" className="gulf-ingestion">
          <header className="gulf-page-heading">
            <div><span className="gulf-eyebrow"><Icon name="upload" size={14} /> ASSET INGESTION</span><h1 id="gulf-upload-title">Upload</h1><p>Any file type. Files open in a new tab or can be saved back to your computer.</p></div>
          </header>
          <div className="gulf-ingestion-card">
            <div className="gulf-ingestion-fields">
              <label className="gulf-ingestion-field">
                <span>Project</span>
                <select onChange={(event) => setSelectedNode(event.target.value)} value={selectedNode}>
                  {nodes.filter((node) => node.id !== 'unfiled').map((node) => <option key={node.id} value={node.id}>{getNodePath(node)}</option>)}
                  <option value="unfiled">No project (unfiled)</option>
                </select>
              </label>
              <fieldset className="gulf-ingestion-field gulf-label-field">
                <legend>Label</legend>
                <div className="gulf-label-options">
                  {['Internal', 'Confidential', 'Restricted'].map((label) => (
                    <button aria-pressed={uploadLabel === label} className={`gulf-label-option${uploadLabel === label ? ' selected' : ''}`} key={label} onClick={() => setUploadLabel(label)} type="button">{label}</button>
                  ))}
                </div>
              </fieldset>
              <label className="gulf-ingestion-field">
                <span>Tags, comma separated</span>
                <input onChange={(event) => setUploadTags(event.target.value)} placeholder="e.g. invoice, 2026, finance" value={uploadTags} />
              </label>
              <label className="gulf-ingestion-field">
                <span>Description for this batch</span>
                <textarea onChange={(event) => setUploadDescription(event.target.value)} placeholder="Add a description shared by these files" rows={3} value={uploadDescription} />
              </label>
            </div>
            <div
              className={`gulf-dropzone${isDraggingFiles ? ' dragging' : ''}`}
              onDragEnter={(event) => { event.preventDefault(); setIsDraggingFiles(true) }}
              onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsDraggingFiles(false) }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); setIsDraggingFiles(false); addPendingFiles(event.dataTransfer.files) }}
              onClick={() => uploadInput.current?.click()}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); uploadInput.current?.click() } }}
              role="button"
              tabIndex={0}
            >
              <span className="gulf-dropzone-icon"><Icon name="upload" size={23} /></span>
              <strong>Drop files here or click to choose</strong>
              <span>Any file type, up to 100 MB each</span>
            </div>
            {pendingFiles.length > 0 && (
              <ul aria-label="Files selected for upload" className="gulf-pending-files">
                {pendingFiles.map((file, index) => (
                  <li key={`${file.name}-${file.size}-${file.lastModified}-${index}`}>
                    <Icon name="file-text" size={17} />
                    <span><b title={file.name}>{file.name}</b><small>{sizeLabel(file.size)}</small></span>
                    <button aria-label={`Remove ${file.name}`} className="btn-icon-close" onClick={() => setPendingFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} type="button"><Icon name="close" size={15} /></button>
                  </li>
                ))}
              </ul>
            )}
            <div className="gulf-ingestion-actions">
              <Button className="p" disabled={!pendingFiles.length} onClick={uploadFiles}><Icon name="upload" size={15} /> Upload</Button>
              <Button disabled={!pendingFiles.length && !uploadTags && !uploadDescription} onClick={() => { setPendingFiles([]); setUploadTags(''); setUploadDescription('') }}>Clear list</Button>
            </div>
            <p className="gulf-ingestion-note"><Icon name="lock" size={14} /> Files and details are kept in this browser session only; file contents are not uploaded to secure storage.</p>
          </div>
        </section>
        ) : activeSection === 'email' ? <EmailClientPage assets={assets} config={config} nodes={nodes} onToast={onToast} /> : <>
      <header className="gulf-page-heading">
        <div><span className="gulf-eyebrow"><Icon name="folder" size={14} /> ENTERPRISE WORKSPACE</span><h1>Enterprise Asset Architecture</h1><p>Structure for core operations, child projects and the files filed under each.</p></div>
        <div className="gulf-heading-actions">
          <Button onClick={() => setActiveSection('ingestion')}><Icon name="upload" size={15} /> Upload files</Button>
          <Button onClick={() => addProject('natheel-gulf')}><Icon name="plus" size={15} /> New Core Project</Button>
          <Button disabled={selectedNode === 'unfiled'} onClick={() => addProject(selectedNode)}><Icon name="plus" size={15} /> New Sub-Project</Button>
        </div>
      </header>
      <div className="gulf-layout">
        <section className="gulf-assets-panel card">
          <div className="gulf-assets-heading">
            <div><span className="gulf-eyebrow">ASSET REGISTER</span><h2>{selected?.name || 'Natheel Gulf'}</h2><p>{visibleAssets.length} file{visibleAssets.length === 1 ? '' : 's'}{query ? ' matching your search' : ' in this structure'}</p></div>
            <label className="gulf-search"><Icon name="search" size={16} /><input aria-label="Search assets" onChange={(event) => setQuery(event.target.value)} placeholder="Search files or descriptions" value={query} /></label>
          </div>
          <div className="gulf-active-filter"><span>Active filter: <b>{selected?.name || 'Natheel Gulf'}{isRoot ? ' (All)' : ''}</b></span><Button className="gulf-clear-btn" onClick={() => { setSelectedNode('natheel-gulf'); setQuery('') }}>Clear</Button></div>
          <div className="gulf-asset-table" role="table" aria-label="Enterprise assets">
            <div className="gulf-asset-columns" role="row">
              {['Data asset structure', 'Assigned path node', 'Security', 'Size', 'Uploaded by', 'Ecosystem action'].map((label) => <span key={label} role="columnheader">{label}</span>)}
            </div>
            {visibleAssets.map((asset) => (
              <article className="gulf-asset-row" key={asset.id} role="row">
                <div className="gulf-asset-name" data-label="Data asset structure" role="cell"><span className={`gulf-file-type ${asset.type === 'PDF' ? 'pdf' : 'sheet'}`}><Icon name="file-text" size={18} /></span><span><b dir="auto" title={asset.name}>{asset.name}</b><small dir="auto">{asset.description || asset.type}</small>{asset.added && <small className="gulf-asset-uploaded">Uploaded {asset.added}</small>}</span></div>
                <span className="gulf-path-cell" data-label="Assigned path node" role="cell"><Icon name="folder" size={14} /> {nodeById.get(asset.node)?.name || 'Unfiled files'}</span>
                <span data-label="Security" role="cell"><span className="gulf-security"><Icon name="lock" size={12} /> {asset.security}</span></span>
                <span className="gulf-data-cell" data-label="Size" role="cell">{asset.size}</span>
                <span className="gulf-data-cell" data-label="Uploaded by" role="cell">{asset.uploadedBy}</span>
                <span className="gulf-action-cell" data-label="Ecosystem action" role="cell"><a href={`mailto:?subject=${encodeURIComponent(`Asset reference: ${asset.name}`)}&body=${encodeURIComponent(`Please attach or reference this asset: ${asset.name}`)}`}><Icon name="mail" size={13} /> Attach to Mail</a></span>
              </article>
            ))}
            {!visibleAssets.length && <div className="gulf-empty" role="row"><span role="cell"><Icon name={query ? 'search' : 'folder'} size={22} /><b>{query ? 'No matching assets' : 'No assets in this project yet'}</b><span>{query ? 'Try another search.' : 'Files added to this project will appear here.'}</span></span></div>}
          </div>
          <footer className="gulf-footnote"><Icon name="lock" size={14} /> Security labels do not restrict access in this preview. Example records are based on your screenshot; uploads and project edits stay in this browser session (file contents are not uploaded). Email links open a draft; attach files manually.</footer>
        </section>
      </div>
      </>}
    </div>
  )
}

function TaskTable({ tasks, projects, members, onUpdate, onRemove }) {
  if (!tasks.length) return <p className="mu">No tasks match these filters.</p>
  return <div aria-label="Task list. Scroll horizontally to view all columns" className="scroll" role="region" tabIndex={0}><table><thead><tr><th>Task</th><th>Status</th><th>Assignee</th><th>Due</th><th>Priority</th><th>Project</th><th /></tr></thead><tbody>{tasks.map((task) => <tr key={task.id}>
    <td>{task.url ? <a className="task-link" href={task.url} rel="noreferrer" target="_blank">{task.title} <Icon name="external-link" size={12} /></a> : <b className="task-title-text">{task.title}</b>}{task.hist && <span className="pill">Sheet</span>}</td>
    <td>{task.source === 'clickup' ? task.rawStatus : <select aria-label={`Status for ${task.title}`} disabled={task.demo || task.hist} onChange={(event) => onUpdate(task, { status: event.target.value, doneAt: event.target.value === 'Done' ? Date.now() : 0 })} value={task.status}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>}</td>
    <td>{task.assignees?.map((name) => <span key={name}><Avatar members={members} name={name} />{name}</span>) || task.assignee || '—'}</td>
    <td className={isLate(task) ? 'late' : ''}>{task.due || '—'}</td><td style={{ color: PRIORITY_COLORS[task.priority] }}>{task.priority || '—'}</td><td>{projectName(projects, task.project)}</td>
    <td>{task.demo ? <span className="pill">Sample</span> : task.source === 'clickup' ? null : <button aria-label={`${task.hist ? 'Remove imported task' : 'Delete'} ${task.title}`} className="btn-icon-danger" onClick={() => onRemove(task)}><Icon name="trash" size={14} /></button>}</td>
  </tr>)}</tbody></table></div>
}

function TaskCard({ task, projects, members, onUpdate, onRemove }) {
  return <article className="t"><b>{task.title}</b><div className="mu">{projectName(projects, task.project)} • {task.priority} {isLate(task) && <span className="late">• overdue</span>}</div><div className="row">{task.assignees?.map((name) => <span key={name}><Avatar members={members} name={name} />{name}</span>)}</div>{!task.demo && task.source !== 'clickup' && <>{!task.hist && <select aria-label={`Status for ${task.title}`} onChange={(event) => onUpdate(task, { status: event.target.value, doneAt: event.target.value === 'Done' ? Date.now() : 0 })} value={task.status}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>}<button className="btn g" onClick={() => onRemove(task)}>{task.hist ? 'Remove imported' : 'Delete'}</button></>}</article>
}

function KpiTable({ rows, members = [], onSelect }) {
  return <div aria-label="Employee KPI scorecard. Scroll horizontally to view all columns" className="scroll" role="region" tabIndex={0}><table><thead><tr><th>Employee</th><th>Managed</th><th>Done</th><th>Open</th><th>Overdue</th><th>On-time</th><th>Score</th></tr></thead><tbody>{rows.map((row, index) => <tr className={onSelect ? 'ck' : ''} key={row.name} onClick={onSelect ? () => onSelect(row.name) : undefined} onKeyDown={onSelect ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(row.name) } } : undefined} role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined}><td><Avatar members={members} name={row.name} /> <b>{row.name}</b>{index === 0 && row.total > 0 ? <span className="winner-badge" title="Top performer"><Icon name="crown" size={14} color="#f59e0b" /> Top</span> : ''}</td><td>{row.total}</td><td>{row.done}</td><td>{row.open}</td><td className={row.overdue ? 'late' : ''}>{row.overdue}</td><td>{row.done ? Math.round(row.onTime / row.done * 100) : 100}%</td><td><div className="row"><div className="bar"><i style={{ width: `${row.score}%` }} /></div><b>{Math.round(row.score)}</b></div></td></tr>)}</tbody></table></div>
}

function ClickupPage({ tasks, config, status, lastSync, filters, setFilters, members, onSync }) {
  const groups = [...new Set(tasks.map((task) => `${task.space}\u0000${task.folder}\u0000${task.list}`))]
  return <>
    <header className="top"><div><h1>ClickUp</h1><div className="mu">Your workspace tasks • {status}{lastSync ? ` • synced ${new Date(lastSync).toLocaleTimeString()}` : ''}</div></div><div className="row"><select onChange={(event) => setFilters({ ...filters, space: event.target.value })} value={filters.space}><option value="">All spaces</option>{[...new Set((config.spaces || []).map((space) => space.name))].map((space) => <option key={space}>{space}</option>)}</select><PersonSelect people={members.map((person) => person.name)} value={filters.assignee} onChange={(value) => setFilters({ ...filters, assignee: value })} /><input onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Search tasks" value={filters.search} /><label className="chk"><input checked={filters.closed} onChange={(event) => setFilters({ ...filters, closed: event.target.checked })} type="checkbox" /> Show closed</label><Button onClick={onSync}><Icon name="sync" size={14} /> Sync</Button></div></header>
    {!config.configured ? <div className="card"><h2>ClickUp is not connected yet</h2><p>Add `CLICKUP_API_TOKEN` to the server environment to enable workspace sync. TaskFlow-managed tasks are still available in Tasks.</p></div> : groups.map((group) => {
      const [space, folder, list] = group.split('\u0000')
      const groupTasks = tasks.filter((task) => `${task.space}\u0000${task.folder}\u0000${task.list}` === group)
      return <section className="card sp" key={group}><h2>{[space, folder, list].filter(Boolean).join(' › ')} <span className="mu">{groupTasks.length} tasks</span></h2><TaskTable tasks={groupTasks} projects={[]} members={members} /></section>
    })}
    {config.truncated && <p className="mu">Showing the first 1,000 tasks returned by ClickUp.</p>}
  </>
}

function MeetingSummary({ meetings, projects, onOpen, onCreate, onStart }) {
  const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
  const week = meetings.filter((meeting) => meeting.start >= weekStart.getTime() && meeting.start < weekStart.getTime() + 7 * 86_400_000)
  const upcoming = meetings.filter((meeting) => meeting.status !== 'completed' && meeting.status !== 'cancelled' && meeting.start + meeting.duration * 60_000 > Date.now()).sort((a, b) => a.start - b.start)
  const decisions = meetings.filter((meeting) => meeting.status === 'completed').flatMap((meeting) => (meeting.decisions || []).map((decision) => ({ ...decision, meeting }))).slice(-4)
  return (
    <section className="card hub meeting-hub sp">
      <div className="section-head-row">
        <div>
          <div className="section-title-wrap">
            <span className="section-icon-badge"><Icon name="video" size={20} /></span>
            <h2>Meetings this week</h2>
          </div>
          <div className="mu">{week.length} meeting(s) scheduled • {week.filter((m) => m.status === 'completed').length} completed</div>
        </div>
        <div className="row meeting-actions">
          <Button className="btn-meet" onClick={() => onStart('google')} type="button"><Icon name="google-meet" size={16} /> Start Meet</Button>
          <Button className="btn-zoom" onClick={() => onStart('zoom')} type="button"><Icon name="zoom" size={16} /> Start Zoom</Button>
          <Button onClick={onCreate} primary type="button"><Icon name="calendar-plus" size={16} /> Schedule</Button>
        </div>
      </div>
      <div className="grid k2 sp">
        <div className="meeting-col">
          <div className="sub-header"><Icon name="calendar-clock" size={16} /> <h3>Upcoming schedule</h3></div>
          <div className="meeting-list">
            {upcoming.slice(0, 3).map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} projects={projects} onOpen={onOpen} />)}
            {!upcoming.length && <div className="empty-state"><Icon name="calendar" size={24} /><p className="mu">No upcoming meetings scheduled.</p></div>}
          </div>
        </div>
        <div className="meeting-col">
          <div className="sub-header"><Icon name="decision" size={16} /> <h3>Latest decisions recorded</h3></div>
          <div className="decision-list">
            {decisions.map(({ meeting, text, owner }, index) => (
              <button className="decision-card" key={`${meeting.id}-${index}`} onClick={() => onOpen(meeting)} type="button">
                <span className="decision-icon"><Icon name="check-circle" size={16} /></span>
                <span className="decision-body">
                  <b>{text}</b>
                  <small><Icon name="file-text" size={12} /> {meeting.title} • <Icon name="user" size={12} /> {owner || 'No owner'}</small>
                </span>
                <span className="decision-arrow"><Icon name="chevron-right" size={14} /></span>
              </button>
            ))}
            {!decisions.length && <div className="empty-state"><Icon name="decision" size={24} /><p className="mu">Decisions generated from meeting minutes appear here.</p></div>}
          </div>
        </div>
      </div>
    </section>
  )
}

function MeetingRow({ meeting, projects, onOpen }) {
  const isGoogle = meeting.platform === 'google'
  const isCompleted = meeting.status === 'completed'
  const isCancelled = meeting.status === 'cancelled'
  const statusType = isCompleted ? 'ok' : isCancelled ? 'bad' : 'info'

  return (
    <button className="mr" onClick={() => onOpen(meeting)} type="button">
      <span className="mdt">
        <b>{new Date(meeting.start).getDate()}</b>
        <span>{new Date(meeting.start).toLocaleDateString([], { month: 'short' })}</span>
      </span>
      <span className="platform-tag" title={isGoogle ? 'Google Meet' : 'Zoom'}>
        <Icon name={isGoogle ? 'google-meet' : 'zoom'} size={18} />
      </span>
      <span className="meeting-row-content">
        <b>{meeting.title}</b>
        <span className="mu">
          <Icon name="clock" size={12} /> {new Date(meeting.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          {meeting.duration ? ` (${meeting.duration}m)` : ''} • {projectName(projects, meeting.project)}
        </span>
      </span>
      <span className={`pill pill-${statusType}`}>
        {isCompleted ? <Icon name="check" size={12} /> : isCancelled ? <Icon name="close" size={12} /> : <Icon name="clock" size={12} />}
        {meeting.status || 'scheduled'}
      </span>
    </button>
  )
}

function MeetingDetail({ meeting, members, projects, busy, onClose, onSave, onSummarize, onCreateTask }) {
  const [draft, setDraft] = useState({ ...meeting, decisions: meeting.decisions || [], actions: meeting.actions || [] })
  useEffect(() => setDraft({ ...meeting, decisions: meeting.decisions || [], actions: meeting.actions || [] }), [meeting])
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }))
  const isGoogle = draft.platform === 'google'

  return (
    <div className="react-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="mdl meeting-detail-modal">
        <header className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon-badge">
              <Icon name={isGoogle ? 'google-meet' : 'zoom'} size={24} />
            </span>
            <div>
              <h2>{draft.title}</h2>
              <span className="mu">
                <Icon name="calendar" size={13} /> {fmtDay(draft.start)} • <Icon name="clock" size={13} /> {new Date(draft.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} ({draft.duration} min) • <Icon name="folder" size={13} /> {projectName(projects, draft.project)}
              </span>
            </div>
          </div>
          <button aria-label="Close" className="btn-icon-close" onClick={onClose} type="button">
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="meeting-links-row">
          {draft.joinUrl && (
            <a className="btn p btn-join" href={draft.joinUrl} rel="noreferrer" target="_blank">
              <Icon name={isGoogle ? 'google-meet' : 'zoom'} size={16} /> Join {isGoogle ? 'Google Meet' : 'Zoom'} <Icon name="external-link" size={14} />
            </a>
          )}
          {draft.calendarUrl && (
            <a className="btn g btn-cal-event" href={draft.calendarUrl} rel="noreferrer" target="_blank">
              <Icon name="calendar" size={15} /> Calendar event <Icon name="external-link" size={14} />
            </a>
          )}
        </div>

        <div className="modal-section">
          <Field label={<span><Icon name="file-text" size={14} /> Meeting notes / transcript</span>}>
            <textarea
              className="notes-textarea"
              onChange={(event) => update('notes', event.target.value)}
              placeholder="Paste discussion notes, agenda points, or call transcript here..."
              rows="5"
              value={draft.notes || ''}
            />
          </Field>
          <div className="row sp ai-action-row">
            <Button
              className="btn-summarize"
              disabled={busy || !draft.notes?.trim() || draft.demo}
              onClick={() => onSummarize(draft)}
              primary
              type="button"
            >
              <Icon name="sparkles" size={16} /> {busy ? 'Generating minutes with AI…' : 'Generate summary, decisions & actions'}
            </Button>
            {draft.demo && <span className="mu badge-demo">Sample meeting is read-only</span>}
          </div>
        </div>

        <div className="modal-section">
          <Field label={<span><Icon name="file-text" size={14} /> Executive Summary</span>}>
            <textarea
              onChange={(event) => update('summary', event.target.value)}
              placeholder="Summary of key discussion topics and outcomes..."
              rows="3"
              value={draft.summary || ''}
            />
          </Field>
        </div>

        <div className="modal-section">
          <div className="section-head-row">
            <h3><Icon name="decision" size={16} /> Decisions ({draft.decisions.length})</h3>
            <Button
              disabled={draft.demo}
              onClick={() => update('decisions', [...draft.decisions, { text: '', owner: '' }])}
              type="button"
            >
              <Icon name="plus" size={14} /> Add decision
            </Button>
          </div>
          <div className="items-list">
            {draft.decisions.map((decision, index) => (
              <div className="decision-item-row" key={index}>
                <input
                  className="decision-text-input"
                  onChange={(event) => update('decisions', draft.decisions.map((item, row) => row === index ? { ...item, text: event.target.value } : item))}
                  placeholder="Decision reached..."
                  value={decision.text}
                />
                <input
                  className="decision-owner-input"
                  list="meeting-members"
                  onChange={(event) => update('decisions', draft.decisions.map((item, row) => row === index ? { ...item, owner: event.target.value } : item))}
                  placeholder="Owner"
                  value={decision.owner || ''}
                />
                <button
                  aria-label="Remove decision"
                  className="btn-icon-danger"
                  disabled={draft.demo}
                  onClick={() => update('decisions', draft.decisions.filter((_, row) => row !== index))}
                  type="button"
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            ))}
            {!draft.decisions.length && <p className="mu empty-hint">No decisions recorded yet. Click "Add decision" or use AI generation.</p>}
          </div>
        </div>

        <div className="modal-section">
          <div className="section-head-row">
            <h3><Icon name="check-square" size={16} /> Action Items ({draft.actions.length})</h3>
            <Button
              disabled={draft.demo}
              onClick={() => update('actions', [...draft.actions, { text: '', owner: '', due: '' }])}
              type="button"
            >
              <Icon name="plus" size={14} /> Add action
            </Button>
          </div>
          <div className="items-list">
            {draft.actions.map((action, index) => (
              <div className="action-item-row" key={index}>
                <input
                  className="action-text-input"
                  onChange={(event) => update('actions', draft.actions.map((item, row) => row === index ? { ...item, text: event.target.value } : item))}
                  placeholder="Action item..."
                  value={action.text}
                />
                <input
                  className="action-owner-input"
                  list="meeting-members"
                  onChange={(event) => update('actions', draft.actions.map((item, row) => row === index ? { ...item, owner: event.target.value } : item))}
                  placeholder="Owner"
                  value={action.owner || ''}
                />
                <input
                  className="action-date-input"
                  onChange={(event) => update('actions', draft.actions.map((item, row) => row === index ? { ...item, due: event.target.value } : item))}
                  type="date"
                  value={action.due || ''}
                />
                <Button
                  className="btn-create-task"
                  disabled={draft.demo || !action.text?.trim()}
                  onClick={() => onCreateTask(action)}
                  type="button"
                >
                  <Icon name="plus" size={13} /> Create task
                </Button>
                <button
                  aria-label="Remove action"
                  className="btn-icon-danger"
                  disabled={draft.demo}
                  onClick={() => update('actions', draft.actions.filter((_, row) => row !== index))}
                  type="button"
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            ))}
            {!draft.actions.length && <p className="mu empty-hint">No action items yet.</p>}
          </div>
        </div>

        <datalist id="meeting-members">{members.map((member) => <option key={member.name}>{member.name}</option>)}</datalist>

        <footer className="modal-actions-footer">
          <Button
            className={draft.status === 'completed' ? 'btn-reopen' : 'btn-achieve'}
            disabled={draft.demo}
            onClick={() => onSave(draft, { status: draft.status === 'completed' ? 'scheduled' : 'completed' })}
            primary={draft.status !== 'completed'}
            type="button"
          >
            <Icon name={draft.status === 'completed' ? 'refresh' : 'check-circle'} size={16} />
            {draft.status === 'completed' ? 'Reopen meeting' : 'Save & mark achieved'}
          </Button>
          <Button
            className="btn-cancel"
            disabled={draft.demo}
            onClick={() => onSave(draft, { status: 'cancelled' })}
            type="button"
          >
            <Icon name="x-circle" size={16} /> Cancel meeting
          </Button>
          <Button
            className="btn-save"
            disabled={draft.demo}
            onClick={() => onSave(draft)}
            type="button"
          >
            Save minutes
          </Button>
          <Button onClick={onClose} type="button">Close</Button>
        </footer>
      </div>
    </div>
  )
}

function CalendarEventDetail({ event, projects, onClose, onOpenMeeting }) {
  const { kind, item } = event
  const meeting = kind === 'meeting'
  const isGoogle = meeting && item.platform === 'google'
  const eventDate = meeting ? new Date(item.start) : new Date(`${item.due}T12:00:00`)
  const dateLabel = eventDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const timeLabel = meeting
    ? eventDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : null
  const endLabel = meeting && item.duration
    ? new Date(item.start + item.duration * 60_000).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : null

  return (
    <div className="react-modal-backdrop" onMouseDown={(mouseEvent) => mouseEvent.target === mouseEvent.currentTarget && onClose()}>
      <section aria-labelledby="calendar-event-title" aria-modal="true" className="mdl event-modal" role="dialog">
        <header className="event-modal-head">
          <div className={`event-modal-icon ${meeting ? (isGoogle ? 'icon-meet' : 'icon-zoom') : 'icon-task'}`}>
            <Icon name={meeting ? (isGoogle ? 'google-meet' : 'zoom') : 'check-square'} size={24} />
          </div>
          <button aria-label="Close event details" className="btn-icon-close" onClick={onClose} type="button">
            <Icon name="close" size={18} />
          </button>
        </header>
        <span className={`pill event-kind ${meeting ? 'meeting' : 'task'}`}>
          <Icon name={meeting ? (isGoogle ? 'google-meet' : 'zoom') : 'check'} size={12} />
          {meeting ? `${isGoogle ? 'Google Meet' : 'Zoom'} meeting` : 'Task due'}
        </span>
        <h2 id="calendar-event-title">{item.title}</h2>
        <div className="event-facts">
          <div className="event-fact">
            <span className="fact-icon"><Icon name="calendar" size={18} /></span>
            <div>
              <b>{dateLabel}</b>
              {timeLabel && <span><Icon name="clock" size={12} /> {timeLabel}{endLabel ? ` – ${endLabel}` : ''}</span>}
            </div>
          </div>
          <div className="event-fact">
            <span className="fact-icon"><Icon name="folder" size={18} /></span>
            <div>
              <b>Project</b>
              <span>{projectName(projects, item.project)}</span>
            </div>
          </div>
          {meeting ? (
            <div className="event-fact">
              <span className="fact-icon"><Icon name="clock" size={18} /></span>
              <div>
                <b>Status & Duration</b>
                <span>{item.status || 'scheduled'}{item.duration ? ` · ${item.duration} min` : ''}</span>
              </div>
            </div>
          ) : (
            <>
              <div className="event-fact">
                <span className="fact-icon"><Icon name="check-circle" size={18} /></span>
                <div>
                  <b>Status</b>
                  <span>{item.status || 'To Do'}</span>
                </div>
              </div>
              <div className="event-fact">
                <span className="fact-icon"><Icon name="user" size={18} /></span>
                <div>
                  <b>Assigned to</b>
                  <span>{(item.assignees || [item.assignee]).filter(Boolean).join(', ') || 'Unassigned'}</span>
                </div>
              </div>
              {item.priority && (
                <div className="event-fact">
                  <span className="fact-icon"><Icon name="flag" size={18} color={PRIORITY_COLORS[item.priority]} /></span>
                  <div>
                    <b>Priority</b>
                    <span style={{ color: PRIORITY_COLORS[item.priority], fontWeight: 600 }}>{item.priority}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        {meeting && item.attendees?.length > 0 && (
          <div className="event-extra">
            <b><Icon name="users" size={14} /> Attendees</b>
            <p>{item.attendees.map((attendee) => typeof attendee === 'string' ? attendee : attendee.name || attendee.email).join(', ')}</p>
          </div>
        )}
        {(item.summary || item.note) && (
          <div className="event-extra">
            <b><Icon name="file-text" size={14} /> {meeting ? 'Meeting summary' : 'Notes'}</b>
            <p>{item.summary || item.note}</p>
          </div>
        )}
        <footer className="event-modal-actions">
          {meeting && item.joinUrl && (
            <a className="btn p" href={item.joinUrl} rel="noreferrer" target="_blank">
              <Icon name="video" size={15} /> Join meeting <Icon name="external-link" size={13} />
            </a>
          )}
          {meeting && (
            <Button onClick={() => onOpenMeeting(item)}>
              <Icon name="file-text" size={15} /> Open meeting notes
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </footer>
      </section>
    </div>
  )
}

function MeetingsPage({ platform, meetings, integration, projects, onOpen, onSchedule, onStart }) {
  const isGoogle = platform === 'google'
  const label = isGoogle ? 'Google Meet' : 'Zoom'
  const exampleSummaries = isGoogle ? [
    { title: 'Weekly leadership sync', focus: 'Operations & priorities', summary: 'The team reviewed this week’s operational priorities, confirmed owners for open decisions, and agreed to raise supplier delays earlier in the weekly review.', decisions: ['Keep the weekly review focused on blockers and decisions.', 'Escalate supplier delays as soon as a delivery date is at risk.'], actions: ['Share the updated priority list before the next sync.', 'Bring the revised supplier timeline to the next review.'] },
    { title: 'Project launch readiness', focus: 'Project planning', summary: 'The launch checklist was reviewed across marketing, operations, and customer support. The group agreed to validate dependencies before confirming the public launch date.', decisions: ['Confirm cross-team dependencies before announcing the launch date.'], actions: ['Collect final readiness updates from each team.', 'Review open launch risks with project owners.'] },
    { title: 'Monthly performance review', focus: 'KPI review', summary: 'Participants reviewed progress against monthly targets, discussed the largest changes since the previous review, and identified where follow-up analysis is needed.', decisions: ['Use the same KPI definitions in the next monthly report.'], actions: ['Circulate the updated KPI breakdown.', 'Add context for metrics that changed significantly.'] },
    { title: 'Customer experience review', focus: 'Service improvement', summary: 'The team discussed recurring customer feedback themes and prioritised improvements that can be tracked during the next service review.', decisions: ['Prioritise the top recurring feedback themes for follow-up.'], actions: ['Group feedback by theme.', 'Bring proposed service improvements to the next meeting.'] },
  ] : [
    { title: 'Investor update call', focus: 'Business update', summary: 'The team aligned on the key business updates to share, reviewed the current risks, and agreed to circulate supporting figures before the next investor discussion.', decisions: ['Use one approved set of figures across the investor materials.'], actions: ['Validate the latest reporting figures.', 'Share the revised update with meeting participants.'] },
    { title: 'Quarterly planning workshop', focus: 'Strategic planning', summary: 'Participants reviewed proposed quarterly initiatives, discussed team capacity, and identified dependencies that should be resolved before commitments are finalised.', decisions: ['Sequence initiatives according to confirmed team capacity.'], actions: ['Map dependencies between proposed initiatives.', 'Return with a capacity-aligned draft plan.'] },
    { title: 'Operations improvement review', focus: 'Operational follow-up', summary: 'The group examined process bottlenecks, prioritised the areas with the clearest operational impact, and agreed to review progress using a consistent set of measures.', decisions: ['Track the selected improvement measures consistently.'], actions: ['Document baseline measures.', 'Assign owners for the priority process improvements.'] },
    { title: 'Project stakeholder briefing', focus: 'Project alignment', summary: 'Stakeholders reviewed current project progress, clarified outstanding questions, and agreed on a concise update cadence for upcoming milestones.', decisions: ['Use a single shared milestone update for stakeholders.'], actions: ['Confirm milestone owners and dates.', 'Share the next status update before the following checkpoint.'] },
  ]
  const upcomingMeetings = meetings.filter((meeting) => meeting.start + meeting.duration * 60_000 >= Date.now())
  const pastMeetings = meetings.filter((meeting) => meeting.start + meeting.duration * 60_000 < Date.now())
  const totalDecisions = meetings.reduce((sum, meeting) => sum + (meeting.decisions?.length || 0), 0)
  const awaitingMinutes = meetings.filter((meeting) => meeting.status === 'completed' && !meeting.summary).length
  const editableMeeting = meetings.find((meeting) => !meeting.demo)
  const summarizedMeetings = meetings
    .filter((meeting) => meeting.summary?.trim())
    .sort((first, second) => second.start - first.start)

  return (
    <>
      <header className="top">
        <div className="title-with-badge">
          <span className="platform-header-icon">
            <Icon name={isGoogle ? 'google-meet' : 'zoom'} size={28} />
          </span>
          <div>
            <h1>{label}</h1>
            <div className="mu">
              {integration[platform]
                ? 'Connected • meetings automatically sync with calendar invitations and links.'
                : `Quick-start mode • launch instant ${label} or schedule with reminders.`}
            </div>
          </div>
        </div>
        <div className="row">
          <Button className="btn-instant" onClick={() => onStart(platform)} primary type="button">
            <Icon name="video-instant" size={16} /> Start instant meeting
          </Button>
          <Button onClick={onSchedule} type="button">
            <Icon name="calendar-plus" size={16} /> Schedule {label}
          </Button>
        </div>
      </header>

      <div className="grid k4 metric-grid">
        <Metric
          icon="video"
          label={`${label} meetings`}
          value={meetings.length}
          detail="Scheduled and past"
          variant="neutral"
        />
        <Metric
          icon="calendar-clock"
          label="Upcoming"
          value={upcomingMeetings.length}
          detail="Scheduled ahead"
          variant="accent"
        />
        <Metric
          icon="decision"
          label="Decisions recorded"
          value={totalDecisions}
          detail={`${totalDecisions} in minutes`}
          variant="success"
        />
        <Metric
          icon="file-text"
          label="Awaiting minutes"
          value={awaitingMinutes}
          detail={awaitingMinutes ? 'Needs summary' : 'All minutes logged'}
          variant={awaitingMinutes ? 'danger' : 'success'}
        />
      </div>

      <section aria-labelledby="meeting-summaries-title" className={`card sp meeting-summaries-card ${isGoogle ? 'google' : 'zoom'}`}>
        <div className="section-head-row">
          <div className="row">
            <span className="meeting-summary-icon"><Icon name="file-text" size={17} /></span>
            <div>
              <h2 id="meeting-summaries-title">{label} meeting summaries</h2>
              <p className="meeting-summary-description">Review saved minutes or browse examples of clear meeting summaries.</p>
            </div>
          </div>
          <span className="pill">{summarizedMeetings.length} saved</span>
        </div>
        {summarizedMeetings.length > 0 ? (
          <div aria-label="Saved meeting summaries" className="meeting-summary-list">
            {summarizedMeetings.map((meeting) => (
              <button className="meeting-summary-item" key={meeting.id} onClick={() => onOpen(meeting)} type="button">
                <span className="meeting-summary-item-heading">
                  <span className="meeting-summary-item-title">{meeting.title}</span>
                  <span className="meeting-summary-item-date">{new Date(meeting.start).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </span>
                <span className="meeting-summary-text">{meeting.summary}</span>
                <span className="meeting-summary-meta">
                  <span><Icon name="folder" size={13} /> {projectName(projects, meeting.project)}</span>
                  {!!meeting.decisions?.length && <span><Icon name="decision" size={13} /> {meeting.decisions.length} decision{meeting.decisions.length === 1 ? '' : 's'}</span>}
                  {!!meeting.actions?.length && <span><Icon name="check-square" size={13} /> {meeting.actions.length} action{meeting.actions.length === 1 ? '' : 's'}</span>}
                  <span className="meeting-summary-open">Open minutes <Icon name="arrow-right" size={13} /></span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="meeting-summary-empty">
            <span className="meeting-summary-empty-icon"><Icon name="file-text" size={20} /></span>
            <div>
              <b>No saved summaries yet</b>
              <p>The example cards below are for guidance only and are not meeting records.</p>
            </div>
            {editableMeeting && <Button onClick={() => onOpen(editableMeeting)}><Icon name="edit" size={14} /> Add a summary</Button>}
          </div>
        )}
        <div className="meeting-summary-examples-heading">
          <div><h3>Example summaries</h3><p>Illustrative content · not saved meeting data</p></div>
          <span>{exampleSummaries.length} examples</span>
        </div>
        <div aria-label="Illustrative meeting summary examples" className="meeting-summary-list">
          {exampleSummaries.map((example) => (
            <article className="meeting-summary-item meeting-summary-example" key={example.title}>
              <div className="meeting-summary-item-heading">
                <span className="meeting-summary-item-title">{example.title}</span>
                <span className="meeting-summary-example-badge">Example</span>
              </div>
              <span className="meeting-summary-example-focus"><Icon name="folder" size={13} /> {example.focus}</span>
              <p className="meeting-summary-text">{example.summary}</p>
              <div className="meeting-summary-example-details">
                <div><b><Icon name="decision" size={13} /> Decisions</b><ul>{example.decisions.map((decision) => <li key={decision}>{decision}</li>)}</ul></div>
                <div><b><Icon name="check-square" size={13} /> Action items</b><ul>{example.actions.map((action) => <li key={action}>{action}</li>)}</ul></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card sp">
        <div className="section-head-row">
          <div className="row">
            <Icon name="calendar-clock" size={18} />
            <h2>Upcoming {label} meetings</h2>
          </div>
          <span className="pill pill-info">{upcomingMeetings.length} upcoming</span>
        </div>
        <div className="meeting-list">
          {upcomingMeetings.map((meeting) => (
            <MeetingRow key={meeting.id} meeting={meeting} projects={projects} onOpen={onOpen} />
          ))}
          {!upcomingMeetings.length && (
            <div className="empty-state">
              <Icon name="calendar" size={28} />
              <p className="mu">No upcoming meetings scheduled. Click "Start instant meeting" or "Schedule" above.</p>
            </div>
          )}
        </div>
      </section>

      <section className="card sp">
        <div className="section-head-row">
          <div className="row">
            <Icon name="file-text" size={18} />
            <h2>Past meetings & minutes</h2>
          </div>
          <span className="pill">{pastMeetings.length} archived</span>
        </div>
        <div className="meeting-list">
          {pastMeetings.map((meeting) => (
            <MeetingRow key={meeting.id} meeting={meeting} projects={projects} onOpen={onOpen} />
          ))}
          {!pastMeetings.length && (
            <div className="empty-state">
              <Icon name="file-text" size={28} />
              <p className="mu">Past meeting transcripts and executive summaries will appear here.</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function CalendarPage({ date, setDate, meetings, tasks, onOpen, onSchedule }) {
  const [selectedDay, setSelectedDay] = useState(() => new Date())
  const year = date.getFullYear(); const month = date.getMonth()
  const first = new Date(year, month, 1); const offset = (first.getDay() + 6) % 7
  const start = new Date(year, month, 1 - offset)
  const days = Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index))
  const iso = (day) => day.toLocaleDateString('en-CA')
  const selectDay = (day) => {
    setSelectedDay(day)
    if (day.getFullYear() !== year || day.getMonth() !== month) setDate(new Date(day.getFullYear(), day.getMonth(), 1))
  }
  useEffect(() => {
    if (selectedDay.getFullYear() !== year || selectedDay.getMonth() !== month) setSelectedDay(new Date(year, month, 1))
  }, [year, month, selectedDay])
  const selectedKey = iso(selectedDay)
  const selectedMeetings = meetings.filter((meeting) => iso(new Date(meeting.start)) === selectedKey)
  const selectedTasks = tasks.filter((task) => task.due === selectedKey)

  return <>
    <header className="top calendar-top"><div><h1>Calendar</h1><div className="mu">Meetings and task due dates</div></div><Button className="calendar-schedule" onClick={onSchedule} primary>+ Schedule meeting</Button></header>
    <section className="calendar-shell">
      <div className="calendar-toolbar">
        <div className="calendar-month">
          <button aria-label="Previous month" className="calendar-arrow" onClick={() => setDate(new Date(year, month - 1, 1))} type="button"><Icon name="chevron-left" size={18} /></button>
          <h2>{date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
          <button aria-label="Next month" className="calendar-arrow" onClick={() => setDate(new Date(year, month + 1, 1))} type="button"><Icon name="chevron-right" size={18} /></button>
        </div>
        <Button onClick={() => { const current = new Date(); setDate(current); setSelectedDay(current) }}>Today</Button>
      </div>
      <div className="calg">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <div className="h" key={day}>{day}</div>)}{days.map((day) => {
      const dateKey = iso(day)
      const dayTasks = tasks.filter((task) => task.due === dateKey)
      const dayMeetings = meetings.filter((meeting) => iso(new Date(meeting.start)) === dateKey)
      const selected = dateKey === selectedKey
      return <div aria-label={`${dateKey}${dayMeetings.length + dayTasks.length ? `, ${dayMeetings.length + dayTasks.length} events` : ''}`} className={`cd${day.getMonth() === month ? '' : ' o'}${dateKey === today() ? ' td' : ''}${selected ? ' sel' : ''}`} key={dateKey}>
        <button aria-label={`Select ${dateKey}`} aria-pressed={selected} className="n" onClick={() => selectDay(day)}>{day.getDate()}</button>
        {dayMeetings.slice(0, 2).map((meeting) => <button className="ch calendar-chip" key={meeting.id} onClick={() => onOpen({ kind: 'meeting', item: meeting })}>{meeting.title}</button>)}
        {dayTasks.slice(0, 2).map((task) => <button className={`ch tk${isLate(task) ? ' l' : ''} calendar-chip`} key={task.id} onClick={() => onOpen({ kind: 'task', item: task })}>{task.title}</button>)}
        {dayMeetings.length + dayTasks.length > 4 && <button className="calendar-more" onClick={() => selectDay(day)}>+{dayMeetings.length + dayTasks.length - 4} more</button>}
        <span aria-hidden="true" className="cal-dots">{[...dayMeetings.map(() => 'meeting'), ...dayTasks.map((task) => isLate(task) ? 'late' : 'task')].slice(0, 4).map((kind, index) => <i className={kind} key={index} />)}</span>
      </div>
      })}</div>
      <section aria-live="polite" className="calendar-agenda">
        <div className="calendar-agenda-head"><div><span className="eyebrow">YOUR SCHEDULE</span><h2>{selectedDay.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h2></div><span className="pill">{selectedMeetings.length + selectedTasks.length} events</span></div>
        {[...selectedMeetings.map((item) => ({ kind: 'meeting', item, time: item.start })), ...selectedTasks.map((item) => ({ kind: 'task', item, time: 0 }))].sort((a, b) => a.time - b.time).map(({ kind, item }) => {
          const isMeeting = kind === 'meeting'
          return <button className="calendar-agenda-event" key={`${kind}-${item.id}`} onClick={() => onOpen({ kind, item })}>
            <span className={`agenda-icon${isMeeting ? ' meeting' : ' task'}`}><Icon name={isMeeting ? (item.platform === 'google' ? 'google-meet' : 'zoom') : 'check-square'} size={18} /></span>
            <span className="agenda-copy"><b>{item.title}</b><span>{isMeeting ? `${new Date(item.start).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} · ${item.platform === 'google' ? 'Google Meet' : 'Zoom'}` : `${item.status || 'To Do'} · ${item.assignee || item.assignees?.join(', ') || 'Unassigned'}`}</span></span>
            <span className="agenda-chevron"><Icon name="chevron-right" size={16} /></span>
          </button>
        })}
        {!selectedMeetings.length && !selectedTasks.length && <div className="calendar-empty"><Icon name="calendar" size={32} /><b>Nothing planned for this day</b><span>Pick another day or schedule a meeting.</span></div>}
      </section>
    </section>
  </>
}

function ProjectsPage({ projects, tasks, onSave, config, newProject, setNewProject, newColor, setNewColor, onError }) {
  async function save(updated) {
    try {
      await onSave(updated)
      return true
    } catch (cause) {
      onError(cause.message)
      return false
    }
  }
  return <>
    <header className="top">
      <div><h1>Projects</h1><div className="mu">Natheelco holding and its sub-projects</div></div>
    </header>
    <div className="grid k4 metric-grid">
      {projects.map((project) => {
        const scoped = tasks.filter((task) => task.project === project.id || (!project.parent && projects.find((item) => item.id === task.project)?.parent === project.id))
        const done = scoped.filter((task) => task.status === 'Done').length
        const rename = async () => {
          const name = window.prompt('Project name', project.name)
          if (!name?.trim()) return
          await save({
            ...config,
            projects: config.projects.map((item) => item.id === project.id ? { ...item, name: name.trim() } : item),
          })
        }
        const remove = async () => {
          if (!window.confirm('Delete this project? Its tasks will be kept.')) return
          await save({ ...config, projects: config.projects.filter((item) => item.id !== project.id) })
        }
        return (
          <div className="card project-card" key={project.id} style={{ borderLeftColor: project.color }}>
            <div className="project-card-header">
              <span className="dot" style={{ background: project.color }} />
              <h2>{project.name}</h2>
            </div>
            <div className="project-task-count"><b>{scoped.length}</b> tasks</div>
            <div className="bar"><i style={{ width: `${scoped.length ? done / scoped.length * 100 : 0}%`, background: project.color }} /></div>
            <p className="mu">{done} done • {scoped.filter(isLate).length} overdue</p>
            <div className="row">
              <Button onClick={rename}>Rename</Button>
              {project.parent && <Button onClick={remove}>Delete</Button>}
            </div>
          </div>
        )
      })}
    </div>
    <section className="card sp">
      <h2>Add a new project</h2>
      <div className="row">
        <input onChange={(event) => setNewProject(event.target.value)} placeholder="Project name" value={newProject} />
        <input onChange={(event) => setNewColor(event.target.value)} type="color" value={newColor} />
        <Button disabled={!newProject.trim()} onClick={async () => {
          const name = newProject.trim()
          const saved = await save({ ...config, projects: [...config.projects, { id: `p${Date.now()}`, name, color: newColor, parent: 'nathilco' }] })
          if (saved) setNewProject('')
        }} primary>Add project</Button>
      </div>
    </section>
  </>
}

function TeamPage({ config, setConfig, saveConfig, people, kpis, history, onImport, onRemoveHistory, onChangePin, onLogo, onSelectEmployee, onError, onSuccess }) {
  const [employee, setEmployee] = useState('')
  const patch = (key, value) => setConfig((current) => ({ ...current, [key]: value }))
  async function runAction(action, successMessage) {
    try {
      await action()
      if (successMessage) onSuccess(successMessage)
    } catch (cause) {
      onError(cause.message)
    }
  }
  return <>
    <header className="top"><div><h1>Team & KPIs</h1><div className="mu">Manage employees, imports, and the KPI model</div></div><Button onClick={onChangePin}>Change PIN</Button></header>
    <section className="card hub"><div className="modal-header team-import-header" style={{ marginBottom: 12 }}><div className="modal-title-wrap"><span className="modal-icon-badge"><Icon name="upload" size={20} /></span><div><h2>Past work from Google Sheets / Excel</h2><div className="mu">{history.length} imported row(s); historical work counts in KPI scores.</div></div></div><div className="row team-import-actions"><Button onClick={onImport} primary>Import spreadsheet</Button>{history.length > 0 && <Button onClick={() => runAction(onRemoveHistory)}>Remove imported rows</Button>}</div></div><div className="row sp"><Field label="Credit imported work to"><input onChange={(event) => patch('credit', { ...config.credit, name: event.target.value })} value={config.credit?.name || ''} /></Field><Field label="ClickUp list / folder / space"><input onChange={(event) => patch('credit', { ...config.credit, list: event.target.value })} value={config.credit?.list || ''} /></Field><Field label="ClickUp tag"><input onChange={(event) => patch('credit', { ...config.credit, tag: event.target.value })} value={config.credit?.tag || ''} /></Field><Field label="Tasks created on or before"><input onChange={(event) => patch('credit', { ...config.credit, before: event.target.value })} type="date" value={config.credit?.before || ''} /></Field><Button onClick={() => runAction(() => saveConfig(config), 'Credit rule saved.')} primary>Save credit rule</Button></div></section>
    <section className="card sp"><h2>Team members</h2><div className="grid k4">{kpis.map((row) => <div className="card" key={row.name}><b>{row.name}</b><p className="mu">{row.total} managed • {row.done} done • {row.overdue} overdue</p><div className="bar"><i style={{ width: `${row.score}%` }} /></div><span className="mu">KPI score {Math.round(row.score)}</span></div>)}</div></section>
    <div className="grid k2 sp"><section className="card"><h2>Employees</h2><div className="row"><input onChange={(event) => setEmployee(event.target.value)} placeholder="Employee name" value={employee} /><Button disabled={!employee.trim() || config.team.includes(employee.trim())} onClick={() => runAction(async () => { const name = employee.trim(); await saveConfig({ ...config, team: [...config.team, name] }); setEmployee('') }, 'Employee added.')} primary>Add</Button></div><div className="row sp">{config.team.map((name) => <span className="pill" key={name}>{name} <button aria-label={`Remove ${name}`} className="inline-remove" onClick={() => runAction(() => saveConfig({ ...config, team: config.team.filter((item) => item !== name) }), 'Employee removed.')}><Icon name="close" size={11} /></button></span>)}</div><p className="mu">ClickUp workspace members: {people.filter((name) => !config.team.includes(name)).join(', ') || 'Connect ClickUp to load members.'}</p></section>
      <section className="card"><h2>KPI model (editable)</h2><div className="row">{[['ontime', 'On-time'], ['target', 'Pace'], ['overdue', 'No-overdue'], ['volume', 'Volume']].map(([key, label]) => <Field key={key} label={label}><input min="0" onChange={(event) => patch('w', { ...config.w, [key]: +event.target.value })} type="number" value={config.w?.[key] ?? 0} /></Field>)}<Field label="Monthly target"><input min="1" onChange={(event) => patch('target', +event.target.value)} type="number" value={config.target} /></Field></div><Button className="sp" onClick={() => runAction(() => saveConfig(config), 'KPI model saved.')} primary>Save KPI model</Button></section>
      <section className="card"><h2>Emails & reminders</h2><Field label="CEO email"><input onChange={(event) => patch('ceoEmail', event.target.value)} value={config.ceoEmail || ''} /></Field>{people.filter((name) => name !== 'CEO').map((name) => <Field key={name} label={name}><input onChange={(event) => patch('emails', { ...config.emails, [name]: event.target.value })} value={config.emails?.[name] || ''} /></Field>)}<Button onClick={() => runAction(() => saveConfig(config), 'Emails saved.')} primary>Save emails</Button></section>
      <section className="card"><h2>Company logo</h2><input accept="image/png,image/jpeg,image/gif,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) runAction(() => onLogo(file), 'Logo updated.') }} type="file" /><p className="mu">PNG, JPG, GIF, or WebP up to 5 MB.</p></section>
    </div>
    <section className="card sp"><h2>Employee scorecard</h2><KpiTable rows={kpis} onSelect={onSelectEmployee} /></section>
  </>
}

function HumanResourcesPage() {
  const modules = [
    {
      id: 'attendance', title: 'Attendance & time', description: 'Working hours, check-ins, absences, and attendance summaries.',
      icon: 'calendar-clock', tone: 'blue', fields: [
        { key: 'employee', label: 'Employee', required: true },
        { key: 'date', label: 'Date', type: 'date', required: true },
        { key: 'checkIn', label: 'Check-in', type: 'time' },
        { key: 'checkOut', label: 'Check-out', type: 'time' },
        { key: 'status', label: 'Status', type: 'select', options: ['Present', 'Late', 'Absent', 'Remote'], required: true },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ],
    },
    {
      id: 'leave', title: 'Leave management', description: 'Leave balances, requests, approvals, and absence calendar.',
      icon: 'calendar', tone: 'violet', fields: [
        { key: 'employee', label: 'Employee', required: true },
        { key: 'leaveType', label: 'Leave type', type: 'select', options: ['Annual leave', 'Sick leave', 'Unpaid leave', 'Other'], required: true },
        { key: 'startDate', label: 'Start date', type: 'date', required: true },
        { key: 'endDate', label: 'End date', type: 'date', required: true },
        { key: 'status', label: 'Request status', type: 'select', options: ['Pending', 'Approved', 'Declined'], required: true },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ],
    },
    {
      id: 'payroll', title: 'Payroll & compensation', description: 'Payroll periods, compensation records, and benefits administration.',
      icon: 'wallet', tone: 'green', fields: [
        { key: 'period', label: 'Pay period', required: true },
        { key: 'payDate', label: 'Pay date', type: 'date' },
        { key: 'status', label: 'Payroll status', type: 'select', options: ['Draft', 'In review', 'Ready', 'Paid'], required: true },
        { key: 'benefits', label: 'Benefits / compensation notes', type: 'textarea' },
      ],
    },
    {
      id: 'recruitment', title: 'Recruitment', description: 'Open positions, candidate stages, interviews, and hiring decisions.',
      icon: 'user-plus', tone: 'amber', fields: [
        { key: 'position', label: 'Position', required: true },
        { key: 'department', label: 'Department' },
        { key: 'candidate', label: 'Candidate' },
        { key: 'stage', label: 'Hiring stage', type: 'select', options: ['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Not selected'], required: true },
        { key: 'nextInterview', label: 'Next interview', type: 'date' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ],
    },
    {
      id: 'onboarding', title: 'Onboarding', description: 'New-hire checklists, required documents, and onboarding progress.',
      icon: 'check-square', tone: 'teal', fields: [
        { key: 'employee', label: 'New employee', required: true },
        { key: 'startDate', label: 'Start date', type: 'date', required: true },
        { key: 'manager', label: 'Manager' },
        { key: 'status', label: 'Onboarding status', type: 'select', options: ['Not started', 'In progress', 'Complete'], required: true },
        { key: 'checklist', label: 'Checklist / notes', type: 'textarea' },
      ],
    },
    {
      id: 'learning', title: 'Learning & development', description: 'Training plans, course completion, and development records.',
      icon: 'book-open', tone: 'indigo', fields: [
        { key: 'course', label: 'Course / training', required: true },
        { key: 'employee', label: 'Employee', required: true },
        { key: 'provider', label: 'Provider' },
        { key: 'dueDate', label: 'Due date', type: 'date' },
        { key: 'status', label: 'Training status', type: 'select', options: ['Planned', 'In progress', 'Completed'], required: true },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ],
    },
    {
      id: 'policies', title: 'Policies & compliance', description: 'HR policies, acknowledgements, and compliance documentation.',
      icon: 'file-check', tone: 'rose', fields: [
        { key: 'policy', label: 'Policy / document', required: true },
        { key: 'category', label: 'Category' },
        { key: 'reviewDate', label: 'Review date', type: 'date' },
        { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Active', 'Review due', 'Archived'], required: true },
        { key: 'notes', label: 'Notes / acknowledgement details', type: 'textarea' },
      ],
    },
  ]
  const [records, setRecords] = useState([])
  const [storageReady, setStorageReady] = useState(false)
  const [storageError, setStorageError] = useState('')
  const [activeModuleId, setActiveModuleId] = useState('')
  const [editingRecord, setEditingRecord] = useState(null)
  const [formData, setFormData] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('taskflow_hr_records')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (!Array.isArray(parsed) || parsed.some((record) => (
          !record ||
          typeof record.id !== 'string' ||
          !modules.some((module) => module.id === record.module) ||
          !record.data ||
          typeof record.data !== 'object' ||
          Array.isArray(record.data) ||
          Object.values(record.data).some((value) => typeof value !== 'string')
        ))) throw new Error('Stored HR data has an invalid format.')
        setRecords(parsed)
      }
    } catch (error) {
      setStorageError(`Could not load HR records from this browser: ${error.message}`)
    } finally {
      setStorageReady(true)
    }
  }, [])

  const saveRecords = (nextRecords) => {
    try {
      localStorage.setItem('taskflow_hr_records', JSON.stringify(nextRecords))
      setRecords(nextRecords)
      setStorageError('')
      setEditingRecord(null)
      setFormData({})
      setShowForm(false)
    } catch (error) {
      setStorageError(`Could not save HR records in this browser: ${error.message}`)
    }
  }
  const activeModule = modules.find((module) => module.id === activeModuleId)
  const moduleRecords = records.filter((record) => record.module === activeModuleId)
  const visibleRecords = moduleRecords.filter((record) => JSON.stringify(record.data).toLowerCase().includes(search.trim().toLowerCase()))
  const startCreate = () => {
    setEditingRecord(null)
    setFormData({})
    setShowForm(true)
  }
  const startEdit = (record) => {
    setEditingRecord(record)
    setFormData(record.data)
    setShowForm(true)
  }
  const submitRecord = (event) => {
    event.preventDefault()
    if (!activeModule) return
    const now = new Date().toISOString()
    const record = {
      id: editingRecord?.id || `hr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      module: activeModuleId,
      data: formData,
      createdAt: editingRecord?.createdAt || now,
      updatedAt: now,
    }
    saveRecords(editingRecord ? records.map((item) => item.id === editingRecord.id ? record : item) : [record, ...records])
  }
  const deleteRecord = (record) => {
    const label = Object.values(record.data).find(Boolean) || activeModule?.title || 'this record'
    if (window.confirm(`Delete "${label}"? This cannot be undone.`)) saveRecords(records.filter((item) => item.id !== record.id))
  }
  const recordTitle = (module, record) => record.data[module.fields.find((field) => field.key !== 'notes' && field.key !== 'benefits' && field.key !== 'checklist')?.key] || 'Untitled record'

  return (
    <section aria-labelledby="hr-page-title" className="hr-page">
      <header className="hr-page-heading">
        <div>
          <span className="gulf-eyebrow"><Icon name="hr" size={15} /> HUMAN RESOURCES</span>
          <h1 id="hr-page-title">{activeModule ? activeModule.title : 'HR Management'}</h1>
          <p>{activeModule ? activeModule.description : 'Create and manage HR records across your organization.'}</p>
        </div>
        {activeModule ? <Button onClick={() => { setActiveModuleId(''); setSearch(''); setEditingRecord(null); setShowForm(false) }}><Icon name="chevron-left" size={15} /> All HR modules</Button> : <span className="hr-system-status"><i /> HR records stored in this browser</span>}
      </header>

      {storageError && <p className="hr-storage-error" role="alert">{storageError}</p>}
      {!activeModule && <>
        <div className="hr-setup-notice" role="status">
          <span className="hr-notice-icon"><Icon name="info" size={17} /></span>
          <div><b>HR workspace</b><p>Create and update records in each module below. Data is saved only in this browser and is not shared or securely backed up. Do not enter sensitive payroll amounts or confidential personal information.</p></div>
        </div>
        <div className="hr-module-heading"><div><h2>HR operations</h2><p>Select a module to add or manage its records</p></div><span>{modules.length} modules</span></div>
        <div className="hr-module-grid">
          {modules.map((module) => {
            const count = records.filter((record) => record.module === module.id).length
            return (
              <button className="hr-module-card" key={module.id} onClick={() => setActiveModuleId(module.id)} type="button">
                <span className="hr-module-card-top">
                  <span className={`hr-module-icon ${module.tone}`}><Icon name={module.icon} size={19} /></span>
                  <span className={`hr-module-status${count ? ' configured' : ''}`}>{count ? `${count} record${count === 1 ? '' : 's'}` : 'No records'}</span>
                </span>
                <span className="hr-module-card-title">{module.title}</span>
                <span className="hr-module-card-description">{module.description}</span>
                <span className="hr-module-card-footer"><span><i /> {count ? 'Manage records' : 'Create first record'}</span><Icon name="chevron-right" size={15} /></span>
              </button>
            )
          })}
        </div>
      </>}

      {activeModule && (
        <section aria-label={`${activeModule.title} records`} className="hr-records-panel">
          <div className="hr-records-toolbar">
            <div><span className={`hr-module-icon ${activeModule.tone}`}><Icon name={activeModule.icon} size={19} /></span><div><h2>{activeModule.title}</h2><p>{moduleRecords.length} record{moduleRecords.length === 1 ? '' : 's'} saved in this browser</p></div></div>
            <div><label className="hr-record-search"><Icon name="search" size={15} /><input aria-label={`Search ${activeModule.title}`} onChange={(event) => setSearch(event.target.value)} placeholder="Search records" value={search} /></label><Button className="p" disabled={!storageReady} onClick={startCreate}><Icon name="plus" size={15} /> Add record</Button></div>
          </div>

          {showForm && (
            <form className="hr-record-form" onSubmit={submitRecord}>
              <div className="hr-record-form-heading"><div><h3>{editingRecord ? 'Edit record' : 'Create record'}</h3><p>Complete the fields below and save your changes.</p></div><button aria-label="Close record form" className="btn-icon-close" onClick={() => { setEditingRecord(null); setFormData({}); setShowForm(false) }} type="button"><Icon name="close" size={16} /></button></div>
              <div className="hr-record-fields">
                {activeModule.fields.map((field) => (
                  <label className={`hr-record-field${field.type === 'textarea' ? ' wide' : ''}`} key={field.key}>
                    <span>{field.label}{field.required && <i>Required</i>}</span>
                    {field.type === 'select' ? <select onChange={(event) => setFormData((current) => ({ ...current, [field.key]: event.target.value }))} required={field.required} value={formData[field.key] || ''}><option value="">Select…</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select>
                      : field.type === 'textarea' ? <textarea onChange={(event) => setFormData((current) => ({ ...current, [field.key]: event.target.value }))} rows={3} value={formData[field.key] || ''} />
                        : <input onChange={(event) => setFormData((current) => ({ ...current, [field.key]: event.target.value }))} required={field.required} type={field.type || 'text'} value={formData[field.key] || ''} />}
                  </label>
                ))}
              </div>
              <div className="hr-record-form-actions"><Button onClick={() => { setEditingRecord(null); setFormData({}); setShowForm(false) }} type="button">Cancel</Button><Button className="p" disabled={!storageReady} type="submit"><Icon name="check" size={15} /> Save record</Button></div>
            </form>
          )}

          {visibleRecords.length ? (
            <div className="hr-record-list">
              {visibleRecords.map((record) => (
                <article className="hr-record-card" key={record.id}>
                  <div className="hr-record-card-heading"><div><span className={`hr-module-icon ${activeModule.tone}`}><Icon name={activeModule.icon} size={17} /></span><div><h3>{recordTitle(activeModule, record)}</h3><small>Updated {new Date(record.updatedAt || record.createdAt).toLocaleString()}</small></div></div><div><Button onClick={() => startEdit(record)}><Icon name="edit" size={14} /> Edit</Button><Button className="hr-delete-button" onClick={() => deleteRecord(record)}><Icon name="trash" size={14} /> Delete</Button></div></div>
                  <dl>{activeModule.fields.filter((field) => record.data[field.key]).map((field) => <div key={field.key}><dt>{field.label}</dt><dd>{record.data[field.key]}</dd></div>)}</dl>
                </article>
              ))}
            </div>
          ) : !showForm ? (
            <div className="hr-record-empty"><span className={`hr-module-icon ${activeModule.tone}`}><Icon name={activeModule.icon} size={21} /></span><h3>{search ? 'No matching records' : `No ${activeModule.title.toLowerCase()} records yet`}</h3><p>{search ? 'Try another search.' : `Create a ${activeModule.title.toLowerCase()} record to get started.`}</p>{!search && <Button className="p" disabled={!storageReady} onClick={startCreate}><Icon name="plus" size={15} /> Create first record</Button>}</div>
          ) : null}
          <p className="hr-record-storage-note"><Icon name="info" size={14} /> Records are saved in this browser only. They are not synced, backed up, or suitable for sensitive payroll or personal data.</p>
        </section>
      )}
    </section>
  )
}

function AnalyticsTrendChart({ data, completedCount, changeLabel, changeTone }) {
  const width = 640
  const height = 220
  const left = 44
  const right = 624
  const top = 18
  const bottom = 168
  const maxValue = Math.max(2, Math.ceil(Math.max(0, ...data.map((item) => item.count)) * 1.25))
  const points = data.map((item, index) => ({
    ...item,
    x: left + (right - left) * index / Math.max(data.length - 1, 1),
    y: bottom - item.count / maxValue * (bottom - top),
  }))
  const linePath = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')
  const areaPath = `${linePath} L ${right} ${bottom} L ${left} ${bottom} Z`
  const gridValues = [0, Math.ceil(maxValue / 2), maxValue].filter((value, index, values) => values.indexOf(value) === index)

  return (
    <section aria-labelledby="analytics-trend-title" className="analytics-chart-card analytics-trend-card">
      <header className="analytics-chart-heading">
        <div>
          <span className="analytics-eyebrow"><Icon name="chart" size={13} /> WORK COMPLETED</span>
          <h2 id="analytics-trend-title">Weekly completion trend</h2>
          <p>Tasks completed each day over the last 7 days</p>
        </div>
        <span className={`analytics-trend-change ${changeTone}`}><Icon name={changeTone === 'positive' ? 'trending-up' : changeTone === 'negative' ? 'trending-down' : 'minus'} size={14} />{changeLabel}</span>
      </header>
      <div className="analytics-trend-total"><strong>{completedCount}</strong><span>completed this week</span></div>
      <div className="analytics-chart-plot">
        <svg aria-label={`Daily task completions: ${data.map((item) => `${item.label} ${item.count}`).join(', ')}`} className="analytics-line-chart" preserveAspectRatio="none" role="img" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="analytics-trend-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#5278f6" stopOpacity=".24" />
              <stop offset="100%" stopColor="#5278f6" stopOpacity=".01" />
            </linearGradient>
            <linearGradient id="analytics-trend-stroke" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#7c5cf4" />
              <stop offset="100%" stopColor="#3187f6" />
            </linearGradient>
          </defs>
          {gridValues.map((value, index) => {
            const y = bottom - value / maxValue * (bottom - top)
            return <g className="analytics-grid-line" key={`${value}-${index}`}><line x1={left} x2={right} y1={y} y2={y} /><text x="31" y={y + 4}>{value}</text></g>
          })}
          <path className="analytics-chart-area" d={areaPath} />
          <path className="analytics-chart-line" d={linePath} pathLength={1} />
          {points.map((point) => <g className="analytics-chart-point" key={point.label}><circle cx={point.x} cy={point.y} r="5" /><title>{`${point.longLabel}: ${point.count} completed`}</title></g>)}
          {points.map((point) => <text className="analytics-axis-label" key={`label-${point.label}`} textAnchor="middle" x={point.x} y="199">{point.label}</text>)}
        </svg>
      </div>
    </section>
  )
}

function AnalyticsCompletionChart({ completed, open, rate, overdue, atRisk }) {
  const radius = 43
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(100, Math.max(0, rate))
  return (
    <section aria-labelledby="analytics-completion-title" className="analytics-chart-card analytics-completion-card">
      <header className="analytics-chart-heading">
        <div><span className="analytics-eyebrow"><Icon name="target" size={13} /> OVERALL DELIVERY</span><h2 id="analytics-completion-title">Completion rate</h2><p>Progress across all managed tasks</p></div>
        <span className="analytics-chart-menu-icon"><Icon name="more-horizontal" size={17} /></span>
      </header>
      <div className="analytics-donut-wrap">
        <svg aria-label={`${progress}% completion rate: ${completed} complete, ${open} open`} className="analytics-donut-chart" role="img" viewBox="0 0 120 120">
          <defs><linearGradient id="analytics-donut-gradient" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#8062f6" /><stop offset="100%" stopColor="#2998f4" /></linearGradient></defs>
          <circle className="analytics-donut-track" cx="60" cy="60" r={radius} />
          <circle className="analytics-donut-progress" cx="60" cy="60" r={radius} strokeDasharray={`${circumference * progress / 100} ${circumference}`} />
        </svg>
        <div className="analytics-donut-center"><strong>{progress}%</strong><span>complete</span></div>
      </div>
      <div className="analytics-donut-legend">
        <span><i className="complete-dot" /><span>Completed</span><b>{completed}</b></span>
        <span><i className="open-dot" /><span>Open</span><b>{open}</b></span>
      </div>
      <div className="analytics-health-row">
        <div><span>Overdue</span><b className={overdue ? 'health-alert' : ''}>{overdue}</b></div>
        <div><span>At risk</span><b className={atRisk ? 'health-warn' : ''}>{atRisk}</b></div>
      </div>
    </section>
  )
}

function AnalyticsTeamChart({ rows, onSelectEmployee }) {
  const leaders = rows.filter((row) => row.total > 0).slice(0, 5)
  return (
    <section aria-labelledby="analytics-team-title" className="analytics-chart-card analytics-team-card">
      <header className="analytics-chart-heading">
        <div><span className="analytics-eyebrow"><Icon name="users" size={13} /> TEAM SCORE</span><h2 id="analytics-team-title">Top performers</h2><p>Weighted KPI score across current tasks</p></div>
        <span className="analytics-chart-menu-icon"><Icon name="trophy" size={16} /></span>
      </header>
      {leaders.length ? <div className="analytics-leader-list">{leaders.map((row, index) => {
        const score = Math.max(0, Math.min(100, Math.round(row.score)))
        return (
          <button className="analytics-leader" key={row.name} onClick={() => onSelectEmployee(row.name)} type="button" title={`Filter analytics for ${row.name}`}>
            <span className={`analytics-rank rank-${index + 1}`}>{index + 1}</span>
            <span className="analytics-leader-main"><span className="analytics-leader-name">{row.name}</span><span className="analytics-score-track"><i style={{ width: `${score}%`, animationDelay: `${index * 90}ms` }} /></span></span>
            <span className="analytics-leader-score">{score}<small>%</small></span>
          </button>
        )
      })}</div> : <div className="analytics-chart-empty"><Icon name="users" size={21} /><span>No scored employee tasks yet</span></div>}
      <div className="analytics-team-footnote"><Icon name="info" size={13} /> Select a teammate to filter this report</div>
    </section>
  )
}

function AnalyticsPage({ tasks, rows, projects, filters, setFilters, people, members, config, onUpdate, onRemove, onSelectEmployee }) {
  const complete = tasks.filter((task) => task.status === 'Done')
  const onTime = complete.filter((task) => !task.due || task.doneAt <= endOf(task.due))
  const overdue = tasks.filter(isLate)
  const atRisk = tasks.filter((task) => task.status !== 'Done' && task.due && endOf(task.due) <= Date.now() + 2 * 86_400_000)
  const recent = complete.filter((task) => task.doneAt > Date.now() - 7 * 86_400_000)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const trendDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(todayStart)
    date.setDate(date.getDate() - (6 - index))
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    return {
      date,
      count: complete.filter((task) => task.doneAt >= date.getTime() && task.doneAt < nextDate.getTime()).length,
      label: date.toLocaleDateString(undefined, { weekday: 'short' }),
      longLabel: date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
    }
  })
  const weekStart = new Date(trendDates[0].date)
  const previousWeekStart = new Date(weekStart)
  previousWeekStart.setDate(previousWeekStart.getDate() - 7)
  const previousWeekCount = complete.filter((task) => task.doneAt >= previousWeekStart.getTime() && task.doneAt < weekStart.getTime()).length
  const recentComplete = trendDates.reduce((sum, day) => sum + day.count, 0)
  const weeklyChange = previousWeekCount ? Math.round((recentComplete - previousWeekCount) / previousWeekCount * 100) : recentComplete ? 100 : 0
  const weeklyChangeLabel = previousWeekCount ? `${weeklyChange > 0 ? '+' : ''}${weeklyChange}% vs last week` : recentComplete ? 'New activity this week' : 'No activity this week'
  const weeklyChangeTone = weeklyChange > 0 ? 'positive' : weeklyChange < 0 ? 'negative' : 'neutral'
  const completionRate = tasks.length ? Math.round(complete.length / tasks.length * 100) : 0
  return <>
    <header className="top"><div><h1>KPI Analytics</h1><div className="mu">Task-based performance • {tasks.length} tasks</div></div><div className="row"><ProjectSelect projects={projects} value={filters.project} onChange={(value) => setFilters({ ...filters, project: value })} /><PersonSelect people={people} value={filters.assignee} onChange={(value) => setFilters({ ...filters, assignee: value })} /></div></header>
    <section aria-label="Performance charts" className="analytics-visual-grid">
      <AnalyticsTrendChart changeLabel={weeklyChangeLabel} changeTone={weeklyChangeTone} completedCount={recentComplete} data={trendDates} />
      <AnalyticsCompletionChart atRisk={atRisk.length} completed={complete.length} open={tasks.length - complete.length} overdue={overdue.length} rate={completionRate} />
      <AnalyticsTeamChart onSelectEmployee={onSelectEmployee} rows={rows} />
    </section>
    <div className="grid k4 metric-grid"><Metric label="Completion rate" value={`${completionRate}%`} detail={`${complete.length} of ${tasks.length}`} icon="percent" variant="success" /><Metric label="On-time delivery" value={`${complete.length ? Math.round(onTime.length / complete.length * 100) : 0}%`} detail={`${onTime.length} completed on time`} icon="clock" variant="success" /><Metric label="Overdue" value={overdue.length} detail={`${tasks.length - complete.length} open`} icon="alert-triangle" variant={overdue.length > 0 ? 'danger' : 'success'} /><Metric label="Completed • 7 days" value={recent.length} detail={`${atRisk.length} at risk (due ≤ 2d)`} icon="check-circle" variant="neutral" /></div>
    <div className="grid k2 sp"><section className="card"><h2>Tasks by project</h2>{projects.map((project) => { const count = tasks.filter((task) => task.project === project.id).length; return count ? <div className="project-progress" key={project.id}><span>{project.name}</span><b>{count}</b><div className="bar"><i style={{ width: `${tasks.length ? count / tasks.length * 100 : 0}%`, background: project.color }} /></div></div> : null })}</section><section className="card"><h2>Open tasks by priority</h2>{PRIORITIES.slice().reverse().map((priority) => <div className="status-line" key={priority}><span className="dot" style={{ background: PRIORITY_COLORS[priority] }} />{priority}<b>{tasks.filter((task) => task.priority === priority && task.status !== 'Done').length}</b></div>)}</section></div>
    <section className="card sp"><h2>Tasks at risk</h2><TaskTable tasks={atRisk} projects={projects} members={members} onUpdate={onUpdate} onRemove={onRemove} /></section>
    <section className="card sp"><h2>Completed in the last 7 days</h2><div aria-label="Completed tasks in the last 7 days. Scroll horizontally to view all columns" className="scroll" role="region" tabIndex={0}><table><thead><tr><th>Task</th><th>By</th><th>Completed</th><th>On-time</th></tr></thead><tbody>{recent.map((task) => <tr key={task.id}><td>{task.title}</td><td>{task.assignees?.join(', ') || '—'}</td><td>{new Date(task.doneAt).toLocaleString()}</td><td>{!task.due || task.doneAt <= endOf(task.due) ? <Icon name="check" size={14} color="var(--ok)" /> : <span className="late">Late</span>}</td></tr>)}</tbody></table></div>{config.ceoEmail && <a className="btn" href={`mailto:${encodeURIComponent(config.ceoEmail)}?subject=${encodeURIComponent('Completed tasks – ' + today())}`}><Icon name="mail" size={14} /> Email CEO this list</a>}</section>
    <section className="card sp"><h2>Employee scorecard</h2><KpiTable rows={rows} members={members} onSelect={onSelectEmployee} /></section>
  </>
}
