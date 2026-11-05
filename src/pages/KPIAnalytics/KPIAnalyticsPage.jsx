import { Icon } from '../../components/ui/Icon.jsx'
import { Metric } from '../../components/ui/Metric.jsx'
import { ProjectSelect } from '../../components/ui/ProjectSelect.jsx'
import { PersonSelect } from '../../components/ui/PersonSelect.jsx'
import { TaskTable } from '../../components/shared/TaskTable.jsx'
import { KpiTable } from '../../components/shared/KpiTable.jsx'
import { AnalyticsTrendChart } from './AnalyticsTrendChart.jsx'
import { AnalyticsCompletionChart } from './AnalyticsCompletionChart.jsx'
import { AnalyticsTeamChart } from './AnalyticsTeamChart.jsx'
import { PRIORITIES, PRIORITY_COLORS } from '../../utils/constants.js'
import { today, endOf, isLate } from '../../utils/helpers.js'

export function KPIAnalyticsPage({
  tasks,
  rows,
  projects,
  filters,
  setFilters,
  people,
  members,
  config,
  onUpdate,
  onRemove,
  onSelectEmployee,
}) {
  const complete = tasks.filter((task) => task.status === 'Done')
  const onTime = complete.filter((task) => !task.due || task.doneAt <= endOf(task.due))
  const overdue = tasks.filter(isLate)
  const atRisk = tasks.filter(
    (task) => task.status !== 'Done' && task.due && endOf(task.due) <= Date.now() + 2 * 86_400_000
  )
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
  const previousWeekCount = complete.filter(
    (task) => task.doneAt >= previousWeekStart.getTime() && task.doneAt < weekStart.getTime()
  ).length
  const recentComplete = trendDates.reduce((sum, day) => sum + day.count, 0)
  const weeklyChange = previousWeekCount
    ? Math.round(((recentComplete - previousWeekCount) / previousWeekCount) * 100)
    : recentComplete
    ? 100
    : 0
  const weeklyChangeLabel = previousWeekCount
    ? `${weeklyChange > 0 ? '+' : ''}${weeklyChange}% vs last week`
    : recentComplete
    ? 'New activity this week'
    : 'No activity this week'
  const weeklyChangeTone = weeklyChange > 0 ? 'positive' : weeklyChange < 0 ? 'negative' : 'neutral'
  const completionRate = tasks.length ? Math.round((complete.length / tasks.length) * 100) : 0

  return (
    <>
      <header className="top">
        <div>
          <h1>KPI Analytics</h1>
          <div className="mu">
            Task-based performance • {tasks.length} tasks
          </div>
        </div>
        <div className="row">
          <ProjectSelect
            projects={projects}
            value={filters.project}
            onChange={(value) => setFilters({ ...filters, project: value })}
          />
          <PersonSelect
            people={people}
            value={filters.assignee}
            onChange={(value) => setFilters({ ...filters, assignee: value })}
          />
        </div>
      </header>
      <section aria-label="Performance charts" className="analytics-visual-grid">
        <AnalyticsTrendChart
          changeLabel={weeklyChangeLabel}
          changeTone={weeklyChangeTone}
          completedCount={recentComplete}
          data={trendDates}
        />
        <AnalyticsCompletionChart
          atRisk={atRisk.length}
          completed={complete.length}
          open={tasks.length - complete.length}
          overdue={overdue.length}
          rate={completionRate}
        />
        <AnalyticsTeamChart onSelectEmployee={onSelectEmployee} rows={rows} />
      </section>
      <div className="grid k4 metric-grid">
        <Metric
          label="Completion rate"
          value={`${completionRate}%`}
          detail={`${complete.length} of ${tasks.length}`}
          icon="percent"
          variant="success"
        />
        <Metric
          label="On-time delivery"
          value={`${complete.length ? Math.round((onTime.length / complete.length) * 100) : 0}%`}
          detail={`${onTime.length} completed on time`}
          icon="clock"
          variant="success"
        />
        <Metric
          label="Overdue"
          value={overdue.length}
          detail={`${tasks.length - complete.length} open`}
          icon="alert-triangle"
          variant={overdue.length > 0 ? 'danger' : 'success'}
        />
        <Metric
          label="Completed • 7 days"
          value={recent.length}
          detail={`${atRisk.length} at risk (due ≤ 2d)`}
          icon="check-circle"
          variant="neutral"
        />
      </div>
      <div className="grid k2 sp">
        <section className="card">
          <h2>Tasks by project</h2>
          {projects.map((project) => {
            const count = tasks.filter((task) => task.project === project.id).length
            return count ? (
              <div className="project-progress" key={project.id}>
                <span>{project.name}</span>
                <b>{count}</b>
                <div className="bar">
                  <i style={{ width: `${tasks.length ? (count / tasks.length) * 100 : 0}%`, background: project.color }} />
                </div>
              </div>
            ) : null
          })}
        </section>
        <section className="card">
          <h2>Open tasks by priority</h2>
          {PRIORITIES.slice()
            .reverse()
            .map((priority) => (
              <div className="status-line" key={priority}>
                <span className="dot" style={{ background: PRIORITY_COLORS[priority] }} />
                {priority}
                <b>{tasks.filter((task) => task.priority === priority && task.status !== 'Done').length}</b>
              </div>
            ))}
        </section>
      </div>
      <section className="card sp">
        <h2>Tasks at risk</h2>
        <TaskTable tasks={atRisk} projects={projects} members={members} onUpdate={onUpdate} onRemove={onRemove} />
      </section>
      <section className="card sp">
        <h2>Completed in the last 7 days</h2>
        <div
          aria-label="Completed tasks in the last 7 days. Scroll horizontally to view all columns"
          className="scroll"
          role="region"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>By</th>
                <th>Completed</th>
                <th>On-time</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((task) => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>{task.assignees?.join(', ') || '—'}</td>
                  <td>{new Date(task.doneAt).toLocaleString()}</td>
                  <td>
                    {!task.due || task.doneAt <= endOf(task.due) ? (
                      <Icon name="check" size={14} color="var(--ok)" />
                    ) : (
                      <span className="late">Late</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {config.ceoEmail && (
          <a
            className="btn"
            href={`mailto:${encodeURIComponent(config.ceoEmail)}?subject=${encodeURIComponent(
              'Completed tasks – ' + today()
            )}`}
          >
            <Icon name="mail" size={14} /> Email CEO this list
          </a>
        )}
      </section>
      <section className="card sp">
        <h2>Employee scorecard</h2>
        <KpiTable rows={rows} members={members} onSelect={onSelectEmployee} />
      </section>
    </>
  )
}

export default KPIAnalyticsPage

