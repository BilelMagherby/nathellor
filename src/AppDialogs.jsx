import { useMemo, useState } from 'react'
import { Icon } from './icons.jsx'
import * as shared from './app-data.js'
const { PRIORITIES, ROLE_USERS_KEY, rememberFrontendSession, clearFrontendRememberedSession, ALL_ROLE_PERMISSIONS, ROLE_PERMISSION_LABELS, today, normalize, projectName, request, api } = shared


export function Avatar({ name, members = [] }) {
  const member = members.find((item) => item.name === name)
  const initials = member?.initials || String(name || '?').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const hue = [...String(name)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360
  return (
    <span className="av" title={name} style={{ background: member?.color || `hsl(${hue} 60% 45%)` }}>
      {member?.avatar ? <img src={member.avatar} alt="" /> : initials}
    </span>
  )
}

export function Button({ children, primary = false, className = '', ...props }) {
  return <button className={`btn${primary ? ' p' : ''}${className ? ` ${className}` : ''}`} {...props}>{children}</button>
}

export function Field({ label, children }) {
  return <label className="field">{label}{children}</label>
}

export function loadRoleUsers() {
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

export function PinGate({ auth, demoPin, roleUsers, onPinCreated, onAuthenticated }) {
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

export function TaskForm({ projects, people, initial = {}, onSave, onClose }) {
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

export function MeetingForm({ projects, people, platform, onSave, onClose }) {
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

export function ImportForm({ people, projects, onClose, onImport }) {
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

export function RolesPage({ users, error, masterPin, onSaveUsers }) {
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
