import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './styles.css'

const FRONTEND_ONLY = import.meta.env.DEV && import.meta.env.VITE_FRONTEND_ONLY === 'true'
const STATUSES = ['To Do', 'In Progress', 'Review', 'Done']
const STATUS_COLORS = { 'To Do': '#94a3b8', 'In Progress': '#3b82f6', Review: '#f59e0b', Done: '#10b981' }
const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent']
const PRIORITY_COLORS = { Low: '#94a3b8', Normal: '#3b82f6', High: '#f59e0b', Urgent: '#ef4444' }
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
  ['dash', '📊', 'CEO Dashboard'],
  ['meet', '🎥', 'Google Meet'],
  ['zoom', '🎥', 'Zoom'],
  ['cal', '📅', 'Calendar & Reminders'],
  ['kpi', '📈', 'KPI Analytics'],
  ['day', '✅', 'My Day'],
  ['tasks', '🗂', 'Tasks'],
  ['clickup', '🟣', 'ClickUp'],
  ['projects', '🏢', 'Projects'],
  ['team', '⚙️', 'Team & KPIs'],
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
  const response = await fetch(path, { cache: 'no-store', ...init })
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

function PinGate({ auth, demoPin, onPinCreated, onAuthenticated }) {
  const [pin, setPin] = useState('')
  const [firstPin, setFirstPin] = useState('')
  const [message, setMessage] = useState('')
  const [remember, setRemember] = useState(false)
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
        if (setup) {
          onPinCreated(pin)
          onAuthenticated({ authed: true, configured: true, frontendOnly: true })
        } else if (pin === demoPin) {
          onAuthenticated({ ...auth, authed: true })
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
        <p className="mu">{setup ? firstPin ? 'Confirm your new PIN' : 'Create a PIN (4–8 digits) to protect this dashboard' : 'Enter your PIN to unlock the dashboard'}</p>
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
        <div className="row" style={{ justifyContent: 'space-between' }}><h2>New task</h2><button className="btn g" onClick={onClose} type="button">✕</button></div>
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
      <form className="mdl" onSubmit={async (event) => {
        event.preventDefault()
        if (busy) return
        setBusy(true)
        setError('')
        try {
          await onSave({ ...form, start: form.instant ? Date.now() : new Date(form.start).getTime() })
        } catch (cause) { setError(cause.message) } finally { setBusy(false) }
      }}>
        <div className="row" style={{ justifyContent: 'space-between' }}><h2>{form.instant ? 'Start' : 'Schedule'} {platform === 'google' ? 'Google Meet' : 'Zoom'}</h2><button className="btn g" onClick={onClose} type="button">✕</button></div>
        <Field label="Title"><input autoFocus onChange={(event) => update('title', event.target.value)} value={form.title} /></Field>
        <div className="f2">
          <Field label="Project"><select onChange={(event) => update('project', event.target.value)} value={form.project}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></Field>
          <Field label="Start"><input disabled={form.instant} onChange={(event) => update('start', event.target.value)} type="datetime-local" value={form.start} /></Field>
          <Field label="Duration (minutes)"><input min="5" max="600" onChange={(event) => update('duration', +event.target.value)} type="number" value={form.duration} /></Field>
          <Field label="Reminder (minutes before)"><input min="0" max="10080" onChange={(event) => update('reminder', +event.target.value)} type="number" value={form.reminder} /></Field>
        </div>
        <Field label="Agenda"><textarea onChange={(event) => update('agenda', event.target.value)} rows="3" value={form.agenda} /></Field>
        <Field label="Add attendee email"><div className="row"><input onChange={(event) => setAttendee(event.target.value)} onKeyDown={(event) => {
          if (event.key === 'Enter') { event.preventDefault(); addAttendee() }
        }} value={attendee} /><Button disabled={!attendee.trim() || form.attendees.includes(attendee.trim())} onClick={addAttendee} type="button">Add</Button></div></Field>
        <div className="row sp">{form.attendees.map((email) => <span className="pill" key={email}>{email}<button aria-label={`Remove ${email}`} className="inline-remove" onClick={() => update('attendees', form.attendees.filter((item) => item !== email))} type="button">×</button></span>)}</div>
        <div className="row sp"><label className="chk"><input checked={form.instant} onChange={(event) => update('instant', event.target.checked)} type="checkbox" /> Start instantly</label></div>
        {error && <p className="error">{error}</p>}
        <div className="row sp" style={{ justifyContent: 'flex-end' }}><Button disabled={busy} onClick={onClose} type="button">Cancel</Button><Button disabled={busy} primary type="submit">{busy ? 'Saving…' : form.instant ? 'Start meeting' : 'Schedule meeting'}</Button></div>
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
        <div className="row" style={{ justifyContent: 'space-between' }}><h2>📥 Import past work</h2><button className="btn g" onClick={onClose} type="button">✕</button></div>
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
          <div className="scroll sp"><table><thead><tr>{fields.slice(0, 6).map(([, label]) => <th key={label}>{label}</th>)}</tr></thead><tbody>{selectedRows.slice(0, 6).map((item, index) => <tr key={index}><td>{item.title}</td><td>{item.status}</td><td>{item.due || '—'}</td><td>{item.doneAt ? new Date(item.doneAt).toLocaleDateString() : '—'}</td><td>{item.assignee || '—'}</td><td>{projectName(projects, item.project)}</td></tr>)}</tbody></table></div>
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

export function App() {
  const [auth, setAuth] = useState(null)
  const [demoPin, setDemoPin] = useState('')
  const [page, setPage] = useState('dash')
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
    if (FRONTEND_ONLY) {
      setAuth({ configured: false, authed: false, frontendOnly: true })
    } else {
      request('/api/auth')
        .then((data) => { if (active) setAuth(data) })
        .catch((cause) => { if (active) { setAuth({ configured: true, authed: false }); showError(cause.message) } })
    }
    const lockHandler = () => setAuth((current) => ({ ...current, authed: false }))
    window.addEventListener('taskflow:locked', lockHandler)
    return () => { active = false; window.removeEventListener('taskflow:locked', lockHandler) }
  }, [showError])

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
    const project = projects.find((item) => item.id === projectId)
    return task.project === projectId || (!project?.parent && projects.find((item) => item.id === task.project)?.parent === projectId)
  }), [allTasks, projects])
  const scopedTasks = useMemo(() => projectScope(filters.project).filter((task) => {
    const matchesPerson = !filters.assignee || (task.assignees || [task.assignee]).includes(filters.assignee)
    const matchesStatus = !filters.status || (filters.status === 'Overdue' ? isLate(task) : task.status === filters.status)
    return matchesPerson && matchesStatus
  }), [filters.assignee, filters.status, projectScope])
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
  if (!auth.authed) return <PinGate auth={auth} demoPin={demoPin} onPinCreated={setDemoPin} onAuthenticated={setAuth} />

  const selectedProject = projects.find((project) => project.id === filters.project)
  const filteredClickup = visibleClickup
  const pageTitle = PAGES.find((item) => item[0] === page)?.[2] || 'CEO Dashboard'

  function Dashboard() {
    const completed = scopedTasks.filter((task) => task.status === 'Done')
    const overdue = scopedTasks.filter(isLate)
    const onTime = completed.filter((task) => !task.due || task.doneAt <= endOf(task.due))
    const projectsSummary = projects.filter((item) => item.parent).map((item) => {
      const work = projectScope(item.id)
      return { ...item, tasks: work.length, done: work.filter((task) => task.status === 'Done').length }
    })
    return <>
      <header className="top"><div><h1>CEO Dashboard</h1><div className="mu">Live view of every project and employee • {new Date().toDateString()}</div></div><div className="row"><ProjectSelect value={filters.project} projects={projects} onChange={(value) => setFilters({ ...filters, project: value })} /><NotificationButton count={reminders.length} onClick={() => setNotificationsOpen(!notificationsOpen)} /></div></header>
      <FilterChips filters={filters} setFilters={setFilters} projects={projects} />
      {overdue.length > 0 && <button className="alert" onClick={() => setFilters({ ...filters, status: filters.status === 'Overdue' ? '' : 'Overdue' })}><b>⚠ {overdue.length} overdue task(s)</b> — {overdue.slice(0, 4).map((task) => task.title).join(' | ')}</button>}
      <div className="grid k4">
        <Metric label="Tasks managed" value={scopedTasks.length} detail={`${scopedTasks.length - completed.length} open`} />
        <Metric label="Completed" value={completed.length} detail={`${scopedTasks.length ? Math.round(completed.length / scopedTasks.length * 100) : 0}% of tasks`} />
        <Metric label="On-time rate" value={`${completed.length ? Math.round(onTime.length / completed.length * 100) : 0}%`} detail={`${onTime.length} of ${completed.length} done`} />
        <Metric label="Overdue" value={overdue.length} detail={overdue.length ? 'Needs attention' : 'All on track'} />
        <Metric label="Team KPI score" value={Math.round(kpiRows.reduce((sum, row) => sum + row.score, 0) / (kpiRows.length || 1))} detail={`${kpiRows.length} employee(s)`} />
      </div>
      <div className="grid k2 sp">
        <div className="card"><h2>Status breakdown</h2>{STATUSES.map((status) => {
          const count = scopedTasks.filter((task) => task.status === status).length
          return <button className="status-line" key={status} onClick={() => setFilters({ ...filters, status: filters.status === status ? '' : status })}><span className="dot" style={{ background: STATUS_COLORS[status] }} />{status}<b>{count}</b><div className="bar"><i style={{ width: `${scopedTasks.length ? count / scopedTasks.length * 100 : 0}%`, background: STATUS_COLORS[status] }} /></div></button>
        })}</div>
        <div className="card"><h2>Progress by project</h2>{projectsSummary.map((project) => <button className="project-progress" key={project.id} onClick={() => setFilters({ ...filters, project: filters.project === project.id ? '' : project.id })}><span>{project.name}</span><b>{project.done}/{project.tasks}</b><div className="bar"><i style={{ width: `${project.tasks ? project.done / project.tasks * 100 : 0}%`, background: project.color }} /></div></button>)}</div>
      </div>
      <div className="card sp scroll"><h2>Employee KPI scorecard</h2><KpiTable rows={kpiRows} members={clickup.members} onSelect={(name) => setFilters({ ...filters, assignee: filters.assignee === name ? '' : name })} /></div>
      <div className="card sp scroll"><div className="row" style={{ justifyContent: 'space-between' }}><h2>Recently updated tasks</h2><Button onClick={() => setPage('tasks')}>Open Tasks →</Button></div><TaskTable tasks={[...scopedTasks].sort((a, b) => (b.updated || b.doneAt || 0) - (a.updated || a.doneAt || 0)).slice(0, 10)} projects={projects} members={clickup.members} onUpdate={updateTask} onRemove={removeTask} /></div>
      <MeetingSummary meetings={allMeetings} projects={projects} onOpen={setMeetingDetail} onCreate={() => setMeetingDialog('google')} onStart={startMeeting} />
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
    try {
      await request('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'change', current, pin: next }) })
      showToast('PIN changed.')
    } catch (cause) { showError(cause.message) }
  }

  function MainPage() {
    if (page === 'dash') return Dashboard()
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
      setAuth({ ...auth, authed: false })
      return
    }
    try {
      await request('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) })
      setAuth({ ...auth, authed: false })
    } catch (cause) {
      showError(cause.message)
    }
  }

  return (
    <>
      <div className="app">
        <aside>
          <div className="brand">{config.logo ? <img src={config.logo} alt="" /> : <div className="logo">N</div>}<span>Natheelco<br /><span className="mu">TaskFlow</span></span></div>
          <nav aria-label="Main navigation" className="primary-nav">
            {PAGES.map(([key, icon, label]) => <button className={page === key ? 'on' : ''} key={key} onClick={() => setPage(key)}><span className="nav-icon">{icon}</span><span className="nav-label">{label}</span></button>)}
            <button className="lkb" onClick={logout}><span className="nav-icon">🔒</span><span className="nav-label">Lock</span></button>
          </nav>
          <div className="sidebar-extra">
            <h4>ClickUp</h4>
            <div className="mu" style={{ padding: '0 12px 6px' }}>{clickupStatus}{lastSync ? <><br />Synced {Math.max(1, Math.round((Date.now() - lastSync) / 60_000))} min ago</> : null}</div>
            <button onClick={syncClickupNow}>↻ Sync now</button>
            {(clickup.workspaces || []).map((workspace) => <a className="ws" href={workspace.url} key={workspace.id} rel="noreferrer" target="_blank">↗ Open {workspace.name} in ClickUp</a>)}
            <h4>Projects</h4>
            {projects.map((project) => <button className={filters.project === project.id && page === 'tasks' ? 'on' : ''} key={project.id} onClick={() => { setFilters({ ...filters, project: project.id }); setPage('tasks') }}><span className="dot" style={{ background: project.color }} />{project.name}</button>)}
          </div>
        </aside>
        <main>
          {auth.frontendOnly && <div className="card sp" role="status">Frontend-only preview: the PIN is temporary and is not saved. Dashboard data and actions need the backend.</div>}
          {error && <div className="toast err react-toast" role="alert">{error}<button onClick={() => setError('')}>×</button></div>}
          {toast && <div className="toast react-toast" role="status">{toast}</div>}
          {notificationsOpen && <div className="card notifications"><div className="row" style={{ justifyContent: 'space-between' }}><b>Reminders</b><button className="btn g" onClick={() => { setReminders([]); setNotificationsOpen(false) }}>Close</button></div>{reminders.length ? reminders.map((meeting) => <button className="notification-item" key={meeting.id} onClick={() => { setMeetingDetail(meeting); setNotificationsOpen(false) }}>{meeting.title} • {fmtDay(meeting.start)}</button>) : <p className="mu">No new reminders.</p>}</div>}
          {MainPage()}
        </main>
      </div>
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

function Metric({ label, value, detail }) {
  return <div className="card kc"><div className="mu">{label}</div><div className="big">{value}</div><div className="mu">{detail}</div></div>
}

function ProjectSelect({ projects, value, onChange }) {
  return <select aria-label="Filter by project" onChange={(event) => onChange(event.target.value)} value={value}><option value="">All projects (Natheelco)</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
}

function PersonSelect({ people, value, onChange }) {
  return <select aria-label="Filter by employee" onChange={(event) => onChange(event.target.value)} value={value}><option value="">Everyone</option>{people.filter((person) => person !== 'CEO').map((person) => <option key={person}>{person}</option>)}</select>
}

function NotificationButton({ count, onClick }) {
  return <button aria-label={`Notifications${count ? ` (${count})` : ''}`} className="btn g bell" onClick={onClick}>🔔{count > 0 && <b>{count}</b>}</button>
}

function FilterChips({ filters, setFilters, projects }) {
  const active = [['project', projectName(projects, filters.project)], ['status', filters.status], ['assignee', filters.assignee]].filter(([key]) => filters[key])
  if (!active.length) return null
  return <div className="chips"><span className="mu">Filtered by</span>{active.map(([key, label]) => <span className="chip" key={key}>{label}<button onClick={() => setFilters({ ...filters, [key]: '' })}>×</button></span>)}<Button onClick={() => setFilters({ ...filters, project: '', status: '', assignee: '' })}>Clear all</Button></div>
}

function TaskTable({ tasks, projects, members, onUpdate, onRemove }) {
  if (!tasks.length) return <p className="mu">No tasks match these filters.</p>
  return <div className="scroll"><table><thead><tr><th>Task</th><th>Status</th><th>Assignee</th><th>Due</th><th>Priority</th><th>Project</th><th /></tr></thead><tbody>{tasks.map((task) => <tr key={task.id}>
    <td>{task.url ? <a href={task.url} rel="noreferrer" target="_blank">{task.title} ↗</a> : <b>{task.title}</b>}{task.hist && <span className="pill">Sheet</span>}</td>
    <td>{task.source === 'clickup' ? task.rawStatus : <select aria-label={`Status for ${task.title}`} disabled={task.demo || task.hist} onChange={(event) => onUpdate(task, { status: event.target.value, doneAt: event.target.value === 'Done' ? Date.now() : 0 })} value={task.status}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>}</td>
    <td>{task.assignees?.map((name) => <span key={name}><Avatar members={members} name={name} />{name}</span>) || task.assignee || '—'}</td>
    <td className={isLate(task) ? 'late' : ''}>{task.due || '—'}</td><td style={{ color: PRIORITY_COLORS[task.priority] }}>{task.priority || '—'}</td><td>{projectName(projects, task.project)}</td>
    <td>{task.demo ? <span className="pill">Sample</span> : task.source === 'clickup' ? null : <button aria-label={`${task.hist ? 'Remove imported task' : 'Delete'} ${task.title}`} className="btn g" onClick={() => onRemove(task)}>×</button>}</td>
  </tr>)}</tbody></table></div>
}

function TaskCard({ task, projects, members, onUpdate, onRemove }) {
  return <article className="t"><b>{task.title}</b><div className="mu">{projectName(projects, task.project)} • {task.priority} {isLate(task) && <span className="late">• overdue</span>}</div><div className="row">{task.assignees?.map((name) => <span key={name}><Avatar members={members} name={name} />{name}</span>)}</div>{!task.demo && task.source !== 'clickup' && <>{!task.hist && <select aria-label={`Status for ${task.title}`} onChange={(event) => onUpdate(task, { status: event.target.value, doneAt: event.target.value === 'Done' ? Date.now() : 0 })} value={task.status}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>}<button className="btn g" onClick={() => onRemove(task)}>{task.hist ? 'Remove imported' : 'Delete'}</button></>}</article>
}

function KpiTable({ rows, members = [], onSelect }) {
  return <div className="scroll"><table><thead><tr><th>Employee</th><th>Managed</th><th>Done</th><th>Open</th><th>Overdue</th><th>On-time</th><th>Score</th></tr></thead><tbody>{rows.map((row, index) => <tr className={onSelect ? 'ck' : ''} key={row.name} onClick={onSelect ? () => onSelect(row.name) : undefined} onKeyDown={onSelect ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(row.name) } } : undefined} role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined}><td><Avatar members={members} name={row.name} /> <b>{row.name}</b>{index === 0 && row.total ? ' 👑' : ''}</td><td>{row.total}</td><td>{row.done}</td><td>{row.open}</td><td className={row.overdue ? 'late' : ''}>{row.overdue}</td><td>{row.done ? Math.round(row.onTime / row.done * 100) : 100}%</td><td><div className="row"><div className="bar"><i style={{ width: `${row.score}%` }} /></div><b>{Math.round(row.score)}</b></div></td></tr>)}</tbody></table></div>
}

function ClickupPage({ tasks, config, status, lastSync, filters, setFilters, members, onSync }) {
  const groups = [...new Set(tasks.map((task) => `${task.space}\u0000${task.folder}\u0000${task.list}`))]
  return <>
    <header className="top"><div><h1>ClickUp</h1><div className="mu">Your workspace tasks • {status}{lastSync ? ` • synced ${new Date(lastSync).toLocaleTimeString()}` : ''}</div></div><div className="row"><select onChange={(event) => setFilters({ ...filters, space: event.target.value })} value={filters.space}><option value="">All spaces</option>{[...new Set((config.spaces || []).map((space) => space.name))].map((space) => <option key={space}>{space}</option>)}</select><PersonSelect people={members.map((person) => person.name)} value={filters.assignee} onChange={(value) => setFilters({ ...filters, assignee: value })} /><input onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Search tasks" value={filters.search} /><label className="chk"><input checked={filters.closed} onChange={(event) => setFilters({ ...filters, closed: event.target.checked })} type="checkbox" /> Show closed</label><Button onClick={onSync}>↻ Sync</Button></div></header>
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
  return <section className="card hub sp">
    <div className="row" style={{ justifyContent: 'space-between' }}><div><h2>Meetings this week</h2><div className="mu">{week.length} meeting(s) • {week.filter((meeting) => meeting.status === 'completed').length} achieved</div></div><div className="row"><Button onClick={() => onStart('google')}>Start Meet</Button><Button onClick={() => onStart('zoom')}>Start Zoom</Button><Button onClick={onCreate}>📅 Schedule</Button></div></div>
    <div className="grid k3 sp"><div><h2>Next meeting</h2>{upcoming.slice(0, 3).map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} projects={projects} onOpen={onOpen} />)}{!upcoming.length && <p className="mu">Nothing scheduled.</p>}</div><div><h2>Latest decisions</h2>{decisions.map(({ meeting, text, owner }, index) => <button className="decision" key={`${meeting.id}-${index}`} onClick={() => onOpen(meeting)}>{text}<small>{meeting.title} • {owner || 'No owner'}</small></button>)}{!decisions.length && <p className="mu">Decisions from meeting minutes appear here.</p>}</div></div>
  </section>
}

function MeetingRow({ meeting, projects, onOpen }) {
  return <button className="mr" onClick={() => onOpen(meeting)}><span className="mdt"><b>{new Date(meeting.start).getDate()}</b><span>{new Date(meeting.start).toLocaleDateString([], { month: 'short' })}</span></span><span className="meeting-row-content"><b>{meeting.platform === 'google' ? 'Meet' : 'Zoom'} • {meeting.title}</b><span className="mu">{fmtDay(meeting.start)} • {projectName(projects, meeting.project)}</span></span><span className="pill">{meeting.status}</span></button>
}

function MeetingDetail({ meeting, members, projects, busy, onClose, onSave, onSummarize, onCreateTask }) {
  const [draft, setDraft] = useState({ ...meeting, decisions: meeting.decisions || [], actions: meeting.actions || [] })
  useEffect(() => setDraft({ ...meeting, decisions: meeting.decisions || [], actions: meeting.actions || [] }), [meeting])
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }))
  return <div className="react-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="mdl">
      <div className="row" style={{ justifyContent: 'space-between' }}><div><h2>{draft.title}</h2><span className="mu">{fmtDay(draft.start)} • {projectName(projects, draft.project)} • {draft.duration} minutes</span></div><button className="btn g" onClick={onClose}>✕</button></div>
      <p><a href={draft.joinUrl} rel="noreferrer" target="_blank">Join meeting ↗</a> {draft.calendarUrl && <>• <a href={draft.calendarUrl} rel="noreferrer" target="_blank">Calendar event ↗</a></>}</p>
      <Field label="Meeting notes / transcript"><textarea onChange={(event) => update('notes', event.target.value)} rows="6" value={draft.notes || ''} /></Field>
      <div className="row sp"><Button disabled={busy || !draft.notes?.trim() || draft.demo} onClick={() => onSummarize(draft)} primary>{busy ? 'Writing minutes…' : '✨ Generate summary, decisions & actions'}</Button>{draft.demo && <span className="mu">Sample meeting is read-only.</span>}</div>
      <Field label="Summary"><textarea onChange={(event) => update('summary', event.target.value)} rows="4" value={draft.summary || ''} /></Field>
      <div className="row sp" style={{ justifyContent: 'space-between' }}><h2>Decisions</h2><Button disabled={draft.demo} onClick={() => update('decisions', [...draft.decisions, { text: '', owner: '' }])}>+ Add decision</Button></div>
      {draft.decisions.map((decision, index) => <div className="row sp" key={index}><input onChange={(event) => update('decisions', draft.decisions.map((item, row) => row === index ? { ...item, text: event.target.value } : item))} placeholder="Decision" value={decision.text} /><input list="meeting-members" onChange={(event) => update('decisions', draft.decisions.map((item, row) => row === index ? { ...item, owner: event.target.value } : item))} placeholder="Owner" value={decision.owner || ''} /><button className="btn g" disabled={draft.demo} onClick={() => update('decisions', draft.decisions.filter((_, row) => row !== index))}>×</button></div>)}
      <datalist id="meeting-members">{members.map((member) => <option key={member.name}>{member.name}</option>)}</datalist>
      <div className="row sp" style={{ justifyContent: 'space-between' }}><h2>Action items</h2><Button disabled={draft.demo} onClick={() => update('actions', [...draft.actions, { text: '', owner: '', due: '' }])}>+ Add action</Button></div>
      {draft.actions.map((action, index) =>       <div className="row sp" key={index}><input onChange={(event) => update('actions', draft.actions.map((item, row) => row === index ? { ...item, text: event.target.value } : item))} placeholder="Action" value={action.text} /><input list="meeting-members" onChange={(event) => update('actions', draft.actions.map((item, row) => row === index ? { ...item, owner: event.target.value } : item))} placeholder="Owner" value={action.owner || ''} /><input onChange={(event) => update('actions', draft.actions.map((item, row) => row === index ? { ...item, due: event.target.value } : item))} type="date" value={action.due || ''} /><Button disabled={draft.demo || !action.text?.trim()} onClick={() => onCreateTask(action)}>Create task</Button><button className="btn g" disabled={draft.demo} onClick={() => update('actions', draft.actions.filter((_, row) => row !== index))}>×</button></div>)}
      <div className="row sp"><Button disabled={draft.demo} onClick={() => onSave(draft, { status: draft.status === 'completed' ? 'scheduled' : 'completed' })}>{draft.status === 'completed' ? 'Reopen' : '✓ Save & mark achieved'}</Button><Button disabled={draft.demo} onClick={() => onSave(draft, { status: 'cancelled' })}>Cancel meeting</Button><Button disabled={draft.demo} onClick={() => onSave(draft)}>Save minutes</Button></div>
    </div>
  </div>
}

function CalendarEventDetail({ event, projects, onClose, onOpenMeeting }) {
  const { kind, item } = event
  const meeting = kind === 'meeting'
  const eventDate = meeting ? new Date(item.start) : new Date(`${item.due}T12:00:00`)
  const dateLabel = eventDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const timeLabel = meeting
    ? eventDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : null
  const endLabel = meeting && item.duration
    ? new Date(item.start + item.duration * 60_000).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : null

  return <div className="react-modal-backdrop" onMouseDown={(mouseEvent) => mouseEvent.target === mouseEvent.currentTarget && onClose()}>
    <section aria-labelledby="calendar-event-title" aria-modal="true" className="mdl event-modal" role="dialog">
      <header className="event-modal-head">
        <div className="event-modal-icon" aria-hidden="true">{meeting ? '🎥' : '✓'}</div>
        <button aria-label="Close event details" className="btn g" onClick={onClose} type="button">✕</button>
      </header>
      <span className={`pill event-kind ${meeting ? 'meeting' : 'task'}`}>{meeting ? `${item.platform === 'google' ? 'Google Meet' : 'Zoom'} meeting` : 'Task due'}</span>
      <h2 id="calendar-event-title">{item.title}</h2>
      <div className="event-facts">
        <div className="event-fact"><span aria-hidden="true">📅</span><div><b>{dateLabel}</b>{timeLabel && <span>{timeLabel}{endLabel ? ` – ${endLabel}` : ''}</span>}</div></div>
        <div className="event-fact"><span aria-hidden="true">🏢</span><div><b>Project</b><span>{projectName(projects, item.project)}</span></div></div>
        {meeting
          ? <div className="event-fact"><span aria-hidden="true">◷</span><div><b>Status</b><span>{item.status || 'scheduled'}{item.duration ? ` · ${item.duration} min` : ''}</span></div></div>
          : <>
            <div className="event-fact"><span aria-hidden="true">◷</span><div><b>Status</b><span>{item.status || 'To Do'}</span></div></div>
            <div className="event-fact"><span aria-hidden="true">◎</span><div><b>Assigned to</b><span>{(item.assignees || [item.assignee]).filter(Boolean).join(', ') || 'Unassigned'}</span></div></div>
            {item.priority && <div className="event-fact"><span aria-hidden="true">⚑</span><div><b>Priority</b><span>{item.priority}</span></div></div>}
          </>}
      </div>
      {meeting && item.attendees?.length > 0 && <div className="event-extra"><b>Attendees</b><p>{item.attendees.map((attendee) => typeof attendee === 'string' ? attendee : attendee.name || attendee.email).join(', ')}</p></div>}
      {(item.summary || item.note) && <div className="event-extra"><b>{meeting ? 'Meeting summary' : 'Notes'}</b><p>{item.summary || item.note}</p></div>}
      <footer className="event-modal-actions">
        {meeting && item.joinUrl && <a className="btn p" href={item.joinUrl} rel="noreferrer" target="_blank">Join meeting ↗</a>}
        {meeting && <Button onClick={() => onOpenMeeting(item)}>Open meeting notes</Button>}
        <Button onClick={onClose}>Close</Button>
      </footer>
    </section>
  </div>
}

function MeetingsPage({ platform, meetings, integration, projects, onOpen, onSchedule, onStart }) {
  const label = platform === 'google' ? 'Google Meet' : 'Zoom'
  return <>
    <header className="top"><div><h1>{label}</h1><div className="mu">{integration[platform] ? 'Connected • meetings can be created with calendar invitations.' : `Quick-start mode • connect ${label} for automatic meeting links and invitations.`}</div></div><div className="row"><Button onClick={() => onStart(platform)} primary>Start instant meeting</Button><Button onClick={onSchedule}>📅 Schedule</Button></div></header>
    <div className="grid k4"><Metric label="Meetings" value={meetings.length} detail="scheduled and past" /><Metric label="Upcoming" value={meetings.filter((meeting) => meeting.start > Date.now() && meeting.status === 'scheduled').length} detail="meetings" /><Metric label="Decisions" value={meetings.reduce((sum, meeting) => sum + (meeting.decisions?.length || 0), 0)} detail="recorded" /><Metric label="Awaiting minutes" value={meetings.filter((meeting) => meeting.status === 'completed' && !meeting.summary).length} detail="completed meetings" /></div>
    <section className="card sp"><h2>Upcoming meetings</h2>{meetings.filter((meeting) => meeting.start + meeting.duration * 60_000 >= Date.now()).map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} projects={projects} onOpen={onOpen} />)}</section>
    <section className="card sp"><h2>Meeting summaries</h2>{meetings.filter((meeting) => meeting.start + meeting.duration * 60_000 < Date.now()).map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} projects={projects} onOpen={onOpen} />)}</section>
  </>
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
          <button aria-label="Previous month" className="calendar-arrow" onClick={() => setDate(new Date(year, month - 1, 1))}>‹</button>
          <h2>{date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
          <button aria-label="Next month" className="calendar-arrow" onClick={() => setDate(new Date(year, month + 1, 1))}>›</button>
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
            <span className={`agenda-icon${isMeeting ? ' meeting' : ' task'}`}>{isMeeting ? '🎥' : '✓'}</span>
            <span className="agenda-copy"><b>{item.title}</b><span>{isMeeting ? `${new Date(item.start).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} · ${item.platform === 'google' ? 'Google Meet' : 'Zoom'}` : `${item.status || 'To Do'} · ${item.assignee || item.assignees?.join(', ') || 'Unassigned'}`}</span></span>
            <span className="agenda-chevron">›</span>
          </button>
        })}
        {!selectedMeetings.length && !selectedTasks.length && <div className="calendar-empty"><span aria-hidden="true">☀️</span><b>Nothing planned</b><span>Pick another day or schedule a meeting.</span></div>}
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
    <div className="grid k4">
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
          <div className="card" key={project.id}>
            <h2><span className="dot" style={{ background: project.color }} /> {project.name}</h2>
            <div className="big">{scoped.length} tasks</div>
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
    <section className="card hub"><div className="row" style={{ justifyContent: 'space-between' }}><div><h2>📥 Past work from Google Sheets / Excel</h2><div className="mu">{history.length} imported row(s); historical work counts in KPI scores.</div></div><div className="row"><Button onClick={onImport} primary>Import spreadsheet</Button>{history.length > 0 && <Button onClick={() => runAction(onRemoveHistory)}>Remove imported rows</Button>}</div></div><div className="row sp"><Field label="Credit imported work to"><input onChange={(event) => patch('credit', { ...config.credit, name: event.target.value })} value={config.credit?.name || ''} /></Field><Field label="ClickUp list / folder / space"><input onChange={(event) => patch('credit', { ...config.credit, list: event.target.value })} value={config.credit?.list || ''} /></Field><Field label="ClickUp tag"><input onChange={(event) => patch('credit', { ...config.credit, tag: event.target.value })} value={config.credit?.tag || ''} /></Field><Field label="Tasks created on or before"><input onChange={(event) => patch('credit', { ...config.credit, before: event.target.value })} type="date" value={config.credit?.before || ''} /></Field><Button onClick={() => runAction(() => saveConfig(config), 'Credit rule saved.')} primary>Save credit rule</Button></div></section>
    <section className="card sp"><h2>Team members</h2><div className="grid k4">{kpis.map((row) => <div className="card" key={row.name}><b>{row.name}</b><p className="mu">{row.total} managed • {row.done} done • {row.overdue} overdue</p><div className="bar"><i style={{ width: `${row.score}%` }} /></div><span className="mu">KPI score {Math.round(row.score)}</span></div>)}</div></section>
    <div className="grid k2 sp"><section className="card"><h2>Employees</h2><div className="row"><input onChange={(event) => setEmployee(event.target.value)} placeholder="Employee name" value={employee} /><Button disabled={!employee.trim() || config.team.includes(employee.trim())} onClick={() => runAction(async () => { const name = employee.trim(); await saveConfig({ ...config, team: [...config.team, name] }); setEmployee('') }, 'Employee added.')} primary>Add</Button></div><div className="row sp">{config.team.map((name) => <span className="pill" key={name}>{name} <button aria-label={`Remove ${name}`} className="inline-remove" onClick={() => runAction(() => saveConfig({ ...config, team: config.team.filter((item) => item !== name) }), 'Employee removed.')}>×</button></span>)}</div><p className="mu">ClickUp workspace members: {people.filter((name) => !config.team.includes(name)).join(', ') || 'Connect ClickUp to load members.'}</p></section>
      <section className="card"><h2>KPI model (editable)</h2><div className="row">{[['ontime', 'On-time'], ['target', 'Pace'], ['overdue', 'No-overdue'], ['volume', 'Volume']].map(([key, label]) => <Field key={key} label={label}><input min="0" onChange={(event) => patch('w', { ...config.w, [key]: +event.target.value })} type="number" value={config.w?.[key] ?? 0} /></Field>)}<Field label="Monthly target"><input min="1" onChange={(event) => patch('target', +event.target.value)} type="number" value={config.target} /></Field></div><Button className="sp" onClick={() => runAction(() => saveConfig(config), 'KPI model saved.')} primary>Save KPI model</Button></section>
      <section className="card"><h2>Emails & reminders</h2><Field label="CEO email"><input onChange={(event) => patch('ceoEmail', event.target.value)} value={config.ceoEmail || ''} /></Field>{people.filter((name) => name !== 'CEO').map((name) => <Field key={name} label={name}><input onChange={(event) => patch('emails', { ...config.emails, [name]: event.target.value })} value={config.emails?.[name] || ''} /></Field>)}<Button onClick={() => runAction(() => saveConfig(config), 'Emails saved.')} primary>Save emails</Button></section>
      <section className="card"><h2>Company logo</h2><input accept="image/png,image/jpeg,image/gif,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) runAction(() => onLogo(file), 'Logo updated.') }} type="file" /><p className="mu">PNG, JPG, GIF, or WebP up to 5 MB.</p></section>
    </div>
    <section className="card sp"><h2>Employee scorecard</h2><KpiTable rows={kpis} onSelect={onSelectEmployee} /></section>
  </>
}

function AnalyticsPage({ tasks, rows, projects, filters, setFilters, people, members, config, onUpdate, onRemove, onSelectEmployee }) {
  const complete = tasks.filter((task) => task.status === 'Done')
  const onTime = complete.filter((task) => !task.due || task.doneAt <= endOf(task.due))
  const overdue = tasks.filter(isLate)
  const atRisk = tasks.filter((task) => task.status !== 'Done' && task.due && endOf(task.due) <= Date.now() + 2 * 86_400_000)
  const recent = complete.filter((task) => task.doneAt > Date.now() - 7 * 86_400_000)
  return <>
    <header className="top"><div><h1>KPI Analytics</h1><div className="mu">Task-based performance • {tasks.length} tasks</div></div><div className="row"><ProjectSelect projects={projects} value={filters.project} onChange={(value) => setFilters({ ...filters, project: value })} /><PersonSelect people={people} value={filters.assignee} onChange={(value) => setFilters({ ...filters, assignee: value })} /></div></header>
    <div className="grid k4"><Metric label="Completion rate" value={`${tasks.length ? Math.round(complete.length / tasks.length * 100) : 0}%`} detail={`${complete.length} of ${tasks.length}`} /><Metric label="On-time delivery" value={`${complete.length ? Math.round(onTime.length / complete.length * 100) : 0}%`} detail={`${onTime.length} completed on time`} /><Metric label="Overdue" value={overdue.length} detail={`${tasks.length - complete.length} open`} /><Metric label="Completed • 7 days" value={recent.length} detail={`${atRisk.length} at risk (due ≤ 2d)`} /></div>
    <div className="grid k2 sp"><section className="card"><h2>Tasks by project</h2>{projects.map((project) => { const count = tasks.filter((task) => task.project === project.id).length; return count ? <div className="project-progress" key={project.id}><span>{project.name}</span><b>{count}</b><div className="bar"><i style={{ width: `${tasks.length ? count / tasks.length * 100 : 0}%`, background: project.color }} /></div></div> : null })}</section><section className="card"><h2>Open tasks by priority</h2>{PRIORITIES.slice().reverse().map((priority) => <div className="status-line" key={priority}><span className="dot" style={{ background: PRIORITY_COLORS[priority] }} />{priority}<b>{tasks.filter((task) => task.priority === priority && task.status !== 'Done').length}</b></div>)}</section></div>
    <section className="card sp scroll"><h2>Tasks at risk</h2><TaskTable tasks={atRisk} projects={projects} members={members} onUpdate={onUpdate} onRemove={onRemove} /></section>
    <section className="card sp scroll"><h2>Completed in the last 7 days</h2><table><thead><tr><th>Task</th><th>By</th><th>Completed</th><th>On-time</th></tr></thead><tbody>{recent.map((task) => <tr key={task.id}><td>{task.title}</td><td>{task.assignees?.join(', ') || '—'}</td><td>{new Date(task.doneAt).toLocaleString()}</td><td>{!task.due || task.doneAt <= endOf(task.due) ? '✓' : 'Late'}</td></tr>)}</tbody></table>{config.ceoEmail && <a className="btn" href={`mailto:${encodeURIComponent(config.ceoEmail)}?subject=${encodeURIComponent('Completed tasks – ' + today())}`}>✉ Email CEO this list</a>}</section>
    <section className="card sp"><h2>Employee scorecard</h2><KpiTable rows={rows} members={members} onSelect={onSelectEmployee} /></section>
  </>
}
