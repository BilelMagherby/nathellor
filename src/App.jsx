import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './styles.css'
import { Icon } from './components/ui/Icon.jsx'
import { AppLayout } from './components/layout/AppLayout.jsx'
import { FOODICS_PROJECTS, FOODICS_SECTIONS } from './pages/FoodicsManagement/foodicsData.js'
import {
  FRONTEND_ONLY,
  FRONTEND_SESSION_USER_KEY,
  ROLE_USERS_KEY,
  DEFAULT_PROJECTS,
  EMAIL_DEFAULTS,
  DEFAULT_CONFIG,
  PAGES,
  ALL_ROLE_PERMISSIONS,
  GULF_INITIAL_NODES,
  GULF_INITIAL_ASSETS,
} from './utils/constants.js'
import {
  clearFrontendRememberedSession,
  hasFrontendRememberedSession,
  loadRoleUsers,
} from './utils/session.js'
import { isLate, endOf, normalize } from './utils/helpers.js'
import { request, api } from './services/api.js'

// Dialog components
import { PinGate } from './components/dialogs/PinGate.jsx'
import { TaskForm } from './components/dialogs/TaskForm.jsx'
import { MeetingForm } from './components/dialogs/MeetingForm.jsx'
import { ImportForm } from './components/dialogs/ImportForm.jsx'
import { MeetingDetail } from './components/dialogs/MeetingDetail.jsx'
import { CalendarEventDetail } from './components/dialogs/CalendarEventDetail.jsx'

// Independent Page components
import { DashboardPage } from './pages/Dashboard/DashboardPage.jsx'
import { TasksPage } from './pages/Tasks/TasksPage.jsx'
import { MyDayPage } from './pages/MyDay/MyDayPage.jsx'
import { ClickUpPage } from './pages/ClickUp/ClickUpPage.jsx'
import { ProjectsPage } from './pages/Projects/ProjectsPage.jsx'
import { TeamPage } from './pages/Team/TeamPage.jsx'
import { HRPage } from './pages/HR/HRPage.jsx'
import { KPIAnalyticsPage } from './pages/KPIAnalytics/KPIAnalyticsPage.jsx'
import { MeetingsPage } from './pages/Meetings/MeetingsPage.jsx'
import { CalendarPage } from './pages/Calendar/CalendarPage.jsx'
import { NatheelGulfPage } from './pages/NatheelGulf/NatheelGulfPage.jsx'
import { FoodicsManagementPage } from './pages/FoodicsManagement/FoodicsManagementPage.jsx'
import { RolesPage } from './pages/Roles/RolesPage.jsx'
import { ActivityLogPage } from './pages/ActivityLog/ActivityLogPage.jsx'

export function App() {
  const [auth, setAuth] = useState(null)
  const [preferencesLoadedFor, setPreferencesLoadedFor] = useState('')
  const [roleStore, setRoleStore] = useState(loadRoleUsers)
  const roleUsers = roleStore.users
  const [demoPin, setDemoPin] = useState(() => {
    try {
      return localStorage.getItem('taskflow_demo_pin') || ''
    } catch {
      return ''
    }
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
  const [gulfDataLoaded, setGulfDataLoaded] = useState(false)
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
  const [newProject, setNewProject] = useState('')
  const [newColor, setNewColor] = useState('#2563eb')
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [calendarEventDetail, setCalendarEventDetail] = useState(null)
  const [calendarPerson, setCalendarPerson] = useState(() => {
    try {
      return localStorage.getItem('who') || ''
    } catch {
      return ''
    }
  })
  const [seenReminderIds, setSeenReminderIds] = useState([])
  const [reminders, setReminders] = useState([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [clickupStatus, setClickupStatus] = useState('Connecting…')
  const [lastSync, setLastSync] = useState(0)
  const [taskMode, setTaskMode] = useState('list')
  const [minutesBusy, setMinutesBusy] = useState(false)
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

  const taskDataPermissions = ['dash', 'tasks', 'day', 'kpi', 'team', 'projects', 'cal', 'clickup']
  const canReadTaskData =
    auth?.activeUser?.isAdmin || taskDataPermissions.some((permission) => auth?.activeUser?.permissions?.includes(permission))
  const canReadMeetings =
    auth?.activeUser?.isAdmin || ['meet', 'zoom', 'cal'].some((permission) => auth?.activeUser?.permissions?.includes(permission))
  const canReadGulf = auth?.activeUser?.isAdmin || auth?.activeUser?.permissions?.includes('gulf')

  const refresh = useCallback(async () => {
    const [taskRows, historyRows, meetingRows, configRow] = await Promise.all([
      canReadTaskData ? api.list('tasks') : Promise.resolve([]),
      canReadTaskData ? api.list('history') : Promise.resolve([]),
      canReadMeetings ? api.list('meetings') : Promise.resolve([]),
      api.get('config/main'),
    ])
    setTasks(taskRows.map((row) => ({ id: row.id, ...row.data })))
    setHistory(historyRows.map((row) => ({ id: row.id, ...row.data })))
    setMeetings(meetingRows.map((row) => ({ id: row.id, ...row.data })))
    if (!configDraftDirty.current) {
      const data = configRow.exists ? configRow.data : {}
      setConfig({
        ...DEFAULT_CONFIG,
        ...data,
        w: { ...DEFAULT_CONFIG.w, ...(data.w || {}) },
        credit: { ...DEFAULT_CONFIG.credit, ...(data.credit || {}) },
        emails: { ...EMAIL_DEFAULTS, ...(data.emails || {}) },
        projects: data.projects || DEFAULT_PROJECTS,
        team: data.team || DEFAULT_CONFIG.team,
      })
    }
  }, [auth?.activeUser?.id, auth?.activeUser?.isAdmin, auth?.activeUser?.permissions, canReadMeetings, canReadTaskData])

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
    const savedUserId =
      typeof window !== 'undefined' ? localStorage.getItem(FRONTEND_SESSION_USER_KEY) || 'admin' : 'admin'
    const rememberedUser =
      savedUserId === 'admin'
        ? { id: 'admin', name: 'Admin', isAdmin: true }
        : roleUsers.find((user) => user.id === savedUserId)
    const hasRememberedSession = hasFrontendRememberedSession()
    const remembered = Boolean(savedPin && rememberedUser && hasRememberedSession)
    if (savedPin && !rememberedUser && hasRememberedSession) clearFrontendRememberedSession()
    if (FRONTEND_ONLY) {
      setAuth({ configured: Boolean(savedPin), authed: remembered, frontendOnly: true, activeUser: rememberedUser })
    } else {
      request('/api/auth')
        .then((data) => {
          if (active) setAuth(data)
        })
        .catch((cause) => {
          if (active) {
            setAuth({
              configured: false,
              authed: false,
              frontendOnly: false,
              error: `Cannot connect to the backend: ${cause.message}`,
            })
          }
        })
    }
    const lockHandler = () => {
      clearFrontendRememberedSession()
      setAuth((current) => ({ ...current, authed: false }))
    }
    window.addEventListener('taskflow:locked', lockHandler)
    return () => {
      active = false
      window.removeEventListener('taskflow:locked', lockHandler)
    }
  }, [showError])

  async function saveRoleUsers(users) {
    try {
      if (!auth?.frontendOnly) {
        const savedUsers = await request('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users }),
        })
        setRoleStore({ users: savedUsers, error: '' })
        return true
      }
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
      try {
        await refresh()
      } catch (cause) {
        if (active) showError(cause.message)
      }
    }
    const loadIntegrations = async () => {
      if (!canReadMeetings) return
      try {
        const data = await request('/api/meetings')
        if (active) setIntegrations(data)
      } catch (cause) {
        if (active) showError(cause.message)
      }
    }
    load()
    loadIntegrations()
    if (auth.activeUser?.isAdmin) {
      request('/api/users')
        .then(async (users) => {
          if (!users.length) {
            const legacy = loadRoleUsers()
            if (legacy.error) {
              setRoleStore({ users, error: legacy.error })
              return
            }
            if (legacy.users.length) {
              const migratedUsers = await request('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users: legacy.users }),
              })
              localStorage.removeItem(ROLE_USERS_KEY)
              setRoleStore({ users: migratedUsers, error: '' })
              return
            }
          }
          setRoleStore({ users, error: '' })
        })
        .catch((cause) => setRoleStore((current) => ({ ...current, error: `Could not load users: ${cause.message}` })))
    }
    const poll = window.setInterval(load, 5000)
    return () => {
      active = false
      window.clearInterval(poll)
    }
  }, [
    auth?.activeUser?.id,
    auth?.activeUser?.isAdmin,
    auth?.authed,
    auth?.frontendOnly,
    canReadMeetings,
    refresh,
    showError,
  ])

  useEffect(() => {
    if (!auth?.authed || !canReadGulf) return undefined
    let active = true
    if (auth.frontendOnly) {
      setGulfDataLoaded(true)
      return () => {
        active = false
      }
    }
    api.get('gulf/main')
      .then(async (result) => {
        if (!result.exists) {
          await api.put('gulf/main', { nodes: GULF_INITIAL_NODES, assets: GULF_INITIAL_ASSETS })
          if (!active) return
          setGulfNodes(GULF_INITIAL_NODES)
          setGulfAssets(GULF_INITIAL_ASSETS)
        } else {
          if (!Array.isArray(result.data?.nodes) || !Array.isArray(result.data?.assets)) {
            throw new Error('Stored Natheel Gulf data has an invalid format.')
          }
          if (!active) return
          setGulfNodes(result.data.nodes)
          setGulfAssets(result.data.assets)
        }
        if (active) setGulfDataLoaded(true)
      })
      .catch((cause) => {
        if (active) showError(`Could not load Natheel Gulf data: ${cause.message}`)
      })
    return () => {
      active = false
    }
  }, [auth?.authed, auth?.frontendOnly, canReadGulf, showError])

  useEffect(() => {
    if (!auth?.authed || auth.frontendOnly || !canReadGulf || !gulfDataLoaded) return
    api.put('gulf/main', { nodes: gulfNodes, assets: gulfAssets }).catch((cause) => {
      showError(`Could not save Natheel Gulf data: ${cause.message}`)
    })
  }, [auth?.authed, auth?.frontendOnly, canReadGulf, gulfAssets, gulfDataLoaded, gulfNodes, showError])

  useEffect(() => {
    if (!auth?.authed || auth.frontendOnly || !canReadTaskData) return undefined
    syncClickup()
    const sync = window.setInterval(() => {
      if (!document.hidden) syncClickup()
    }, 30_000)
    return () => window.clearInterval(sync)
  }, [auth?.authed, auth?.frontendOnly, canReadTaskData, syncClickup])

  useEffect(() => {
    const user = auth?.activeUser
    if (!auth?.authed || !user?.id) {
      setPreferencesLoadedFor('')
      return undefined
    }
    let active = true
    const applyPreferences = (preferences = {}) => {
      const permissions = user.permissions || []
      const allowedPage = (candidate) =>
        user.isAdmin ||
        (candidate === 'gulf'
          ? permissions.includes('gulf')
          : candidate !== 'roles' && candidate !== 'activity' && permissions.includes(candidate))
      if (typeof preferences.page === 'string' && allowedPage(preferences.page)) setPage(preferences.page)
      if (preferences.filters && typeof preferences.filters === 'object' && !Array.isArray(preferences.filters)) {
        setFilters((current) => ({ ...current, ...preferences.filters }))
      }
      if (typeof preferences.calendarDate === 'string') {
        const date = new Date(preferences.calendarDate)
        if (!Number.isNaN(date.getTime())) setCalendarDate(date)
      }
      if (typeof preferences.calendarPerson === 'string') {
        setCalendarPerson(preferences.calendarPerson)
      } else {
        const legacyCalendarPerson = localStorage.getItem('who')
        if (legacyCalendarPerson) setCalendarPerson(legacyCalendarPerson)
      }
      if (['list', 'board', 'calendar'].includes(preferences.taskMode)) setTaskMode(preferences.taskMode)
      if (typeof preferences.foodicsSection === 'string') setFoodicsSection(preferences.foodicsSection)
      if (typeof preferences.foodicsProject === 'string') setFoodicsProject(preferences.foodicsProject)
      if (typeof preferences.foodicsProjectOpen === 'string') setFoodicsProjectOpen(preferences.foodicsProjectOpen)
      if (typeof preferences.foodicsNavOpen === 'boolean') setFoodicsNavOpen(preferences.foodicsNavOpen)
      if (typeof preferences.natheelGulfOpen === 'boolean') setNatheelGulfOpen(preferences.natheelGulfOpen)
      if (typeof preferences.gulfActiveSection === 'string') setGulfActiveSection(preferences.gulfActiveSection)
      if (typeof preferences.gulfSelectedNode === 'string') setGulfSelectedNode(preferences.gulfSelectedNode)
      if (Array.isArray(preferences.seenReminderIds)) {
        setSeenReminderIds(preferences.seenReminderIds.filter((id) => typeof id === 'string').slice(-500))
      } else {
        try {
          const legacyReminders = JSON.parse(localStorage.getItem('rem') || '[]')
          if (Array.isArray(legacyReminders)) {
            setSeenReminderIds(legacyReminders.filter((id) => typeof id === 'string').slice(-500))
          }
        } catch {
          setSeenReminderIds([])
        }
      }
      setPreferencesLoadedFor(user.id)
    }
    if (auth.frontendOnly) {
      try {
        const saved = localStorage.getItem('taskflow_demo_preferences')
        applyPreferences(saved ? JSON.parse(saved) : {})
      } catch {
        applyPreferences()
      }
      return () => {
        active = false
      }
    }
    api.get(`preferences/${user.id}`)
      .then((result) => {
        if (active) applyPreferences(result.exists ? result.data : {})
      })
      .catch((cause) => {
        if (active) {
          showError(`Could not load your dashboard preferences: ${cause.message}`)
        }
      })
    return () => {
      active = false
    }
  }, [
    auth?.activeUser?.id,
    auth?.activeUser?.isAdmin,
    auth?.activeUser?.permissions,
    auth?.authed,
    auth?.frontendOnly,
    showError,
  ])

  useEffect(() => {
    const user = auth?.activeUser
    if (!auth?.authed || !user?.id || preferencesLoadedFor !== user.id) return undefined
    const preferences = {
      page,
      filters,
      calendarDate: calendarDate.toISOString(),
      calendarPerson,
      taskMode,
      foodicsSection,
      foodicsProject,
      foodicsProjectOpen,
      foodicsNavOpen,
      natheelGulfOpen,
      gulfActiveSection,
      gulfSelectedNode,
      seenReminderIds: seenReminderIds.slice(-500),
    }
    const timer = window.setTimeout(() => {
      if (auth.frontendOnly) {
        try {
          localStorage.setItem('taskflow_demo_preferences', JSON.stringify(preferences))
        } catch (cause) {
          showError(`Could not save your dashboard preferences: ${cause.message}`)
        }
        return
      }
      api.put(`preferences/${user.id}`, preferences)
        .then(() => {
          if (localStorage.getItem('who') !== null) localStorage.removeItem('who')
          if (localStorage.getItem('rem') !== null) localStorage.removeItem('rem')
        })
        .catch((cause) => {
          showError(`Could not save your dashboard preferences: ${cause.message}`)
        })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [
    auth?.activeUser?.id,
    auth?.authed,
    auth?.frontendOnly,
    calendarDate,
    calendarPerson,
    filters,
    foodicsNavOpen,
    foodicsProject,
    foodicsProjectOpen,
    foodicsSection,
    gulfActiveSection,
    gulfSelectedNode,
    natheelGulfOpen,
    page,
    preferencesLoadedFor,
    seenReminderIds,
    showError,
    taskMode,
  ])

  useEffect(() => {
    const user = auth?.activeUser
    if (!auth?.authed || !user || user.isAdmin || user.permissions?.includes(page)) return
    setPage(user.permissions?.find((permission) => ALL_ROLE_PERMISSIONS.includes(permission)) || 'dash')
  }, [auth?.activeUser, auth?.authed, page])

  const projects = useMemo(() => {
    const configured = config.projects || DEFAULT_PROJECTS
    const known = new Set(configured.map((project) => project.id))
    const extras = [
      ...new Set([...tasks, ...history].map((task) => task.project).filter((id) => id && !known.has(id))),
    ].map((id) => ({ id, name: id, color: '#64748b', parent: 'nathilco' }))
    return [...configured, ...extras]
  }, [config.projects, tasks, history])

  const cuTasks = useMemo(
    () =>
      (clickup.tasks || []).map((task) => {
        const rawStatus = typeof task.status === 'string' ? task.status : task.status?.status || ''
        const status = rawStatus.toLowerCase()
        const type = task.status_type || task.status?.type || ''
        const priority = typeof task.priority === 'string' ? task.priority : task.priority?.priority
        const done = type === 'done' || type === 'closed' || (!type && /complete|closed|done/.test(status))
        return {
          id: `cu:${task.id}`,
          externalId: task.id,
          url: task.url,
          title: task.name,
          project: task.list?.name || 'ClickUp',
          assignee: task.assignees?.[0]?.username || '',
          assignees: (task.assignees || []).map((person) => person.username),
          status: done
            ? 'Done'
            : type === 'open' || status === 'to do' || status === 'open'
            ? 'To Do'
            : /review|approv|qa/.test(status)
            ? 'Review'
            : 'In Progress',
          rawStatus,
          statusColor: task.status_color || task.status?.color,
          due: task.due_date ? new Date(+task.due_date).toLocaleDateString('en-CA') : '',
          priority:
            typeof priority === 'string' && priority ? priority[0].toUpperCase() + priority.slice(1) : 'Normal',
          tags: (task.tags || []).map((tag) => tag.name),
          doneAt: task.date_closed ? +task.date_closed : 0,
          space: task.space?.name || '',
          folder: task.folder?.name || '',
          list: task.list?.name || '',
          created: task.date_created ? +task.date_created : 0,
          updated: task.date_updated ? +task.date_updated : 0,
          parent: task.parent || '',
          demo: false,
          source: 'clickup',
        }
      }),
    [clickup.tasks]
  )

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
      const matchesRule =
        (rule.list &&
          [task.list, task.folder, task.space].some((value) => normalize(value) === normalize(rule.list))) ||
        (rule.tag && task.tags.some((tag) => normalize(tag) === normalize(rule.tag))) ||
        (rule.before && task.created && task.created <= endOf(rule.before))
      if (!imported && !(config.credit?.name && matchesRule)) return task
      if (imported) used.add(normalize(task.title))
      const owner = imported?.assignee || config.credit?.name || ''
      return {
        ...task,
        assignee: owner,
        assignees: owner ? [owner] : [],
        status: imported?.status === 'Done' ? 'Done' : task.status,
        doneAt: imported?.doneAt || task.doneAt,
        due: task.due || imported?.due || '',
        credited: true,
        imported,
      }
    })
    const importedRows = history
      .filter((item) => !used.has(normalize(item.title)))
      .map((item) => ({
        id: `history:${item.id}`,
        title: item.title,
        project: item.project || 'nathilco',
        assignee: item.assignee || '',
        assignees: item.assignee ? [item.assignee] : [],
        status: item.status || 'Done',
        priority: item.priority || 'Normal',
        due: item.due || '',
        doneAt: item.doneAt || 0,
        note: item.note || '',
        hist: true,
        tags: ['Google Sheets'],
        source: 'history',
      }))
    return [
      ...credited,
      ...tasks.map((task) => ({ ...task, assignees: task.assignee ? [task.assignee] : [], source: 'taskflow' })),
      ...importedRows,
    ]
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
      const due = new Date()
      due.setDate(due.getDate() + offset)
      return {
        id: `demo${index}`,
        title,
        project,
        status,
        priority,
        assignee: '',
        assignees: [],
        due: due.toLocaleDateString('en-CA'),
        doneAt: status === 'Done' ? Date.now() - Math.abs(offset || 1) * 86_400_000 : 0,
        demo: true,
        tags: [],
      }
    })
  }, [cuTasks.length, tasks.length, history.length])

  const allTasks = historicalTasks.length ? historicalTasks : demoTasks
  const people = useMemo(
    () => [
      ...new Set([
        'CEO',
        ...(config.team || []),
        ...(clickup.members || []).map((person) => person.name),
        ...allTasks.flatMap((task) => task.assignees || []),
      ]),
    ],
    [allTasks, clickup.members, config.team]
  )

  const projectScope = useCallback(
    (projectId, source = allTasks) =>
      source.filter((task) => {
        if (!projectId) return true
        let taskProject = projects.find((item) => item.id === task.project)
        while (taskProject) {
          if (taskProject.id === projectId) return true
          taskProject = projects.find((item) => item.id === taskProject.parent)
        }
        return task.project === projectId
      }),
    [allTasks, projects]
  )

  const scopedTasks = useMemo(
    () =>
      projectScope(filters.project).filter((task) => {
        const matchesPerson = !filters.assignee || (task.assignees || [task.assignee]).includes(filters.assignee)
        const matchesStatus =
          !filters.status || (filters.status === 'Overdue' ? isLate(task) : task.status === filters.status)
        return matchesPerson && matchesStatus
      }),
    [filters.assignee, filters.project, filters.status, projectScope]
  )

  const kpiRows = useMemo(() => {
    const staff = people.filter((person) => person !== 'CEO')
    const busiest = Math.max(
      1,
      ...staff.map((person) => scopedTasks.filter((task) => (task.assignees || [task.assignee]).includes(person)).length)
    )
    return staff
      .map((name) => {
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
        const score = owned.length
          ? Object.keys(metrics).reduce((sum, key) => sum + metrics[key] * (+weights[key] || 0), 0) / weightTotal
          : 0
        return {
          name,
          total: owned.length,
          done: completed.length,
          open: owned.length - completed.length,
          overdue,
          onTime,
          score,
          tasks: owned,
        }
      })
      .sort((a, b) => b.score - a.score || b.total - a.total)
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
      ...data,
      status: data.status || 'To Do',
      created: data.created || Date.now(),
      doneAt: data.status === 'Done' ? Date.now() : data.doneAt || 0,
    })
    setTaskDialog(false)
    await refresh()
    showToast('Task saved.')
  }

  const visibleClickup = useMemo(
    () =>
      cuTasks.filter(
        (task) =>
          (!filters.space || task.space === filters.space) &&
          (!filters.assignee || task.assignees.includes(filters.assignee)) &&
          (filters.closed ||
            !['closed', 'done'].includes(
              (clickup.tasks?.find((item) => item.id === task.externalId)?.status_type || '').toLowerCase()
            )) &&
          (!filters.search || task.title.toLowerCase().includes(filters.search.toLowerCase()))
      ),
    [clickup.tasks, cuTasks, filters.assignee, filters.closed, filters.search, filters.space]
  )

  async function syncClickupNow() {
    const data = await syncClickup(true)
    if (!data) showError('ClickUp sync failed. Check the connection and server configuration.')
    else if (!data.configured) showError('ClickUp is not connected. Add CLICKUP_API_TOKEN to the server environment.')
    else showToast('ClickUp sync complete.')
  }

  async function createMeeting(data) {
    const result = await request('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
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
        notes: updated.notes || '',
        summary: updated.summary || '',
        decisions: updated.decisions || [],
        actions: updated.actions || [],
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: meeting.title, attendees: meeting.attendees, notes: meeting.notes }),
      })
      setMeetingDetail({
        ...meeting,
        summary: result.summary || meeting.summary,
        decisions: [...(meeting.decisions || []), ...(result.decisions || [])],
        actions: [...(meeting.actions || []), ...(result.actions || [])],
      })
      showToast('Minutes drafted. Review and save.')
    } catch (cause) {
      showError(cause.message)
    } finally {
      setMinutesBusy(false)
    }
  }

  async function importHistory(items, source) {
    const unique = new Map()
    items.forEach((item) => {
      const id = [...`${normalize(item.title)}|${item.due}`]
        .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7)
        .toString(36)
      unique.set(id, { id, data: { ...item, imported: Date.now(), source } })
    })
    const records = [...unique.values()]
    for (let index = 0; index < records.length; index += 500) {
      await request('/api/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    const week = new Date()
    week.setDate(week.getDate() - ((week.getDay() + 6) % 7))
    return [
      {
        id: 'demo-meet-1',
        demo: true,
        platform: 'google',
        title: 'Weekly leadership sync',
        project: 'nathilco',
        start: week.getTime() + 2 * 86_400_000,
        duration: 45,
        reminder: 30,
        status: 'scheduled',
        attendees: [],
        joinUrl: 'https://meet.google.com/new',
        summary: '',
        notes: '',
        decisions: [],
        actions: [],
      },
      {
        id: 'demo-meet-2',
        demo: true,
        platform: 'zoom',
        title: 'Investor update call',
        project: 'nathilco',
        start: week.getTime() + 8 * 86_400_000,
        duration: 60,
        reminder: 30,
        status: 'scheduled',
        attendees: [],
        joinUrl: 'https://zoom.us/start/videomeeting',
        summary: '',
        notes: '',
        decisions: [],
        actions: [],
      },
    ]
  }, [realMeetings])
  const allMeetings = realMeetings.length ? realMeetings : sampleMeetings

  useEffect(() => {
    if (!auth?.authed || auth.frontendOnly) return undefined
    const tick = () => {
      const seen = new Set(seenReminderIds)
      const now = Date.now()
      const due = realMeetings.filter(
        (meeting) =>
          !seen.has(meeting.id) &&
          meeting.status === 'scheduled' &&
          meeting.start - (meeting.reminder ?? 30) * 60_000 <= now &&
          meeting.start > now - 60_000
      )
      if (!due.length) return
      due.forEach((meeting) => seen.add(meeting.id))
      setSeenReminderIds([...seen].slice(-500))
      setReminders((current) => [...due, ...current])
    }
    const interval = window.setInterval(tick, 30_000)
    return () => window.clearInterval(interval)
  }, [auth?.authed, auth?.frontendOnly, realMeetings, seenReminderIds])

  if (!auth)
    return (
      <div id="lock">
        <div className="lk">Connecting to TaskFlow…</div>
      </div>
    )

  if (!auth.authed)
    return (
      <PinGate
        auth={auth}
        demoPin={demoPin}
        roleUsers={roleUsers}
        onPinCreated={setDemoPin}
        onAuthenticated={(session) => {
          setAuth(session)
          const permissions = session.activeUser?.permissions || []
          setPage(session.activeUser?.isAdmin ? 'dash' : permissions[0] || 'dash')
        }}
      />
    )

  const activeUser = auth.activeUser || { id: 'admin', name: 'Admin', isAdmin: true }
  const canAccessPage = (pageKey) =>
    activeUser.isAdmin ||
    (pageKey === 'gulf'
      ? activeUser.permissions?.includes('gulf')
      : !['roles', 'activity'].includes(pageKey) && activeUser.permissions?.includes(pageKey))

  const visiblePages = PAGES.filter(([key]) => key !== 'foodics' && canAccessPage(key))
  const selectedProject = projects.find((project) => project.id === filters.project)
  const filteredClickup = visibleClickup
  const pageTitle =
    page === 'gulf'
      ? 'Natheel Gulf'
      : page === 'foodics'
      ? `Foodics Management · ${
          FOODICS_PROJECTS.find((project) => project.id === foodicsProject)?.name || 'Projects'
        } · ${FOODICS_SECTIONS.find((section) => section.id === foodicsSection)?.shortLabel || 'Overview'}`
      : PAGES.find((item) => item[0] === page)?.[2] || 'CEO Dashboard'

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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          instant: true,
          start: Date.now(),
          title: `${platform === 'google' ? 'Google Meet' : 'Zoom'} meeting`,
          project: filters.project || 'nathilco',
        }),
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
      try {
        localStorage.setItem('taskflow_demo_pin', next)
      } catch {}
      showToast('PIN changed.')
      return
    }
    try {
      await request('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change', current, pin: next }),
      })
      showToast('PIN changed.')
    } catch (cause) {
      showError(cause.message)
    }
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
      await request('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      })
      clearFrontendRememberedSession()
      setAuth({ ...auth, authed: false })
    } catch (cause) {
      showError(cause.message)
    }
  }

  function renderPage() {
    if (!canAccessPage(page)) {
      return (
        <section className="card roles-access-denied">
          <span>
            <Icon name="lock" size={20} />
          </span>
          <h1>Access not assigned</h1>
          <p className="mu">Your account doesn’t have permission to open this dashboard section.</p>
        </section>
      )
    }

    if (page === 'dash') {
      return (
        <DashboardPage
          allMeetings={allMeetings}
          clickup={clickup}
          filters={filters}
          kpiRows={kpiRows}
          notificationsOpen={notificationsOpen}
          projectScope={projectScope}
          projects={projects}
          reminders={reminders}
          removeTask={removeTask}
          scopedTasks={scopedTasks}
          selectedProject={selectedProject}
          setFilters={setFilters}
          setMeetingDetail={setMeetingDetail}
          setMeetingDialog={setMeetingDialog}
          setNotificationsOpen={setNotificationsOpen}
          setPage={setPage}
          startMeeting={startMeeting}
          updateTask={updateTask}
        />
      )
    }

    if (page === 'roles') {
      return (
        <RolesPage
          error={roleStore.error}
          masterPin={demoPin}
          onSaveUsers={saveRoleUsers}
          users={roleUsers}
        />
      )
    }

    if (page === 'activity') return <ActivityLogPage />

    if (page === 'gulf') {
      return (
        <NatheelGulfPage
          activeSection={gulfActiveSection}
          assets={gulfAssets}
          config={config}
          connected={!auth.frontendOnly}
          nodes={gulfNodes}
          onLock={logout}
          onError={showError}
          onToast={showToast}
          selectedNode={gulfSelectedNode}
          setActiveSection={setGulfActiveSection}
          setAssets={setGulfAssets}
          setNodes={setGulfNodes}
          setSelectedNode={setGulfSelectedNode}
        />
      )
    }

    if (page === 'foodics') {
      return (
        <FoodicsManagementPage
          activeProject={foodicsProject}
          activeSection={foodicsSection}
          onSelectProject={(projectId) => {
            setFoodicsProject(projectId)
            setFoodicsSection('overview')
            setFoodicsProjectOpen(projectId)
          }}
          onSelectSection={(projectId, section) => {
            setFoodicsProject(projectId)
            setFoodicsSection(section)
            setFoodicsProjectOpen(projectId)
          }}
        />
      )
    }

    if (page === 'tasks') {
      return (
        <TasksPage
          clickup={clickup}
          filters={filters}
          people={people}
          projects={projects}
          removeTask={removeTask}
          scopedTasks={scopedTasks}
          selectedProject={selectedProject}
          setFilters={setFilters}
          setTaskDialog={setTaskDialog}
          setTaskMode={setTaskMode}
          taskMode={taskMode}
          updateTask={updateTask}
        />
      )
    }

    if (page === 'day') {
      return (
        <MyDayPage
          allTasks={allTasks}
          calendarPerson={calendarPerson}
          clickup={clickup}
          filters={filters}
          people={people}
          projects={projects}
          removeTask={removeTask}
          setCalendarPerson={setCalendarPerson}
          setTaskDialog={setTaskDialog}
          updateTask={updateTask}
        />
      )
    }

    if (page === 'clickup') {
      return (
        <ClickUpPage
          config={clickup}
          filters={filters}
          lastSync={lastSync}
          members={clickup.members || []}
          onSync={syncClickupNow}
          setFilters={setFilters}
          status={clickupStatus}
          tasks={filteredClickup}
        />
      )
    }

    if (page === 'projects') {
      return (
        <ProjectsPage
          config={config}
          newColor={newColor}
          newProject={newProject}
          onError={showError}
          onSave={saveConfig}
          projects={projects}
          setNewColor={setNewColor}
          setNewProject={setNewProject}
          tasks={allTasks}
        />
      )
    }

    if (page === 'team') {
      return (
        <TeamPage
          config={config}
          history={history}
          kpis={kpiRows}
          onChangePin={changePin}
          onError={showError}
          onImport={() => setImportDialog(true)}
          onLogo={uploadLogo}
          onRemoveHistory={removeHistory}
          onSelectEmployee={(name) => {
            setFilters((current) => ({ ...current, assignee: current.assignee === name ? '' : name }))
            setPage('tasks')
          }}
          onSuccess={showToast}
          people={people}
          saveConfig={saveConfig}
          setConfig={updateConfigDraft}
        />
      )
    }

    if (page === 'hr') {
      return <HRPage />
    }

    if (page === 'kpi') {
      return (
        <KPIAnalyticsPage
          config={config}
          filters={filters}
          members={clickup.members}
          onRemove={removeTask}
          onSelectEmployee={(name) =>
            setFilters((current) => ({ ...current, assignee: current.assignee === name ? '' : name }))
          }
          onUpdate={updateTask}
          people={people}
          projects={projects}
          rows={kpiRows}
          setFilters={setFilters}
          tasks={scopedTasks}
        />
      )
    }

    if (page === 'meet' || page === 'zoom') {
      return (
        <MeetingsPage
          integration={integrations}
          meetings={allMeetings.filter((meeting) => meeting.platform === (page === 'meet' ? 'google' : 'zoom'))}
          onOpen={setMeetingDetail}
          onSchedule={() => setMeetingDialog(page === 'meet' ? 'google' : 'zoom')}
          onStart={startMeeting}
          platform={page === 'meet' ? 'google' : 'zoom'}
          projects={projects}
        />
      )
    }

    return (
      <CalendarPage
        date={calendarDate}
        meetings={allMeetings}
        onOpen={(event) => setCalendarEventDetail(event)}
        onSchedule={() => setMeetingDialog('google')}
        setDate={setCalendarDate}
        tasks={allTasks}
      />
    )
  }

  return (
    <>
      <AppLayout
        auth={auth}
        canAccessPage={canAccessPage}
        clickup={clickup}
        clickupStatus={clickupStatus}
        config={config}
        error={error}
        filters={filters}
        foodicsNavOpen={foodicsNavOpen}
        foodicsProject={foodicsProject}
        foodicsProjectOpen={foodicsProjectOpen}
        foodicsSection={foodicsSection}
        gulfSelectedNode={gulfSelectedNode}
        lastSync={lastSync}
        logout={logout}
        mobileMenuOpen={mobileMenuOpen}
        natheelGulfOpen={natheelGulfOpen}
        notificationsOpen={notificationsOpen}
        page={page}
        pageTitle={pageTitle}
        projects={projects}
        reminders={reminders}
        setError={setError}
        setFilters={setFilters}
        setFoodicsNavOpen={setFoodicsNavOpen}
        setFoodicsProject={setFoodicsProject}
        setFoodicsProjectOpen={setFoodicsProjectOpen}
        setFoodicsSection={setFoodicsSection}
        setGulfActiveSection={setGulfActiveSection}
        setGulfSelectedNode={setGulfSelectedNode}
        setMeetingDetail={setMeetingDetail}
        setMobileMenuOpen={setMobileMenuOpen}
        setNatheelGulfOpen={setNatheelGulfOpen}
        setNotificationsOpen={setNotificationsOpen}
        setPage={setPage}
        setReminders={setReminders}
        syncClickupNow={syncClickupNow}
        toast={toast}
        visiblePages={visiblePages}
      >
        {renderPage()}
      </AppLayout>

      {taskDialog && (
        <TaskForm
          onClose={() => setTaskDialog(false)}
          onSave={(data) => saveTask(data)}
          people={people}
          projects={projects}
        />
      )}
      {meetingDialog && (
        <MeetingForm
          onClose={() => setMeetingDialog('')}
          onSave={createMeeting}
          people={people}
          platform={meetingDialog}
          projects={projects}
        />
      )}
      {importDialog && (
        <ImportForm
          onClose={() => setImportDialog(false)}
          onImport={importHistory}
          people={people}
          projects={projects}
        />
      )}
      {calendarEventDetail && (
        <CalendarEventDetail
          event={calendarEventDetail}
          onClose={() => setCalendarEventDetail(null)}
          onOpenMeeting={(meeting) => {
            setCalendarEventDetail(null)
            setMeetingDetail(meeting)
          }}
          projects={projects}
        />
      )}
      {meetingDetail && (
        <MeetingDetail
          busy={minutesBusy}
          meeting={meetingDetail}
          members={clickup.members}
          onClose={() => setMeetingDetail(null)}
          onCreateTask={async (action) => {
            try {
              await saveTask({
                title: action.text,
                assignee: action.owner || '',
                due: action.due || '',
                project: meetingDetail.project || 'nathilco',
                priority: 'Normal',
                note: `From meeting: ${meetingDetail.title}`,
                status: 'To Do',
              })
              setMeetingDetail(null)
            } catch (cause) {
              showError(cause.message)
            }
          }}
          onSave={saveMeeting}
          onSummarize={generateMinutes}
          projects={projects}
        />
      )}
    </>
  )
}

export default App
