import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './styles.css'
import { Icon } from './icons.jsx'
import { FoodicsManagement, FoodicsManagementNav, FOODICS_PROJECTS, FOODICS_SECTIONS } from './FoodicsManagement.jsx'
import * as shared from './app-data.js'
const { FRONTEND_ONLY, STATUSES, STATUS_COLORS, FRONTEND_SESSION_USER_KEY, ROLE_USERS_KEY, clearFrontendRememberedSession, hasFrontendRememberedSession, DEFAULT_PROJECTS, EMAIL_DEFAULTS, DEFAULT_CONFIG, PAGES, ALL_ROLE_PERMISSIONS, GULF_PROJECT_NODES, GULF_INITIAL_NODES, GULF_INITIAL_ASSETS, today, endOf, isLate, normalize, fmtDay, request, api } = shared

import { Button, loadRoleUsers, PinGate, TaskForm, MeetingForm, ImportForm, RolesPage } from './AppDialogs.jsx'
import { Metric, ProjectSelect, PersonSelect, NotificationButton, FilterChips, NatheelGulfNav, GulfAssetPage, TaskTable, TaskCard, KpiTable, ClickupPage, MeetingSummary, MeetingDetail, CalendarEventDetail, MeetingsPage, CalendarPage, ProjectsPage, TeamPage, HumanResourcesPage, AnalyticsPage } from './AppViews.jsx'

export function App() {
  const [auth, setAuth] = useState(null)
  const [roleStore, setRoleStore] = useState(loadRoleUsers)
  const roleUsers = roleStore.users
  const [demoPin, setDemoPin] = useState(() => {
    try { return localStorage.getItem('taskflow_demo_pin') || '' } catch { return '' }
  })
  const [page, setPage] = useState('dash')
  const [foodicsSection, setFoodicsSection] = useState('overview')
  const [foodicsProject, setFoodicsProject] = useState('')
  const [foodicsProjectOpen, setFoodicsProjectOpen] = useState('')
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
    const poll = window.setInterval(load, 5000)
    return () => { active = false; window.clearInterval(poll) }
  }, [auth?.authed, auth?.frontendOnly, refresh, showError])

  useEffect(() => {
    if (!auth?.authed) return undefined
    syncClickup()
    const sync = window.setInterval(() => {
      if (!document.hidden) syncClickup()
    }, 30_000)
    return () => window.clearInterval(sync)
  }, [auth?.authed, syncClickup])

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
    const rawStatus = typeof task.status === 'string' ? task.status : task.status?.status || ''
    const status = rawStatus.toLowerCase()
    const type = task.status_type || task.status?.type || ''
    const priority = typeof task.priority === 'string' ? task.priority : task.priority?.priority
    const done = type === 'done' || type === 'closed' || (!type && /complete|closed|done/.test(status))
    return {
      id: `cu:${task.id}`, externalId: task.id, url: task.url, title: task.name,
      project: task.list?.name || 'ClickUp',
      assignee: task.assignees?.[0]?.username || '',
      assignees: (task.assignees || []).map((person) => person.username),
      status: done ? 'Done' : type === 'open' || status === 'to do' || status === 'open' ? 'To Do' : /review|approv|qa/.test(status) ? 'Review' : 'In Progress',
      rawStatus, statusColor: task.status_color || task.status?.color,
      due: task.due_date ? new Date(+task.due_date).toLocaleDateString('en-CA') : '',
      priority: typeof priority === 'string' && priority ? priority[0].toUpperCase() + priority.slice(1) : 'Normal',
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
    ? `Foodics Management · ${FOODICS_PROJECTS.find((project) => project.id === foodicsProject)?.name || 'Projects'} · ${FOODICS_SECTIONS.find((section) => section.id === foodicsSection)?.shortLabel || 'Overview'}`
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
    if (page === 'foodics') return <FoodicsManagement
      activeProject={foodicsProject}
      activeSection={foodicsSection}
      onSelectProject={(projectId) => { setFoodicsProject(projectId); setFoodicsSection('overview'); setFoodicsProjectOpen(projectId) }}
      onSelectSection={(projectId, section) => { setFoodicsProject(projectId); setFoodicsSection(section); setFoodicsProjectOpen(projectId) }}
    />
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
                activeProject={foodicsProject}
                expandedProject={foodicsProjectOpen}
                mobile
                onSelect={(section) => { setFoodicsSection(section); if (section === 'overview' || section === 'reports') { setFoodicsProject(''); setFoodicsProjectOpen('') } setPage('foodics'); setMobileMenuOpen(false) }}
                onProjectSelect={(projectId) => { setFoodicsProject(projectId); setFoodicsSection('overview'); setFoodicsProjectOpen((current) => current === projectId ? '' : projectId); setPage('foodics'); setMobileMenuOpen(false) }}
                onSectionSelect={(projectId, section) => { setFoodicsProject(projectId); setFoodicsSection(section); setFoodicsProjectOpen(projectId); setPage('foodics'); setMobileMenuOpen(false) }}
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
              activeProject={foodicsProject}
              expandedProject={foodicsProjectOpen}
              onSelect={(section) => { setFoodicsSection(section); if (section === 'overview' || section === 'reports') { setFoodicsProject(''); setFoodicsProjectOpen('') } setPage('foodics') }}
              onProjectSelect={(projectId) => { setFoodicsProject(projectId); setFoodicsSection('overview'); setFoodicsProjectOpen((current) => current === projectId ? '' : projectId); setPage('foodics') }}
              onSectionSelect={(projectId, section) => { setFoodicsProject(projectId); setFoodicsSection(section); setFoodicsProjectOpen(projectId); setPage('foodics') }}
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
