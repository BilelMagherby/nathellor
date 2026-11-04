import { useEffect, useState } from 'react'
import { Icon } from './icons.jsx'
import { Button, Field } from './AppDialogs.jsx'
import { Metric } from './AppCoreViews.jsx'
import * as shared from './app-data.js'
const { PRIORITY_COLORS, today, isLate, fmtDay, projectName } = shared

export function MeetingSummary({ meetings, projects, onOpen, onCreate, onStart }) {
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

export function MeetingRow({ meeting, projects, onOpen }) {
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

export function MeetingDetail({ meeting, members, projects, busy, onClose, onSave, onSummarize, onCreateTask }) {
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

export function CalendarEventDetail({ event, projects, onClose, onOpenMeeting }) {
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

export function MeetingsPage({ platform, meetings, integration, projects, onOpen, onSchedule, onStart }) {
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

export function CalendarPage({ date, setDate, meetings, tasks, onOpen, onSchedule }) {
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
