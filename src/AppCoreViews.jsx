import { useEffect, useState } from 'react'
import { Icon } from './icons.jsx'
import { Avatar, Button, Field } from './AppDialogs.jsx'
import * as shared from './app-data.js'
const { STATUSES, PRIORITIES, PRIORITY_COLORS, TEAM, today, endOf, isLate, projectName } = shared

export function Metric({ label, value, detail, icon, variant }) {
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

export function ProjectSelect({ projects, value, onChange }) {
  return <select aria-label="Filter by project" onChange={(event) => onChange(event.target.value)} value={value}><option value="">All projects (Natheelco)</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
}

export function PersonSelect({ people, value, onChange }) {
  return <select aria-label="Filter by employee" onChange={(event) => onChange(event.target.value)} value={value}><option value="">Everyone</option>{people.filter((person) => person !== 'CEO').map((person) => <option key={person}>{person}</option>)}</select>
}

export function NotificationButton({ count, onClick }) {
  return (
    <button aria-label={`Notifications${count ? ` (${count})` : ''}`} className="btn g bell" onClick={onClick} type="button">
      <Icon name="bell" size={18} />
      {count > 0 && <b className="bell-badge">{count}</b>}
    </button>
  )
}

export function FilterChips({ filters, setFilters, projects }) {
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

export function TaskTable({ tasks, projects, members, onUpdate, onRemove }) {
  if (!tasks.length) return <p className="mu">No tasks match these filters.</p>
  return <div aria-label="Task list. Scroll horizontally to view all columns" className="scroll" role="region" tabIndex={0}><table><thead><tr><th>Task</th><th>Status</th><th>Assignee</th><th>Due</th><th>Priority</th><th>Project</th><th /></tr></thead><tbody>{tasks.map((task) => <tr key={task.id}>
    <td>{task.url ? <a className="task-link" href={task.url} rel="noreferrer" target="_blank">{task.title} <Icon name="external-link" size={12} /></a> : <b className="task-title-text">{task.title}</b>}{task.hist && <span className="pill">Sheet</span>}</td>
    <td>{task.source === 'clickup' ? task.rawStatus : <select aria-label={`Status for ${task.title}`} disabled={task.demo || task.hist} onChange={(event) => onUpdate(task, { status: event.target.value, doneAt: event.target.value === 'Done' ? Date.now() : 0 })} value={task.status}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>}</td>
    <td>{task.assignees?.map((name) => <span key={name}><Avatar members={members} name={name} />{name}</span>) || task.assignee || '—'}</td>
    <td className={isLate(task) ? 'late' : ''}>{task.due || '—'}</td><td style={{ color: PRIORITY_COLORS[task.priority] }}>{task.priority || '—'}</td><td>{projectName(projects, task.project)}</td>
    <td>{task.demo ? <span className="pill">Sample</span> : task.source === 'clickup' ? null : <button aria-label={`${task.hist ? 'Remove imported task' : 'Delete'} ${task.title}`} className="btn-icon-danger" onClick={() => onRemove(task)}><Icon name="trash" size={14} /></button>}</td>
  </tr>)}</tbody></table></div>
}

export function TaskCard({ task, projects, members, onUpdate, onRemove }) {
  return <article className="t"><b>{task.title}</b><div className="mu">{projectName(projects, task.project)} • {task.priority} {isLate(task) && <span className="late">• overdue</span>}</div><div className="row">{task.assignees?.map((name) => <span key={name}><Avatar members={members} name={name} />{name}</span>)}</div>{!task.demo && task.source !== 'clickup' && <>{!task.hist && <select aria-label={`Status for ${task.title}`} onChange={(event) => onUpdate(task, { status: event.target.value, doneAt: event.target.value === 'Done' ? Date.now() : 0 })} value={task.status}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>}<button className="btn g" onClick={() => onRemove(task)}>{task.hist ? 'Remove imported' : 'Delete'}</button></>}</article>
}

export function KpiTable({ rows, members = [], onSelect }) {
  return <div aria-label="Employee KPI scorecard. Scroll horizontally to view all columns" className="scroll" role="region" tabIndex={0}><table><thead><tr><th>Employee</th><th>Managed</th><th>Done</th><th>Open</th><th>Overdue</th><th>On-time</th><th>Score</th></tr></thead><tbody>{rows.map((row, index) => <tr className={onSelect ? 'ck' : ''} key={row.name} onClick={onSelect ? () => onSelect(row.name) : undefined} onKeyDown={onSelect ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(row.name) } } : undefined} role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined}><td><Avatar members={members} name={row.name} /> <b>{row.name}</b>{index === 0 && row.total > 0 ? <span className="winner-badge" title="Top performer"><Icon name="crown" size={14} color="#f59e0b" /> Top</span> : ''}</td><td>{row.total}</td><td>{row.done}</td><td>{row.open}</td><td className={row.overdue ? 'late' : ''}>{row.overdue}</td><td>{row.done ? Math.round(row.onTime / row.done * 100) : 100}%</td><td><div className="row"><div className="bar"><i style={{ width: `${row.score}%` }} /></div><b>{Math.round(row.score)}</b></div></td></tr>)}</tbody></table></div>
}

export function ClickupPage({ tasks, config, status, lastSync, filters, setFilters, members, onSync }) {
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

export function ProjectsPage({ projects, tasks, onSave, config, newProject, setNewProject, newColor, setNewColor, onError }) {
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

export function TeamPage({ config, setConfig, saveConfig, people, kpis, history, onImport, onRemoveHistory, onChangePin, onLogo, onSelectEmployee, onError, onSuccess }) {
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

export function HumanResourcesPage() {
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

export function AnalyticsTrendChart({ data, completedCount, changeLabel, changeTone }) {
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

export function AnalyticsCompletionChart({ completed, open, rate, overdue, atRisk }) {
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

export function AnalyticsTeamChart({ rows, onSelectEmployee }) {
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

export function AnalyticsPage({ tasks, rows, projects, filters, setFilters, people, members, config, onUpdate, onRemove, onSelectEmployee }) {
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
