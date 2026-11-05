import { Icon } from '../../components/ui/Icon.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Metric } from '../../components/ui/Metric.jsx'
import { ProjectSelect } from '../../components/ui/ProjectSelect.jsx'
import { NotificationButton } from '../../components/ui/NotificationButton.jsx'
import { FilterChips } from '../../components/ui/FilterChips.jsx'
import { TaskTable } from '../../components/shared/TaskTable.jsx'
import { KpiTable } from '../../components/shared/KpiTable.jsx'
import { MeetingSummary } from '../Meetings/MeetingSummary.jsx'
import { STATUSES, STATUS_COLORS } from '../../utils/constants.js'
import { isLate, endOf } from '../../utils/helpers.js'

export function DashboardPage({
  scopedTasks,
  projects,
  filters,
  setFilters,
  reminders,
  notificationsOpen,
  setNotificationsOpen,
  selectedProject,
  projectScope,
  kpiRows,
  allMeetings,
  clickup,
  updateTask,
  removeTask,
  setPage,
  setMeetingDetail,
  setMeetingDialog,
  startMeeting,
}) {
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

  const projectsSummary = projects
    .filter((item) => item.parent && (!filters.project || isWithinSelectedProject(item.id)))
    .map((item) => {
      const work = projectScope(item.id)
      return { ...item, tasks: work.length, done: work.filter((task) => task.status === 'Done').length }
    })

  const visibleKpiRows = filters.project ? kpiRows.filter((row) => row.total > 0) : kpiRows
  const dashboardMeetings = filters.project
    ? allMeetings.filter((meeting) => projectScope(filters.project, [meeting]).length > 0)
    : allMeetings

  return (
    <>
      <header className="top dashboard-top">
        <div>
          <h1>CEO Dashboard</h1>
          <div className="mu">
            {selectedProject ? `Live view for ${selectedProject.name}` : 'Live view of every project and employee'} •{' '}
            {new Date().toDateString()}
          </div>
        </div>
        <div className="row">
          <ProjectSelect
            value={filters.project}
            projects={projects}
            onChange={(value) => setFilters((current) => ({ ...current, project: value }))}
          />
          <NotificationButton
            count={reminders.length}
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          />
        </div>
      </header>
      <FilterChips filters={filters} setFilters={setFilters} projects={projects} />
      {overdue.length > 0 && (
        <button
          className="alert"
          onClick={() => setFilters({ ...filters, status: filters.status === 'Overdue' ? '' : 'Overdue' })}
        >
          <span className="alert-icon">
            <Icon name="alert-triangle" size={18} />
          </span>
          <span className="alert-text">
            <b>{overdue.length} overdue task(s)</b> — {overdue.slice(0, 4).map((task) => task.title).join(' | ')}
          </span>
        </button>
      )}
      <div className="grid k4 dashboard-kpis">
        <Metric label="Tasks managed" value={scopedTasks.length} detail={`${scopedTasks.length - completed.length} open`} />
        <Metric
          label="Completed"
          value={completed.length}
          detail={`${scopedTasks.length ? Math.round((completed.length / scopedTasks.length) * 100) : 0}% of tasks`}
        />
        <Metric
          label="On-time rate"
          value={`${completed.length ? Math.round((onTime.length / completed.length) * 100) : 0}%`}
          detail={`${onTime.length} of ${completed.length} done`}
        />
        <Metric label="Overdue" value={overdue.length} detail={overdue.length ? 'Needs attention' : 'All on track'} />
        <Metric
          label="Team KPI score"
          value={Math.round(visibleKpiRows.reduce((sum, row) => sum + row.score, 0) / (visibleKpiRows.length || 1))}
          detail={`${visibleKpiRows.length} employee(s)`}
        />
      </div>
      <div className="grid k2 sp">
        <div className="card">
          <h2>Status breakdown</h2>
          {STATUSES.map((status) => {
            const count = scopedTasks.filter((task) => task.status === status).length
            return (
              <button
                className="status-line"
                key={status}
                onClick={() => setFilters({ ...filters, status: filters.status === status ? '' : status })}
              >
                <span className="dot" style={{ background: STATUS_COLORS[status] }} />
                {status}
                <b>{count}</b>
                <div className="bar">
                  <i
                    style={{
                      width: `${scopedTasks.length ? (count / scopedTasks.length) * 100 : 0}%`,
                      background: STATUS_COLORS[status],
                    }}
                  />
                </div>
              </button>
            )
          })}
        </div>
        <div className="card">
          <h2>Progress by project</h2>
          {projectsSummary.map((project) => (
            <button
              className="project-progress"
              key={project.id}
              onClick={() => setFilters({ ...filters, project: filters.project === project.id ? '' : project.id })}
            >
              <span>{project.name}</span>
              <b>
                {project.done}/{project.tasks}
              </b>
              <div className="bar">
                <i
                  style={{
                    width: `${project.tasks ? (project.done / project.tasks) * 100 : 0}%`,
                    background: project.color,
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="card sp">
        <h2>Employee KPI scorecard</h2>
        {visibleKpiRows.length ? (
          <KpiTable
            rows={visibleKpiRows}
            members={clickup.members}
            onSelect={(name) =>
              setFilters((current) => ({ ...current, assignee: current.assignee === name ? '' : name }))
            }
          />
        ) : (
          <p className="mu">No employee task data for {selectedProject?.name || 'this project'} yet.</p>
        )}
      </div>
      <div className="card sp">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2>Recently updated tasks</h2>
          <Button onClick={() => setPage('tasks')}>
            <Icon name="arrow-right" size={14} /> Open Tasks
          </Button>
        </div>
        <TaskTable
          tasks={[...scopedTasks]
            .sort((a, b) => (b.updated || b.doneAt || 0) - (a.updated || a.doneAt || 0))
            .slice(0, 10)}
          projects={projects}
          members={clickup.members}
          onUpdate={updateTask}
          onRemove={removeTask}
        />
      </div>
      <MeetingSummary
        meetings={dashboardMeetings}
        projects={projects}
        onOpen={setMeetingDetail}
        onCreate={() => setMeetingDialog('google')}
        onStart={startMeeting}
      />
    </>
  )
}

export default DashboardPage

