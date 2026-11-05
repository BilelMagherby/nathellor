import { Icon } from './Icon.jsx'

export function NotificationButton({ count, onClick }) {
  return (
    <button aria-label="Reminders" className="btn g bell" onClick={onClick} title={count ? `${count} reminder(s)` : 'No reminders'}>
      <Icon name="bell" size={18} />
      {count > 0 && <span className="bubble">{count}</span>}
    </button>
  )
}

