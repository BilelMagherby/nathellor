import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from './icons.jsx'
import './foodics.css'

export const FOODICS_SECTIONS = [
  { id: 'reports', label: 'Reports library', shortLabel: 'Reports', icon: 'chart', description: 'A searchable, classified home for every Foodics report and period.' },
  { id: 'purchases', label: 'Purchase bills', shortLabel: 'Purchase bills', icon: 'wallet', description: 'File supplier invoices, supporting documents, and payment status.' },
  { id: 'sales', label: 'Sales bills', shortLabel: 'Sales bills', icon: 'file-check', description: 'Keep sales invoices and bill references together with their source files.' },
  { id: 'vat', label: 'VAT reminders', shortLabel: 'VAT reminders', icon: 'bell', description: 'Maintain filing and review dates without guessing your tax deadlines.' },
  { id: 'procedures', label: 'Procedures', shortLabel: 'Procedures', icon: 'check-square', description: 'Practical opening, shift-close, and exception-handling checklists.' },
  { id: 'accounts', label: 'Chart of Accounts', shortLabel: 'Chart of Accounts', icon: 'table', description: 'A structured reference for mapping Foodics activity to your ledger.' },
  { id: 'documents', label: 'Secure Documents', shortLabel: 'Secure Documents', icon: 'lock', description: 'An organized register for important company and compliance files.' },
]

export const FOODICS_PROJECTS = [
  { id: 'natheel', name: 'Natheel', color: '#d5a33b' },
  { id: 'ghalia', name: 'Ghalia', color: '#d77f9f' },
  { id: 'hajiss', name: 'Hajiss', color: '#d88a55' },
  { id: 'danisquare', name: 'DaniSquare', color: '#62a8b8' },
]

const PROJECT_SECTIONS = FOODICS_SECTIONS.filter((section) => section.id !== 'reports')
const OVERVIEW_SECTION = {
  id: 'overview',
  label: 'Foodics Management',
  shortLabel: 'Overview',
  icon: 'folder',
  description: 'Choose a project workspace to manage its finance and operations records.',
}

const REPORT_TYPES = ['Daily sales', 'Sales by product', 'Payment reconciliation', 'Inventory movement', 'Discounts & voids', 'VAT summary', 'Operations', 'Other']
const DOCUMENT_TYPES = ['Commercial registration', 'Tax registration', 'Foodics agreement', 'Banking', 'Insurance', 'Policy', 'Other']
const PROCEDURES = [
  {
    id: 'opening',
    title: 'Opening readiness',
    cadence: 'Start of day',
    description: 'Confirm the outlet is ready before accepting orders.',
    steps: [
      'Confirm the correct outlet, business date, and active register.',
      'Review menu availability, prices, and any approved service notices.',
      'Check the receipt printer, network connection, and payment terminal.',
      'Count and record the opening cash float using the approved cash-control process.',
      'Escalate access, pricing, or equipment issues before service begins.',
    ],
  },
  {
    id: 'shift-close',
    title: 'Shift close & reconciliation',
    cadence: 'Every shift',
    description: 'Close the shift and retain evidence for the finance review.',
    steps: [
      'Review the shift totals and confirm the business date and outlet.',
      'Reconcile cash and card totals against the corresponding settlement evidence.',
      'Review refunds, voids, and discounts against their approvals and notes.',
      'Complete the close procedure in the current Foodics setup and save its report.',
      'Record variances, assign an owner, and retain supporting documents.',
    ],
  },
  {
    id: 'exception',
    title: 'Refund, void & discount review',
    cadence: 'Each exception',
    description: 'Apply the company approval policy and keep a traceable record.',
    steps: [
      'Confirm the transaction and outlet using the original bill reference.',
      'Verify the request and approval against the current company authorization policy.',
      'Record the reason and supporting evidence before completing the action.',
      'Confirm the final transaction status and include it in the shift review.',
      'Escalate suspected misuse or unresolved discrepancies to the designated manager.',
    ],
  },
  {
    id: 'reporting',
    title: 'Daily report filing',
    cadence: 'End of day',
    description: 'Keep reports consistent and easy to retrieve for review.',
    steps: [
      'Export the approved daily sales and payment reports for the correct date range.',
      'Use a consistent file name: outlet, report type, and period.',
      'Classify each report and add its source, preparer, and notes to the Reports library.',
      'Compare key totals with the closing record and flag any difference.',
      'Store the final version in the approved company record-keeping location.',
    ],
  },
]

const ACCOUNTS = [
  ['1000', 'Cash on hand', 'Asset', 'Cash counted and held at the outlet'],
  ['1010', 'Bank accounts', 'Asset', 'Company bank balances and settlements'],
  ['1100', 'Card settlement receivable', 'Asset', 'Card payments awaiting bank settlement'],
  ['1200', 'Inventory', 'Asset', 'Stock balances supported by inventory records'],
  ['2000', 'Accounts payable', 'Liability', 'Approved supplier balances due'],
  ['2100', 'VAT payable', 'Liability', 'Output VAT liability, subject to accountant review'],
  ['2200', 'VAT recoverable', 'Asset', 'Eligible input VAT, subject to supporting evidence'],
  ['3000', 'Owner equity', 'Equity', 'Capital and other approved equity balances'],
  ['4000', 'Food & beverage sales', 'Revenue', 'Sales classified by the company accounting policy'],
  ['4100', 'Delivery & other sales', 'Revenue', 'Other sales channels, mapped per company policy'],
  ['5000', 'Cost of goods sold', 'Expense', 'Recognized cost for goods sold'],
  ['6000', 'Operating expenses', 'Expense', 'Approved operating and outlet expenses'],
]

let databasePromise

function openFoodicsDatabase() {
  if (!('indexedDB' in window)) return Promise.reject(new Error('This browser does not support persistent document storage.'))
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open('natheelco-foodics-library', 1)
      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains('records')) database.createObjectStore('records', { keyPath: 'id' })
        if (!database.objectStoreNames.contains('files')) database.createObjectStore('files', { keyPath: 'id' })
        if (!database.objectStoreNames.contains('settings')) database.createObjectStore('settings', { keyPath: 'id' })
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error || new Error('Could not open the Foodics library database.'))
      request.onblocked = () => reject(new Error('Close other Natheelco tabs to finish opening the Foodics library.'))
    })
  }
  return databasePromise
}

function runTransaction(storeNames, mode, action) {
  return openFoodicsDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(storeNames, mode)
    let result
    try {
      result = action(Object.fromEntries(storeNames.map((name) => [name, transaction.objectStore(name)])))
    } catch (error) {
      transaction.abort()
      reject(error)
      return
    }
    transaction.oncomplete = () => resolve(result)
    transaction.onerror = () => reject(transaction.error || new Error('The Foodics library could not save this change.'))
    transaction.onabort = () => reject(transaction.error || new Error('The Foodics library change was cancelled.'))
  }))
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Could not read the Foodics library.'))
  })
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatBytes(bytes = 0) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function dueStatus(date) {
  if (!date) return { label: 'Date needed', className: 'needs-date' }
  const due = new Date(`${date}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000)
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, className: 'overdue' }
  if (days === 0) return { label: 'Due today', className: 'due-soon' }
  if (days <= 14) return { label: `Due in ${days}d`, className: 'due-soon' }
  return { label: 'Scheduled', className: 'scheduled' }
}

function FoodicsEntryDialog({ section, onClose, onSave }) {
  const [values, setValues] = useState({
    title: '',
    category: section.id === 'reports' ? REPORT_TYPES[0] : section.id === 'documents' ? DOCUMENT_TYPES[0] : '',
    reference: '',
    counterparty: '',
    date: '',
    dueDate: '',
    frequency: 'One time',
    amount: '',
    currency: 'SAR',
    status: section.id === 'purchases' ? 'Received' : section.id === 'sales' ? 'Issued' : 'Open',
    classification: 'Confidential',
    notes: '',
    file: null,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const fileInput = useRef(null)
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }))
  const isVat = section.id === 'vat'
  const isBill = section.id === 'purchases' || section.id === 'sales'
  const needsDate = section.id === 'vat' || isBill

  async function submit(event) {
    event.preventDefault()
    if (saving) return
    if (!values.title.trim()) return setError('Enter a clear title before saving.')
    if (needsDate && !values.date && !values.dueDate) return setError(isVat ? 'Choose the reminder due date.' : 'Choose the bill date.')
    if (isBill && !values.reference.trim()) return setError('Enter the bill or invoice reference.')
    if (values.file && values.file.size > 100 * 1024 * 1024) return setError('Files must be 100 MB or smaller.')
    setSaving(true)
    setError('')
    try {
      await onSave({
        id: `foodics-${crypto.randomUUID()}`,
        section: section.id,
        title: values.title.trim(),
        category: values.category,
        reference: values.reference.trim(),
        counterparty: values.counterparty.trim(),
        date: values.date,
        dueDate: values.dueDate,
        frequency: values.frequency,
        amount: values.amount === '' ? '' : Number(values.amount),
        currency: values.currency,
        status: values.status,
        classification: values.classification,
        notes: values.notes.trim(),
        fileName: values.file?.name || '',
        fileSize: values.file?.size || 0,
        fileType: values.file?.type || '',
        fileId: values.file ? `foodics-file-${crypto.randomUUID()}` : '',
        createdAt: new Date().toISOString(),
      }, values.file)
      onClose()
    } catch (cause) {
      setError(cause.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="foodics-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form aria-labelledby="foodics-entry-title" aria-modal="true" className="foodics-entry-modal" onSubmit={submit} role="dialog">
        <header className="foodics-modal-header">
          <div><span className="foodics-kicker">FOODICS MANAGEMENT</span><h2 id="foodics-entry-title">Add to {section.shortLabel}</h2></div>
          <button aria-label="Close dialog" className="foodics-icon-button" onClick={onClose} type="button"><Icon name="close" size={18} /></button>
        </header>
        <div className="foodics-form-grid">
          <label className="foodics-field foodics-field-wide"><span>{isVat ? 'Reminder name' : isBill ? 'Bill title' : 'Title'}</span><input autoFocus maxLength="140" onChange={(event) => update('title', event.target.value)} placeholder={isVat ? 'e.g. VAT return preparation' : 'Give this record a clear name'} required value={values.title} /></label>
          {(section.id === 'reports' || section.id === 'documents') && <label className="foodics-field"><span>Classification</span><select onChange={(event) => update('category', event.target.value)} value={values.category}>{(section.id === 'reports' ? REPORT_TYPES : DOCUMENT_TYPES).map((item) => <option key={item}>{item}</option>)}</select></label>}
          {isBill && <label className="foodics-field"><span>{section.id === 'purchases' ? 'Supplier' : 'Customer / channel'}</span><input onChange={(event) => update('counterparty', event.target.value)} placeholder={section.id === 'purchases' ? 'Supplier name' : 'Customer or sales channel'} value={values.counterparty} /></label>}
          {isBill && <label className="foodics-field"><span>Invoice / bill number</span><input onChange={(event) => update('reference', event.target.value)} placeholder="Reference number" required value={values.reference} /></label>}
          {isBill && <label className="foodics-field"><span>Amount (SAR)</span><input min="0" onChange={(event) => update('amount', event.target.value)} placeholder="0.00" step="0.01" type="number" value={values.amount} /></label>}
          {isBill && <label className="foodics-field"><span>Bill date</span><input onChange={(event) => update('date', event.target.value)} required type="date" value={values.date} /></label>}
          {isBill && <label className="foodics-field"><span>Record status</span><select onChange={(event) => update('status', event.target.value)} value={values.status}>{(section.id === 'purchases' ? ['Received', 'Under review', 'Approved', 'Paid', 'On hold'] : ['Issued', 'Part paid', 'Paid', 'Voided']).map((item) => <option key={item}>{item}</option>)}</select></label>}
          {isVat && <label className="foodics-field"><span>Due date</span><input onChange={(event) => update('dueDate', event.target.value)} required type="date" value={values.dueDate} /></label>}
          {isVat && <label className="foodics-field"><span>Cycle reference</span><select onChange={(event) => update('frequency', event.target.value)} value={values.frequency}>{['One time', 'Monthly', 'Quarterly', 'Annual', 'As scheduled'].map((item) => <option key={item}>{item}</option>)}</select><small>Enter each filing date separately; this does not automatically schedule the next date.</small></label>}
          {section.id === 'documents' && <label className="foodics-field"><span>Access classification</span><select onChange={(event) => update('classification', event.target.value)} value={values.classification}>{['Confidential', 'Restricted', 'Internal'].map((item) => <option key={item}>{item}</option>)}</select></label>}
          {section.id === 'reports' && <label className="foodics-field"><span>Report period</span><input onChange={(event) => update('date', event.target.value)} type="month" value={values.date} /></label>}
          <label className="foodics-field foodics-field-wide"><span>Notes</span><textarea maxLength="1200" onChange={(event) => update('notes', event.target.value)} placeholder="Add context, owner, approval reference, or review notes" rows="3" value={values.notes} /></label>
          <label className="foodics-field foodics-field-wide"><span>Supporting file <small>Optional · maximum 100 MB</small></span><input onChange={(event) => update('file', event.target.files?.[0] || null)} ref={fileInput} type="file" />{values.file && <span className="foodics-selected-file"><Icon name="paperclip" size={13} /> {values.file.name} · {formatBytes(values.file.size)}</span>}</label>
        </div>
        {error && <p className="foodics-form-error" role="alert"><Icon name="alert-triangle" size={15} /> {error}</p>}
        <footer className="foodics-modal-actions"><button className="foodics-button secondary" onClick={onClose} type="button">Cancel</button><button className="foodics-button primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save record'}</button></footer>
      </form>
    </div>
  )
}

export function FoodicsManagementNav({ activeSection, activeProject, expandedProject, mobile = false, onSelect, onProjectSelect, onSectionSelect, open, onToggle, page }) {
  const active = page === 'foodics'
  return (
    <div className={`foodics-nav${mobile ? ' foodics-nav-mobile' : ''}${active ? ' is-active' : ''}`}>
      <div className="foodics-nav-heading">
        <button aria-current={active && activeSection === 'overview' ? 'page' : undefined} className="foodics-nav-main" onClick={() => onSelect('overview')} type="button">
          <span className="foodics-nav-icon"><Icon name="folder" size={17} /></span>
          <span className="foodics-nav-label">Foodics Management</span>
        </button>
        <button aria-expanded={open} aria-label={`${open ? 'Collapse' : 'Expand'} Foodics Management sections`} className="foodics-nav-toggle" onClick={onToggle} type="button">
          <Icon name={open ? 'chevron-left' : 'chevron-right'} size={15} />
        </button>
      </div>
      {open && <div className="foodics-nav-sections">
        <button aria-current={active && activeSection === 'reports' ? 'page' : undefined} className={`foodics-nav-item foodics-nav-reports${active && activeSection === 'reports' ? ' selected' : ''}`} onClick={() => onSelect('reports')} type="button">
          <Icon name="chart" size={14} /><span>Reports library</span>
        </button>
        {FOODICS_PROJECTS.map((project) => (
          <div className="foodics-nav-project-group" key={project.id}>
            <button aria-expanded={expandedProject === project.id} aria-current={active && activeProject === project.id && activeSection !== 'overview' ? 'location' : undefined} className={`foodics-nav-project${active && activeProject === project.id ? ' selected' : ''}`} onClick={() => onProjectSelect(project.id)} type="button">
              <span className="foodics-project-mark" style={{ '--project-color': project.color }}>{project.name.slice(0, 1)}</span>
              <span className="foodics-nav-project-name">{project.name}</span>
              <Icon className="foodics-nav-project-chevron" name={expandedProject === project.id ? 'chevron-down' : 'chevron-right'} size={13} />
            </button>
            {expandedProject === project.id && <div className="foodics-nav-project-sections">
              {PROJECT_SECTIONS.map((section) => (
                <button aria-current={active && activeProject === project.id && activeSection === section.id ? 'page' : undefined} className={`foodics-nav-item${active && activeProject === project.id && activeSection === section.id ? ' selected' : ''}`} key={section.id} onClick={() => onSectionSelect(project.id, section.id)} type="button">
                  <Icon name={section.icon} size={14} /><span>{section.shortLabel}</span>
                </button>
              ))}
            </div>}
          </div>
        ))}
      </div>}
    </div>
  )
}

export function FoodicsManagement({ activeSection, activeProject, onSelectProject, onSelectSection }) {
  const [records, setRecords] = useState([])
  const [workflow, setWorkflow] = useState({})
  const [loading, setLoading] = useState(true)
  const [storageError, setStorageError] = useState('')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const section = activeSection === 'overview'
    ? OVERVIEW_SECTION
    : FOODICS_SECTIONS.find((item) => item.id === activeSection) || OVERVIEW_SECTION
  const project = FOODICS_PROJECTS.find((item) => item.id === activeProject)
  const searchInput = useRef(null)

  useEffect(() => setSearch(''), [activeProject, section.id])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const database = await openFoodicsDatabase()
        const result = await Promise.all([
          requestResult(database.transaction('records', 'readonly').objectStore('records').getAll()),
          requestResult(database.transaction('settings', 'readonly').objectStore('settings').get('workflow')),
          ...FOODICS_PROJECTS.map((item) => requestResult(database.transaction('settings', 'readonly').objectStore('settings').get(`workflow:${item.id}`))),
        ])
        if (mounted) {
          setRecords(result[0].map((record) => record.section !== 'reports' && !record.projectId
            ? { ...record, projectId: FOODICS_PROJECTS[0].id }
            : record).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))))
          setWorkflow(Object.fromEntries(FOODICS_PROJECTS.map((item, index) => [
            item.id,
            result[index + 2]?.value || (item.id === FOODICS_PROJECTS[0].id ? result[1]?.value : null) || {},
          ])))
        }
      } catch (cause) {
        if (mounted) setStorageError(cause.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const sectionRecords = useMemo(() => records.filter((record) => record.section === section.id
    && (section.id === 'reports' || record.projectId === activeProject)),
  [activeProject, records, section.id])
  const filteredRecords = useMemo(() => sectionRecords.filter((record) =>
    !search || [record.title, record.category, record.reference, record.counterparty, record.notes, record.fileName, record.classification]
      .filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase())
  ), [sectionRecords, search])

  async function saveRecord(record, file) {
    const scopedRecord = section.id === 'reports' ? record : { ...record, projectId: activeProject }
    await runTransaction(file ? ['records', 'files'] : ['records'], 'readwrite', (stores) => {
      stores.records.put(scopedRecord)
      if (file) stores.files.put({ id: scopedRecord.fileId, blob: file })
    })
    setRecords((current) => [scopedRecord, ...current])
    setNotice('Record saved to this browser’s Foodics library.')
    window.setTimeout(() => setNotice(''), 4000)
  }

  async function removeRecord(record) {
    if (!window.confirm(`Permanently remove “${record.title}”${record.fileName ? ' and its saved file' : ''}?`)) return
    try {
      await runTransaction(record.fileId ? ['records', 'files'] : ['records'], 'readwrite', (stores) => {
        stores.records.delete(record.id)
        if (record.fileId) stores.files.delete(record.fileId)
      })
      setRecords((current) => current.filter((item) => item.id !== record.id))
      setNotice('Record removed.')
    } catch (cause) {
      setStorageError(cause.message)
    }
  }

  async function downloadFile(record) {
    if (!record.fileId) return
    try {
      const database = await openFoodicsDatabase()
      const saved = await requestResult(database.transaction('files', 'readonly').objectStore('files').get(record.fileId))
      if (!saved?.blob) throw new Error('The saved file is missing from this browser.')
      const url = URL.createObjectURL(saved.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = record.fileName || 'foodics-document'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (cause) {
      setStorageError(cause.message)
    }
  }

  async function toggleChecklist(stepId) {
    const next = { ...workflow, [stepId]: !workflow[stepId] }
    try {
      await runTransaction(['settings'], 'readwrite', (stores) => stores.settings.put({ id: `workflow:${activeProject}`, value: next }))
      setWorkflow((current) => ({ ...current, [activeProject]: next }))
    } catch (cause) {
      setStorageError(cause.message)
    }
  }

  async function updateVatRecord(record) {
    const next = { ...record, completed: !record.completed }
    try {
      await runTransaction(['records'], 'readwrite', (stores) => stores.records.put(next))
      setRecords((current) => current.map((item) => item.id === record.id ? next : item))
    } catch (cause) {
      setStorageError(cause.message)
    }
  }

  const currentWorkflow = workflow[activeProject] || {}
  const completedSteps = PROCEDURES.flatMap((procedure) => procedure.steps.map((_, index) => `${procedure.id}-${index}`)).filter((id) => currentWorkflow[id]).length
  const totalSteps = PROCEDURES.reduce((sum, procedure) => sum + procedure.steps.length, 0)

  function renderFileCell(record) {
    return record.fileId
      ? <button className="foodics-file-link" onClick={() => downloadFile(record)} type="button"><Icon name="download" size={14} /> {record.fileName} <small>{formatBytes(record.fileSize)}</small></button>
      : <span className="foodics-muted">No attachment</span>
  }

  function renderRecordTable() {
    if (!filteredRecords.length) {
      return <div className="foodics-empty"><span className="foodics-empty-icon"><Icon name={section.icon} size={22} /></span><h3>{search ? 'No matching records' : `No ${section.shortLabel.toLowerCase()} filed yet`}</h3><p>{search ? 'Try another search term or clear your filter.' : 'Add a record and attach its source file to build a traceable library.'}</p>{!search && <button className="foodics-button primary" onClick={() => setDialogOpen(true)} type="button"><Icon name="plus" size={15} /> Add first record</button>}</div>
    }

    if (section.id === 'vat') return (
      <div className="foodics-table-scroll"><table className="foodics-table"><thead><tr><th>Reminder</th><th>Due date</th><th>Cadence</th><th>Notes</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {filteredRecords.map((record) => {
          const due = dueStatus(record.dueDate)
          return <tr key={record.id}><td><strong>{record.title}</strong></td><td>{formatDate(record.dueDate)}</td><td>{record.frequency}</td><td className="foodics-notes-cell">{record.notes || '—'}</td><td><span className={`foodics-status ${record.completed ? 'complete' : due.className}`}>{record.completed ? 'Complete' : due.label}</span></td><td><div className="foodics-row-actions"><button aria-label={`${record.completed ? 'Reopen' : 'Mark complete'} ${record.title}`} className="foodics-small-button" onClick={() => updateVatRecord(record)} type="button">{record.completed ? 'Reopen' : 'Complete'}</button><button aria-label={`Delete ${record.title}`} className="foodics-icon-button danger" onClick={() => removeRecord(record)} type="button"><Icon name="trash" size={14} /></button></div></td></tr>
        })}
      </tbody></table></div>
    )

    if (section.id === 'purchases' || section.id === 'sales') return (
      <div className="foodics-table-scroll"><table className="foodics-table"><thead><tr><th>Bill</th><th>{section.id === 'purchases' ? 'Supplier' : 'Customer / channel'}</th><th>Reference</th><th>Date</th><th>Amount</th><th>Status</th><th>Supporting file</th><th>Actions</th></tr></thead><tbody>
        {filteredRecords.map((record) => <tr key={record.id}><td><strong>{record.title}</strong></td><td>{record.counterparty || '—'}</td><td>{record.reference}</td><td>{formatDate(record.date)}</td><td>{record.amount === '' ? '—' : `${Number(record.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${record.currency || 'SAR'}`}</td><td><span className={`foodics-status ${record.status === 'Paid' ? 'complete' : 'scheduled'}`}>{record.status || 'Received'}</span></td><td>{renderFileCell(record)}</td><td><button aria-label={`Delete ${record.title}`} className="foodics-icon-button danger" onClick={() => removeRecord(record)} type="button"><Icon name="trash" size={14} /></button></td></tr>)}
      </tbody></table></div>
    )

    if (section.id === 'documents') return (
      <div className="foodics-table-scroll"><table className="foodics-table"><thead><tr><th>Document</th><th>Category</th><th>Classification</th><th>Review date</th><th>File</th><th>Actions</th></tr></thead><tbody>
        {filteredRecords.map((record) => <tr key={record.id}><td><strong>{record.title}</strong><small className="foodics-sub-cell">{record.notes || '—'}</small></td><td>{record.category}</td><td><span className={`foodics-classification ${record.classification.toLowerCase()}`}>{record.classification}</span></td><td>{formatDate(record.date)}</td><td>{renderFileCell(record)}</td><td><button aria-label={`Delete ${record.title}`} className="foodics-icon-button danger" onClick={() => removeRecord(record)} type="button"><Icon name="trash" size={14} /></button></td></tr>)}
      </tbody></table></div>
    )

    return (
      <div className="foodics-table-scroll"><table className="foodics-table"><thead><tr><th>Report</th><th>Classification</th><th>Period</th><th>Notes</th><th>File</th><th>Actions</th></tr></thead><tbody>
        {filteredRecords.map((record) => <tr key={record.id}><td><strong>{record.title}</strong></td><td>{record.category}</td><td>{record.date || '—'}</td><td className="foodics-notes-cell">{record.notes || '—'}</td><td>{renderFileCell(record)}</td><td><button aria-label={`Delete ${record.title}`} className="foodics-icon-button danger" onClick={() => removeRecord(record)} type="button"><Icon name="trash" size={14} /></button></td></tr>)}
      </tbody></table></div>
    )
  }

  return (
    <section aria-labelledby="foodics-page-title" className="foodics-page">
      <header className="foodics-page-header">
        <div className="foodics-page-heading">
          <span className="foodics-kicker"><Icon name="folder" size={14} /> {project ? `${project.name.toUpperCase()} WORKSPACE` : 'FOODICS MANAGEMENT'}</span>
          <h1 id="foodics-page-title">{section.id === 'overview' && project ? `${project.name} workspace` : section.label}</h1>
          <p>{section.id === 'overview' && project ? `Manage ${project.name} bills, VAT reminders, procedures, accounts, and documents in one place.` : section.description}</p>
        </div>
        {section.id === 'overview' && project && <button className="foodics-button secondary" onClick={() => onSelectProject('')} type="button"><Icon name="chevron-left" size={15} /> All projects</button>}
        {section.id !== 'overview' && section.id !== 'accounts' && section.id !== 'procedures' && <button className="foodics-button primary" onClick={() => setDialogOpen(true)} type="button"><Icon name="plus" size={16} /> {section.id === 'vat' ? 'Add reminder' : 'Add record'}</button>}
      </header>

      <div className="foodics-storage-note" role="note"><Icon name="info" size={16} /><span><strong>Browser-local archive.</strong> Records and files remain in this browser profile; they are not encrypted, backed up, or shared across devices. Do not store sensitive files here unless this device and deployment are approved for them.</span></div>
      {storageError && <div className="foodics-error" role="alert"><Icon name="alert-triangle" size={16} /><span>{storageError}</span><button aria-label="Dismiss error" onClick={() => setStorageError('')} type="button"><Icon name="close" size={14} /></button></div>}
      {notice && <div className="foodics-success" role="status"><Icon name="check-circle" size={15} />{notice}</div>}

      {section.id === 'overview' ? <div className="foodics-workspace-grid">
        {project
          ? PROJECT_SECTIONS.map((item) => {
            const count = records.filter((record) => record.projectId === project.id && record.section === item.id).length
            const countLabel = item.id === 'procedures'
              ? `${PROCEDURES.length} checklists`
              : item.id === 'accounts'
                ? `${ACCOUNTS.length} accounts`
                : `${count} ${count === 1 ? 'record' : 'records'}`
            return <button className="foodics-workspace-card" key={item.id} onClick={() => onSelectSection(project.id, item.id)} type="button">
              <span className="foodics-workspace-icon"><Icon name={item.icon} size={19} /></span>
              <span className="foodics-workspace-card-title">{item.label}</span>
              <span className="foodics-workspace-card-description">{item.description}</span>
              <span className="foodics-workspace-card-footer">{countLabel} <Icon name="chevron-right" size={14} /></span>
            </button>
          })
          : FOODICS_PROJECTS.map((item) => {
            const count = records.filter((record) => record.projectId === item.id).length
            return <button className="foodics-project-card" key={item.id} onClick={() => onSelectProject(item.id)} style={{ '--project-color': item.color }} type="button">
              <span className="foodics-project-card-icon">{item.name.slice(0, 1)}</span>
              <span className="foodics-project-card-content"><strong>{item.name}</strong><small>Foodics project workspace</small></span>
              <span className="foodics-project-card-count">{count} {count === 1 ? 'record' : 'records'}</span>
              <Icon className="foodics-project-card-arrow" name="chevron-right" size={16} />
            </button>
          })}
      </div> : section.id === 'accounts' ? <>
        <div className="foodics-account-notice"><Icon name="alert-circle" size={17} /><div><strong>Reference structure only</strong><p>These example account groupings are not your approved ledger or a tax treatment decision. Confirm account codes, mappings, and VAT treatment with your accountant before use.</p></div></div>
        <div className="foodics-summary-grid">
          <div className="foodics-summary-card"><span>Reference accounts</span><strong>{ACCOUNTS.length}</strong><small>Illustrative starting point</small></div>
          <div className="foodics-summary-card"><span>Account groups</span><strong>4</strong><small>Asset · liability · equity · P&amp;L</small></div>
          <div className="foodics-summary-card"><span>Mapping status</span><strong className="foodics-summary-review">Review required</strong><small>Confirm with finance before posting</small></div>
        </div>
        <div className="foodics-panel">
          <div className="foodics-panel-header"><div><h2>Foodics-to-ledger reference</h2><p>Use your signed-off accounting policy as the source of truth.</p></div><label className="foodics-search"><Icon name="search" size={15} /><input aria-label="Search chart of accounts" onChange={(event) => setSearch(event.target.value)} placeholder="Search accounts" ref={searchInput} value={search} />{search && <button aria-label="Clear search" onClick={() => setSearch('')} type="button"><Icon name="close" size={13} /></button>}</label></div>
          <div className="foodics-table-scroll"><table className="foodics-table"><thead><tr><th>Code</th><th>Account</th><th>Type</th><th>Purpose / mapping note</th></tr></thead><tbody>{ACCOUNTS.filter((account) => !search || account.join(' ').toLowerCase().includes(search.toLowerCase())).map(([code, name, type, note]) => <tr key={code}><td className="foodics-account-code">{code}</td><td><strong>{name}</strong></td><td><span className={`foodics-account-type ${type.toLowerCase()}`}>{type}</span></td><td>{note}</td></tr>)}</tbody></table></div>
          <div className="foodics-panel-footer">Illustrative account names and codes only · No actual ledger entries are stored here.</div>
        </div>
      </> : section.id === 'procedures' ? <>
        <div className="foodics-procedure-summary"><div><span className="foodics-kicker">SHIFT CONTROL</span><h2>Repeatable checks. Clear evidence.</h2><p>Mark steps as you complete them. Progress is saved in this browser profile.</p></div><div className="foodics-progress"><strong>{completedSteps}<span> / {totalSteps}</span></strong><small>checks completed</small><div className="foodics-progress-track"><i style={{ width: `${totalSteps ? completedSteps / totalSteps * 100 : 0}%` }} /></div></div></div>
        <div className="foodics-procedure-grid">{PROCEDURES.map((procedure, procedureIndex) => {
          const done = procedure.steps.filter((_, index) => currentWorkflow[`${procedure.id}-${index}`]).length
          return <article className="foodics-procedure-card" key={procedure.id}><header><span className="foodics-procedure-number">{String(procedureIndex + 1).padStart(2, '0')}</span><span className="foodics-cadence">{procedure.cadence}</span></header><h3>{procedure.title}</h3><p>{procedure.description}</p><div className="foodics-procedure-count">{done} of {procedure.steps.length} complete</div><ol>{procedure.steps.map((step, index) => {
            const id = `${procedure.id}-${index}`
            return <li key={id}><label className={currentWorkflow[id] ? 'is-checked' : ''}><input checked={Boolean(currentWorkflow[id])} onChange={() => toggleChecklist(id)} type="checkbox" /><span>{step}</span></label></li>
          })}</ol></article>
        })}</div>
        <div className="foodics-procedure-footnote"><Icon name="info" size={15} /> Verify exact Foodics controls and approval limits against your current outlet configuration and company policy.</div>
      </> : <>
        {section.id === 'vat' && <div className="foodics-vat-guidance"><span><Icon name="calendar-clock" size={18} /></span><div><strong>Use your registered filing calendar</strong><p>Set a separate reminder for each return, payment, or supporting-data milestone. Filing frequency and due dates depend on your tax profile; confirm them with your tax adviser. Reminders appear here while the app is open.</p></div></div>}
        {section.id === 'reports' && <div className="foodics-category-strip"><strong>Suggested report classes</strong>{REPORT_TYPES.slice(0, 7).map((type) => <span key={type}>{type}</span>)}</div>}
        {section.id === 'documents' && <div className="foodics-document-guidance"><span><Icon name="lock" size={17} /></span><div><strong>Classification is an organizational label, not an access-control boundary.</strong><p>Use an approved encrypted company repository for confidential originals. This workspace does not enforce per-document permissions.</p></div></div>}
        <div className="foodics-summary-grid">
          <div className="foodics-summary-card"><span>{section.id === 'vat' ? 'Active reminders' : 'Filed records'}</span><strong>{sectionRecords.filter((record) => !record.completed).length}</strong><small>{section.id === 'vat' ? 'Open items in this library' : `${sectionRecords.filter((record) => record.fileId).length} with a saved file`}</small></div>
          <div className="foodics-summary-card"><span>Searchable entries</span><strong>{sectionRecords.length}</strong><small>Stored in this browser profile</small></div>
          <div className="foodics-summary-card"><span>Current view</span><strong className="foodics-summary-label">{section.shortLabel}</strong><small>Kept separate from other libraries</small></div>
        </div>
        <div className="foodics-panel">
          <div className="foodics-panel-header"><div><h2>{section.id === 'vat' ? 'Reminder register' : section.id === 'reports' ? 'Report register' : section.id === 'documents' ? 'Document register' : `${section.shortLabel} register`}</h2><p>{section.id === 'vat' ? 'Track preparation, review, and filing milestones.' : 'Each entry stays in this section and can be found by its title, reference, category, or file name.'}</p></div><label className="foodics-search"><Icon name="search" size={15} /><input aria-label={`Search ${section.shortLabel}`} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${section.shortLabel.toLowerCase()}`} ref={searchInput} value={search} />{search && <button aria-label="Clear search" onClick={() => setSearch('')} type="button"><Icon name="close" size={13} /></button>}</label></div>
          {loading ? <div className="foodics-loading"><span className="foodics-spinner" /> Loading your Foodics library…</div> : renderRecordTable()}
          <div className="foodics-panel-footer"><Icon name="database" size={13} /> {filteredRecords.length} {filteredRecords.length === 1 ? 'entry' : 'entries'} shown · Browser-local storage</div>
        </div>
      </>}

      {dialogOpen && <FoodicsEntryDialog key={`${activeProject || 'all'}-${section.id}`} onClose={() => setDialogOpen(false)} onSave={saveRecord} section={section} />}
    </section>
  )
}
