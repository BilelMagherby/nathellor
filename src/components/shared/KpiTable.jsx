import { Icon } from '../ui/Icon.jsx'
import { Avatar } from '../ui/Avatar.jsx'

export function KpiTable({ rows = [], members = [], onSelect }) {
  return (
    <div aria-label="Employee KPI scorecard. Scroll horizontally to view all columns" className="scroll" role="region" tabIndex={0}>
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Managed</th>
            <th>Done</th>
            <th>Open</th>
            <th>Overdue</th>
            <th>On-time</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              className={onSelect ? 'ck' : ''}
              key={row.name}
              onClick={onSelect ? () => onSelect(row.name) : undefined}
              onKeyDown={
                onSelect
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onSelect(row.name)
                      }
                    }
                  : undefined
              }
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect ? 0 : undefined}
            >
              <td>
                <Avatar members={members} name={row.name} /> <b>{row.name}</b>
                {index === 0 && row.total > 0 ? (
                  <span className="winner-badge" title="Top performer">
                    <Icon color="#f59e0b" name="crown" size={14} /> Top
                  </span>
                ) : (
                  ''
                )}
              </td>
              <td>{row.total}</td>
              <td>{row.done}</td>
              <td>{row.open}</td>
              <td className={row.overdue ? 'late' : ''}>{row.overdue}</td>
              <td>{row.done ? Math.round((row.onTime / row.done) * 100) : 100}%</td>
              <td>
                <div className="row">
                  <div className="bar">
                    <i style={{ width: `${row.score}%` }} />
                  </div>
                  <b>{Math.round(row.score)}</b>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

