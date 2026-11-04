import { useEffect, useRef, useState } from 'react'
import { Icon } from './icons.jsx'
import { Button } from './AppDialogs.jsx'
import * as shared from './app-data.js'
const { NATHEEL_GULF_SECTIONS, GULF_PROJECT_NODES, today } = shared

export function NatheelGulfNav({ id, open, onToggle, projects, filters, page, selectedNode, onSelectRoot, onSelect, mobile = false }) {
  return (
    <div className={`natheel-gulf-nav${mobile ? ' mobile-natheel-gulf-nav' : ''}`}>
      <div className={`natheel-gulf-trigger${page === 'gulf' ? ' on' : ''}`}>
        <button aria-current={page === 'gulf' ? 'page' : undefined} className="natheel-gulf-main" onClick={onSelectRoot} type="button">
          <span className="natheel-gulf-icon"><Icon name="award" size={18} /></span>
          <span className="natheel-gulf-label">Natheel Gulf</span>
        </button>
        <button aria-controls={id} aria-expanded={open} aria-label={`${open ? 'Collapse' : 'Expand'} Natheel Gulf sections`} className="natheel-gulf-toggle" onClick={onToggle} type="button">
          <Icon className={`natheel-gulf-chevron${open ? ' expanded' : ''}`} name="chevron-right" size={14} />
        </button>
      </div>
      {open && (
        <div aria-label="Natheel Gulf projects" className="natheel-gulf-sections" id={id}>
          <span className="natheel-gulf-sections-label">Projects</span>
          {NATHEEL_GULF_SECTIONS.map(([projectId, label]) => {
            const project = projects.find((item) => item.id === projectId)
            const selected = GULF_PROJECT_NODES[projectId] === selectedNode
            return (
              <button
                aria-current={selected ? 'location' : undefined}
                className={`natheel-gulf-section${selected ? ' on' : ''}`}
                disabled={!project}
                key={projectId}
                onClick={() => onSelect(project.id)}
                title={project ? `Show tasks for ${label}` : `${label} is not configured in Projects`}
                type="button"
              >
                <span className="natheel-gulf-project-icon" style={{ '--project-color': project?.color || '#64748b' }}><Icon name="folder" size={13} /></span>
                <span className="natheel-gulf-project-name">{label}</span>
                <Icon className="natheel-gulf-project-chevron" name="chevron-right" size={13} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function GulfCoreHubOverview({ assets, nodes, onOpenAssets }) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const byId = new Map(assets.map((asset) => [asset.id, asset]))
  const projectStorage = [
    { name: 'Natheel Gulf', size: '3.6 MB', count: 3, color: '#2563eb', ratio: 46 },
    { name: 'Hajiss Cafe Outlet', size: '3.0 MB', count: 2, color: '#d97706', ratio: 39 },
    { name: 'Dani Square', size: '1.1 MB', count: 1, color: '#0891b2', ratio: 14 },
    { name: 'Hajiss Cafe Holding Block', size: '32.1 KB', count: 1, color: '#7c3aed', ratio: 1 },
  ]
  const recent = [
    ['gulf-zatca'],
    ['gulf-crn'],
    ['gulf-presentations'],
    ['gulf-dani-presentation'],
    ['gulf-hajiss-spreadsheet', 'Hail_Cafes_Influencers_Database.xlsx'],
    ['gulf-hajiss-suppliers'],
  ].map(([id, name]) => ({ ...byId.get(id), name: name || byId.get(id)?.name })).filter((asset) => asset.id)
  const activity = [8, 12, 9, 15, 11, 18, 12, 22, 16, 14, 25, 18, 21, 17, 29, 20, 24, 19, 32, 23, 27, 21, 35, 29, 24, 38, 31, 35, 43, 48]

  return (
    <section aria-labelledby="gulf-overview-title" className="gulf-overview">
      <header className="gulf-overview-heading">
        <div><span className="gulf-eyebrow"><Icon name="dashboard" size={14} /> CORE HUB</span><h1 id="gulf-overview-title">Overview</h1><p>Everything stored in the Data Bank.</p></div>
        <Button onClick={onOpenAssets}><Icon name="folder" size={15} /> Browse files</Button>
      </header>
      <div className="gulf-overview-metrics">
        <article className="gulf-overview-metric"><span className="gulf-overview-metric-icon blue"><Icon name="file-text" size={18} /></span><span className="gulf-overview-metric-label">Files stored</span><strong>7</strong></article>
        <article className="gulf-overview-metric"><span className="gulf-overview-metric-icon green"><Icon name="database" size={18} /></span><span className="gulf-overview-metric-label">Total size</span><strong>7.7 MB</strong></article>
        <article className="gulf-overview-metric"><span className="gulf-overview-metric-icon violet"><Icon name="folder" size={18} /></span><span className="gulf-overview-metric-label">Active projects</span><strong>8 / 8</strong></article>
        <article className="gulf-overview-metric"><span className="gulf-overview-metric-icon amber"><Icon name="clock" size={18} /></span><span className="gulf-overview-metric-label">Added in the last 7 days</span><strong>4</strong></article>
      </div>
      <div className="gulf-overview-grid">
        <section className="gulf-overview-card">
          <div className="gulf-overview-card-heading"><div><h2>Storage by project</h2><p>Files and storage used</p></div><Icon name="chart" size={18} /></div>
          <div className="gulf-storage-list">
            {projectStorage.map((project) => (
              <div className="gulf-storage-item" key={project.name}>
                <div className="gulf-storage-label"><span><i style={{ background: project.color }} />{project.name}</span><b>{project.size} · {project.count}</b></div>
                <div className="gulf-storage-track"><i style={{ width: `${project.ratio}%`, background: project.color }} /></div>
              </div>
            ))}
          </div>
        </section>
        <section className="gulf-overview-card gulf-file-types-card">
          <div className="gulf-overview-card-heading"><div><h2>File types</h2><p>Breakdown by format</p></div><Icon name="file-text" size={18} /></div>
          <div className="gulf-type-row"><span className="gulf-type-icon pdf"><Icon name="file-text" size={17} /></span><span>PDF</span><b>5</b></div>
          <div className="gulf-type-row"><span className="gulf-type-icon spreadsheet"><Icon name="table" size={17} /></span><span>Spreadsheets &amp; data</span><b>2</b></div>
        </section>
        <section className="gulf-overview-card gulf-activity-card">
          <div className="gulf-overview-card-heading"><div><h2>Added, last 30 days</h2><p>Asset activity over time</p></div><Icon name="chart" size={18} /></div>
          <div aria-label="File activity from October 3, 2026 to today" className="gulf-activity-chart" role="img">
            {activity.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
          </div>
          <div className="gulf-chart-axis"><span>Oct 3, 2026</span><span>Today</span></div>
        </section>
        <section className="gulf-overview-card gulf-recent-card">
          <div className="gulf-overview-card-heading"><div><h2>Recent files</h2><p>Latest assets added to the Data Bank</p></div><Button className="gulf-recent-link" onClick={onOpenAssets}>View all <Icon name="arrow-right" size={14} /></Button></div>
          <div className="gulf-recent-list">
            {recent.map((asset) => (
              <button className="gulf-recent-file" key={asset.id} onClick={onOpenAssets} type="button">
                <span className={`gulf-file-type ${asset.type === 'PDF' ? 'pdf' : 'sheet'}`}><Icon name="file-text" size={17} /></span>
                <span className="gulf-recent-file-main"><b dir="auto" title={asset.name}>{asset.name}</b><small>{nodeById.get(asset.node)?.name || 'Natheel Gulf'} · {asset.size} · {asset.added}</small></span>
                <Icon className="gulf-recent-chevron" name="chevron-right" size={15} />
              </button>
            ))}
          </div>
        </section>
      </div>
      <footer className="gulf-footnote"><Icon name="lock" size={14} /> Protected by an access code. Labels such as Confidential describe a file; they do not hide it.</footer>
    </section>
  )
}

export function EmailClientPage({ assets, nodes, config, onToast }) {
  const [activeTab, setActiveTab] = useState('compose')
  const [contacts, setContacts] = useState([])
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [footer, setFooter] = useState('')
  const [oneEmail, setOneEmail] = useState(true)
  const [selectedDataBank, setSelectedDataBank] = useState([])
  const [deviceFiles, setDeviceFiles] = useState([])
  const [showDataBank, setShowDataBank] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const deviceInput = useRef(null)
  const sender = config.emails?.['Asma Ghidhaoui'] || 'asma.g@natheelco.com'
  const parseAddresses = (value) => value.split(/[;,\n]+/).map((part) => {
    const bracketed = part.match(/<([^<>]+)>/)
    return (bracketed ? bracketed[1] : part).trim()
  }).filter(Boolean)
  const recipientCount = new Set([...parseAddresses(to), ...parseAddresses(cc), ...parseAddresses(bcc)].map((email) => email.toLowerCase())).size
  const dataBankSize = selectedDataBank.reduce((total, assetId) => {
    const asset = assets.find((item) => item.id === assetId)
    if (!asset) return total
    const match = asset.size.match(/^([\d.]+)\s*(KB|MB)$/i)
    if (!match) return total
    return total + Number(match[1]) * (match[2].toUpperCase() === 'MB' ? 1 : 1 / 1024)
  }, 0)
  const deviceSize = deviceFiles.reduce((total, file) => total + file.size / (1024 * 1024), 0)
  const totalAttachmentSize = dataBankSize + deviceSize
  const formatAttachmentSize = (size) => size < 1 ? `${(size * 1024).toFixed(1)} KB` : `${size.toFixed(1)} MB`
  const updateDeviceFiles = (fileList) => {
    const nextFiles = [...deviceFiles, ...fileList]
    const nextSize = nextFiles.reduce((total, file) => total + file.size / (1024 * 1024), dataBankSize)
    if (nextSize > 18) {
      onToast('Attachments must be 18 MB or less in total.')
      return
    }
    setDeviceFiles(nextFiles)
  }
  const openDraft = (test = false) => {
    const recipients = test ? sender : parseAddresses(to).join(',')
    if (!recipients) {
      onToast('Add at least one To address before continuing.')
      return
    }
    const body = [message, footer && `\n\n${footer}`].filter(Boolean).join('')
    const params = new URLSearchParams()
    if (cc.trim()) params.set('cc', cc)
    if (bcc.trim()) params.set('bcc', bcc)
    if (subject || test) params.set('subject', `${test ? '[Test] ' : ''}${subject}`)
    if (body) params.set('body', body)
    window.location.href = `mailto:${encodeURIComponent(recipients)}?${params.toString()}`
    onToast('Email draft opened in your mail app. Add the selected attachments there before sending.')
  }
  const addContact = (event) => {
    event.preventDefault()
    const email = contactEmail.trim()
    if (!contactName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      onToast('Enter a contact name and a valid email address.')
      return
    }
    if (contacts.some((contact) => contact.email.toLowerCase() === email.toLowerCase())) {
      onToast('That contact is already saved.')
      return
    }
    setContacts((current) => [...current, { name: contactName.trim(), email }])
    setContactName('')
    setContactEmail('')
    onToast('Contact saved for this session.')
  }
  const addContactToRecipients = (contact) => {
    setTo((current) => current.trim() ? `${current.trim()}, ${contact.name} <${contact.email}>` : `${contact.name} <${contact.email}>`)
    setActiveTab('compose')
  }

  return (
    <section aria-labelledby="gulf-email-title" className="gulf-email-page">
      <header className="gulf-page-heading">
        <div><span className="gulf-eyebrow"><Icon name="mail" size={14} /> NATHEEL GULF</span><h1 id="gulf-email-title">Email Client</h1><p>Write it like a Gmail message, with To, Cc, Bcc, a subject and any attachments. Send one email to everyone, or a separate copy to each person.</p></div>
      </header>
      <div className="gulf-email-shell">
        <div className="gulf-email-sidebar" role="complementary">
          <div className="gulf-email-sender"><span><Icon name="user" size={16} /></span><div><small>Sending from</small><b>{sender}</b></div></div>
          <nav aria-label="Email client sections" className="gulf-email-tabs">
            <button aria-current={activeTab === 'compose' ? 'page' : undefined} className={activeTab === 'compose' ? 'active' : ''} onClick={() => setActiveTab('compose')} type="button"><Icon name="edit" size={16} /> Compose</button>
            <button aria-current={activeTab === 'contacts' ? 'page' : undefined} className={activeTab === 'contacts' ? 'active' : ''} onClick={() => setActiveTab('contacts')} type="button"><Icon name="users" size={16} /> Contacts ({contacts.length})</button>
            <button aria-current={activeTab === 'history' ? 'page' : undefined} className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')} type="button"><Icon name="clock" size={16} /> History</button>
          </nav>
        </div>
        <div className="gulf-email-content">
          {activeTab === 'compose' && (
            <div className="gulf-email-compose">
              <div className="gulf-email-compose-heading"><div><h2>New message</h2><p>Compose and review your email before sending.</p></div><span className="gulf-email-badge"><Icon name="mail" size={14} /> Gmail-style compose</span></div>
              <label className="gulf-email-field"><span>To</span><textarea onChange={(event) => setTo(event.target.value)} placeholder="type or paste addresses" rows={2} value={to} /><small>Separate with commas, semicolons or new lines. You can also write Name &lt;email&gt;. One address or hundreds.</small></label>
              <div className="gulf-email-recipient-row">
                <label className="gulf-email-field"><span>Cc <small>(optional)</small></span><textarea onChange={(event) => setCc(event.target.value)} placeholder="Add carbon copy recipients" rows={2} value={cc} /></label>
                <label className="gulf-email-field"><span>Bcc <small>(optional, hidden from everyone)</small></span><textarea onChange={(event) => setBcc(event.target.value)} placeholder="Add blind carbon copy recipients" rows={2} value={bcc} /></label>
              </div>
              <label className="gulf-email-one-copy"><input checked={oneEmail} onChange={(event) => setOneEmail(event.target.checked)} type="checkbox" /><span><b>Send as one email to everyone in To</b> (they all see each other, like a normal Gmail message). Leave this off to send each person their own separate email.</span></label>
              <div aria-live="polite" className="gulf-email-recipient-count"><b>{recipientCount}</b> {recipientCount === 1 ? 'recipient' : 'recipients'}</div>
              <label className="gulf-email-field"><span>Subject</span><input onChange={(event) => setSubject(event.target.value)} placeholder="Add a subject" value={subject} /></label>
              <label className="gulf-email-field"><span>Message</span><textarea className="gulf-email-message" onChange={(event) => setMessage(event.target.value)} placeholder={'Write your message here. Use {{name}} to insert each person’s name (or “there” if we have no name).'} rows={8} value={message} /><small>Write {'{{name}}'} to insert each person's name (or "there" if we have no name).</small></label>
              <label className="gulf-email-field"><span>Footer <small>(optional, added under the message)</small></span><textarea onChange={(event) => setFooter(event.target.value)} placeholder="Your signature or footer" rows={2} value={footer} /></label>
              <section className="gulf-email-attachments">
                <div className="gulf-email-attachments-heading"><div><h3><Icon name="paperclip" size={16} /> Attachments</h3><p>Any file type: PDF, video, images, Word, Excel, zip</p></div><b>{formatAttachmentSize(totalAttachmentSize)} / 18.0 MB</b></div>
                <div className="gulf-email-attachment-actions">
                  <Button onClick={() => setShowDataBank((current) => !current)}><Icon name="folder" size={15} /> Add from the Data Bank</Button>
                  <Button onClick={() => deviceInput.current?.click()}><Icon name="upload" size={15} /> Add from this device</Button>
                  <input aria-label="Add attachments from this device" className="gulf-upload-input" multiple onChange={(event) => { updateDeviceFiles(event.target.files || []); event.target.value = '' }} ref={deviceInput} type="file" />
                </div>
                {showDataBank && (
                  <div className="gulf-email-databank">
                    <b>Select Data Bank files</b>
                    {assets.map((asset) => {
                      const project = nodes.find((node) => node.id === asset.node)?.name || 'Unfiled files'
                      return <label key={asset.id}><input checked={selectedDataBank.includes(asset.id)} onChange={(event) => {
                        const next = event.target.checked ? [...selectedDataBank, asset.id] : selectedDataBank.filter((id) => id !== asset.id)
                        const nextSize = next.reduce((sum, id) => {
                          const record = assets.find((item) => item.id === id)
                          const match = record?.size.match(/^([\d.]+)\s*(KB|MB)$/i)
                          return sum + (match ? Number(match[1]) * (match[2].toUpperCase() === 'MB' ? 1 : 1 / 1024) : 0)
                        }, deviceSize)
                        if (nextSize > 18) { onToast('Attachments must be 18 MB or less in total.'); return }
                        setSelectedDataBank(next)
                      }} type="checkbox" /><span><b>{asset.name}</b><small>{project} · {asset.size}</small></span></label>
                    })}
                    {!assets.length && <p>No Data Bank files are available.</p>}
                  </div>
                )}
                {(selectedDataBank.length > 0 || deviceFiles.length > 0) && (
                  <ul className="gulf-email-attachment-list">
                    {selectedDataBank.map((id) => {
                      const asset = assets.find((item) => item.id === id)
                      return asset ? <li key={id}><Icon name="file-text" size={16} /><span>{asset.name}</span><b>{asset.size}</b><button aria-label={`Remove ${asset.name}`} onClick={() => setSelectedDataBank((current) => current.filter((item) => item !== id))} type="button"><Icon name="close" size={14} /></button></li> : null
                    })}
                    {deviceFiles.map((file, index) => <li key={`${file.name}-${file.lastModified}-${index}`}><Icon name="file-text" size={16} /><span>{file.name}</span><b>{formatAttachmentSize(file.size / (1024 * 1024))}</b><button aria-label={`Remove ${file.name}`} onClick={() => setDeviceFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} type="button"><Icon name="close" size={14} /></button></li>)}
                  </ul>
                )}
                <p className="gulf-email-limit">Limit 18.0 MB in total (Gmail allows about 25 MB per email). For larger files such as long videos, share a Drive link in the message instead.</p>
              </section>
              <div className="gulf-email-send-actions"><Button disabled={!recipientCount} onClick={() => openDraft(true)}><Icon name="send" size={15} /> Send a test first <span>Send test</span></Button><Button className="p" disabled={!recipientCount} onClick={() => setReviewOpen(true)}>Review and send <Icon name="arrow-right" size={15} /></Button></div>
              <p className="gulf-email-preview-note"><Icon name="info" size={14} /> Email delivery is not connected in this preview. Review opens one draft in your default mail app; send separate copies and add selected attachments there manually.</p>
            </div>
          )}
          {activeTab === 'contacts' && (
            <div className="gulf-email-compose">
              <div className="gulf-email-compose-heading"><div><h2>Contacts</h2><p>Save recipients for quick access when composing a message.</p></div><span className="gulf-email-badge">{contacts.length} saved</span></div>
              <form className="gulf-email-contact-form" onSubmit={addContact}>
                <label className="gulf-email-field"><span>Name</span><input onChange={(event) => setContactName(event.target.value)} placeholder="Contact name" value={contactName} /></label>
                <label className="gulf-email-field"><span>Email</span><input onChange={(event) => setContactEmail(event.target.value)} placeholder="name@example.com" type="email" value={contactEmail} /></label>
                <Button className="p" type="submit"><Icon name="user-plus" size={15} /> Add contact</Button>
              </form>
              {contacts.length ? <ul className="gulf-email-contact-list">{contacts.map((contact) => <li key={contact.email}><span><b>{contact.name}</b><small>{contact.email}</small></span><Button onClick={() => addContactToRecipients(contact)}>Add to To</Button></li>)}</ul> : <div className="gulf-email-empty"><Icon name="users" size={24} /><b>No saved contacts yet.</b><span>Add them on the Contacts tab.</span></div>}
            </div>
          )}
          {activeTab === 'history' && <div className="gulf-email-empty gulf-email-history"><Icon name="clock" size={25} /><h2>History</h2><p>Email drafts opened from this preview are handled by your mail app and aren’t recorded here.</p></div>}
        </div>
      </div>
      {reviewOpen && (
        <div className="react-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setReviewOpen(false)}>
          <section aria-labelledby="gulf-email-review-title" aria-modal="true" className="mdl gulf-email-review" role="dialog">
            <header><div><span className="gulf-eyebrow">MESSAGE REVIEW</span><h2 id="gulf-email-review-title">Review and send</h2></div><button aria-label="Close review" className="btn-icon-close" onClick={() => setReviewOpen(false)} type="button"><Icon name="close" size={17} /></button></header>
            <dl><dt>From</dt><dd>{sender}</dd><dt>To</dt><dd>{to || '—'}</dd>{cc && <><dt>Cc</dt><dd>{cc}</dd></>}{bcc && <><dt>Bcc</dt><dd>{bcc}</dd></>}<dt>Subject</dt><dd>{subject || '(no subject)'}</dd><dt>Recipients</dt><dd>{recipientCount}</dd><dt>Attachments</dt><dd>{selectedDataBank.length + deviceFiles.length} · {formatAttachmentSize(totalAttachmentSize)}</dd></dl>
            <div className="gulf-email-review-message">{message || 'No message content.'}{footer && <p>{footer}</p>}</div>
            <footer><Button onClick={() => setReviewOpen(false)}>Back to compose</Button><Button className="p" onClick={() => { setReviewOpen(false); openDraft() }}><Icon name="send" size={15} /> Open email draft</Button></footer>
          </section>
        </div>
      )}
    </section>
  )
}

export function GulfAssetPage({ nodes, setNodes, assets, setAssets, selectedNode, setSelectedNode, activeSection, setActiveSection, onLock, onToast, config }) {
  const [query, setQuery] = useState('')
  const [pendingFiles, setPendingFiles] = useState([])
  const [uploadLabel, setUploadLabel] = useState('Internal')
  const [uploadTags, setUploadTags] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)
  const uploadInput = useRef(null)
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const getDescendantIds = (nodeId) => {
    const children = nodes.filter((node) => node.parent === nodeId)
    return [nodeId, ...children.flatMap((child) => getDescendantIds(child.id))]
  }
  const scopedNodeIds = new Set(getDescendantIds(selectedNode))
  const visibleAssets = assets.filter((asset) =>
    scopedNodeIds.has(asset.node) &&
    (!query || `${asset.name} ${asset.description} ${nodeById.get(asset.node)?.name || ''}`.toLowerCase().includes(query.toLowerCase()))
  )
  useEffect(() => setQuery(''), [selectedNode])
  const selected = nodeById.get(selectedNode) || nodes[0]
  const isRoot = selectedNode === 'natheel-gulf'
  const sizeLabel = (size) => size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`
  const getNodePath = (node) => {
    const parts = []
    let current = node
    while (current) {
      parts.unshift(current.name)
      current = nodeById.get(current.parent)
    }
    return parts.join(' › ')
  }
  const addPendingFiles = (fileList) => {
    const validFiles = []
    const oversizedNames = []
    for (const file of fileList) {
      if (file.size > 100 * 1024 * 1024) oversizedNames.push(file.name)
      else validFiles.push(file)
    }
    if (oversizedNames.length) {
      onToast(`${oversizedNames.join(', ')} ${oversizedNames.length === 1 ? 'exceeds' : 'exceed'} the 100 MB per-file limit.`)
    }
    if (validFiles.length) setPendingFiles((current) => [...current, ...validFiles])
  }
  const addProject = (parent) => {
    const name = window.prompt(parent ? 'New sub-project name' : 'New core project name')
    if (!name?.trim()) return
    const id = `gulf-${Date.now()}`
    setNodes((current) => [...current, { id, name: name.trim(), parent, color: '#0f766e' }])
    setSelectedNode(id)
    onToast(`${name.trim()} added to the asset structure.`)
  }
  const uploadFiles = () => {
    const records = pendingFiles.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      name: file.name,
      description: uploadDescription.trim() || file.type || 'Uploaded asset',
      node: selectedNode,
      security: uploadLabel,
      size: sizeLabel(file.size),
      uploadedBy: 'Current session',
      added: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
      type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
      tags: uploadTags.split(',').map((tag) => tag.trim()).filter(Boolean),
    }))
    if (records.length) {
      setAssets((current) => [...records, ...current])
      setPendingFiles([])
      setUploadTags('')
      setUploadDescription('')
      onToast(`${records.length} file${records.length === 1 ? '' : 's'} added to this browser session.`)
    }
  }
  return (
    <div className="gulf-asset-page">
      <header className="gulf-brand-bar">
        <div className="gulf-brand">
          <img alt="" onError={(event) => { event.currentTarget.hidden = true }} src="/img/logo.png" />
          <div><b lang="ar" dir="rtl">مؤسسة نثيل الخليج للخدمات التجارية</b><span>Natheel Gulf Commercial Services</span></div>
        </div>
        <div className="gulf-brand-actions">
          <span className="gulf-user"><Icon name="user" size={15} /> bilel</span>
          <span className="gulf-protected"><Icon name="lock" size={14} /> Protected</span>
          <Button className="gulf-lock-btn" onClick={onLock}><Icon name="lock" size={14} /> Lock</Button>
        </div>
      </header>
      <nav aria-label="Asset workspace navigation" className="gulf-workspace-nav">
        <button aria-current={activeSection === 'overview' ? 'page' : undefined} className={activeSection === 'overview' ? 'active' : ''} onClick={() => setActiveSection('overview')} type="button"><Icon name="dashboard" size={15} /> Core Hub</button>
        <button aria-current={activeSection === 'files' ? 'page' : undefined} className={activeSection === 'files' ? 'active' : ''} onClick={() => setActiveSection('files')} type="button"><Icon name="folder" size={15} /> Matrix Hierarchy &amp; Files</button>
        <button aria-current={activeSection === 'ingestion' ? 'page' : undefined} className={activeSection === 'ingestion' ? 'active' : ''} onClick={() => setActiveSection('ingestion')} type="button"><Icon name="upload" size={15} /> Asset Ingestion</button>
        <button aria-current={activeSection === 'email' ? 'page' : undefined} className={activeSection === 'email' ? 'active' : ''} onClick={() => setActiveSection('email')} type="button"><Icon name="mail" size={15} /> Email Client</button>
      </nav>
      <input aria-label="Choose files to upload" className="gulf-upload-input" multiple onChange={(event) => { addPendingFiles(event.target.files || []); event.target.value = '' }} ref={uploadInput} type="file" />
      {activeSection === 'overview' ? <GulfCoreHubOverview assets={assets} nodes={nodes} onOpenAssets={() => setActiveSection('files')} /> : activeSection === 'ingestion' ? (
        <section aria-labelledby="gulf-upload-title" className="gulf-ingestion">
          <header className="gulf-page-heading">
            <div><span className="gulf-eyebrow"><Icon name="upload" size={14} /> ASSET INGESTION</span><h1 id="gulf-upload-title">Upload</h1><p>Any file type. Files open in a new tab or can be saved back to your computer.</p></div>
          </header>
          <div className="gulf-ingestion-card">
            <div className="gulf-ingestion-fields">
              <label className="gulf-ingestion-field">
                <span>Project</span>
                <select onChange={(event) => setSelectedNode(event.target.value)} value={selectedNode}>
                  {nodes.filter((node) => node.id !== 'unfiled').map((node) => <option key={node.id} value={node.id}>{getNodePath(node)}</option>)}
                  <option value="unfiled">No project (unfiled)</option>
                </select>
              </label>
              <fieldset className="gulf-ingestion-field gulf-label-field">
                <legend>Label</legend>
                <div className="gulf-label-options">
                  {['Internal', 'Confidential', 'Restricted'].map((label) => (
                    <button aria-pressed={uploadLabel === label} className={`gulf-label-option${uploadLabel === label ? ' selected' : ''}`} key={label} onClick={() => setUploadLabel(label)} type="button">{label}</button>
                  ))}
                </div>
              </fieldset>
              <label className="gulf-ingestion-field">
                <span>Tags, comma separated</span>
                <input onChange={(event) => setUploadTags(event.target.value)} placeholder="e.g. invoice, 2026, finance" value={uploadTags} />
              </label>
              <label className="gulf-ingestion-field">
                <span>Description for this batch</span>
                <textarea onChange={(event) => setUploadDescription(event.target.value)} placeholder="Add a description shared by these files" rows={3} value={uploadDescription} />
              </label>
            </div>
            <div
              className={`gulf-dropzone${isDraggingFiles ? ' dragging' : ''}`}
              onDragEnter={(event) => { event.preventDefault(); setIsDraggingFiles(true) }}
              onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsDraggingFiles(false) }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); setIsDraggingFiles(false); addPendingFiles(event.dataTransfer.files) }}
              onClick={() => uploadInput.current?.click()}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); uploadInput.current?.click() } }}
              role="button"
              tabIndex={0}
            >
              <span className="gulf-dropzone-icon"><Icon name="upload" size={23} /></span>
              <strong>Drop files here or click to choose</strong>
              <span>Any file type, up to 100 MB each</span>
            </div>
            {pendingFiles.length > 0 && (
              <ul aria-label="Files selected for upload" className="gulf-pending-files">
                {pendingFiles.map((file, index) => (
                  <li key={`${file.name}-${file.size}-${file.lastModified}-${index}`}>
                    <Icon name="file-text" size={17} />
                    <span><b title={file.name}>{file.name}</b><small>{sizeLabel(file.size)}</small></span>
                    <button aria-label={`Remove ${file.name}`} className="btn-icon-close" onClick={() => setPendingFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} type="button"><Icon name="close" size={15} /></button>
                  </li>
                ))}
              </ul>
            )}
            <div className="gulf-ingestion-actions">
              <Button className="p" disabled={!pendingFiles.length} onClick={uploadFiles}><Icon name="upload" size={15} /> Upload</Button>
              <Button disabled={!pendingFiles.length && !uploadTags && !uploadDescription} onClick={() => { setPendingFiles([]); setUploadTags(''); setUploadDescription('') }}>Clear list</Button>
            </div>
            <p className="gulf-ingestion-note"><Icon name="lock" size={14} /> Files and details are kept in this browser session only; file contents are not uploaded to secure storage.</p>
          </div>
        </section>
        ) : activeSection === 'email' ? <EmailClientPage assets={assets} config={config} nodes={nodes} onToast={onToast} /> : <>
      <header className="gulf-page-heading">
        <div><span className="gulf-eyebrow"><Icon name="folder" size={14} /> ENTERPRISE WORKSPACE</span><h1>Enterprise Asset Architecture</h1><p>Structure for core operations, child projects and the files filed under each.</p></div>
        <div className="gulf-heading-actions">
          <Button onClick={() => setActiveSection('ingestion')}><Icon name="upload" size={15} /> Upload files</Button>
          <Button onClick={() => addProject('natheel-gulf')}><Icon name="plus" size={15} /> New Core Project</Button>
          <Button disabled={selectedNode === 'unfiled'} onClick={() => addProject(selectedNode)}><Icon name="plus" size={15} /> New Sub-Project</Button>
        </div>
      </header>
      <div className="gulf-layout">
        <section className="gulf-assets-panel card">
          <div className="gulf-assets-heading">
            <div><span className="gulf-eyebrow">ASSET REGISTER</span><h2>{selected?.name || 'Natheel Gulf'}</h2><p>{visibleAssets.length} file{visibleAssets.length === 1 ? '' : 's'}{query ? ' matching your search' : ' in this structure'}</p></div>
            <label className="gulf-search"><Icon name="search" size={16} /><input aria-label="Search assets" onChange={(event) => setQuery(event.target.value)} placeholder="Search files or descriptions" value={query} /></label>
          </div>
          <div className="gulf-active-filter"><span>Active filter: <b>{selected?.name || 'Natheel Gulf'}{isRoot ? ' (All)' : ''}</b></span><Button className="gulf-clear-btn" onClick={() => { setSelectedNode('natheel-gulf'); setQuery('') }}>Clear</Button></div>
          <div className="gulf-asset-table" role="table" aria-label="Enterprise assets">
            <div className="gulf-asset-columns" role="row">
              {['Data asset structure', 'Assigned path node', 'Security', 'Size', 'Uploaded by', 'Ecosystem action'].map((label) => <span key={label} role="columnheader">{label}</span>)}
            </div>
            {visibleAssets.map((asset) => (
              <article className="gulf-asset-row" key={asset.id} role="row">
                <div className="gulf-asset-name" data-label="Data asset structure" role="cell"><span className={`gulf-file-type ${asset.type === 'PDF' ? 'pdf' : 'sheet'}`}><Icon name="file-text" size={18} /></span><span><b dir="auto" title={asset.name}>{asset.name}</b><small dir="auto">{asset.description || asset.type}</small>{asset.added && <small className="gulf-asset-uploaded">Uploaded {asset.added}</small>}</span></div>
                <span className="gulf-path-cell" data-label="Assigned path node" role="cell"><Icon name="folder" size={14} /> {nodeById.get(asset.node)?.name || 'Unfiled files'}</span>
                <span data-label="Security" role="cell"><span className="gulf-security"><Icon name="lock" size={12} /> {asset.security}</span></span>
                <span className="gulf-data-cell" data-label="Size" role="cell">{asset.size}</span>
                <span className="gulf-data-cell" data-label="Uploaded by" role="cell">{asset.uploadedBy}</span>
                <span className="gulf-action-cell" data-label="Ecosystem action" role="cell"><a href={`mailto:?subject=${encodeURIComponent(`Asset reference: ${asset.name}`)}&body=${encodeURIComponent(`Please attach or reference this asset: ${asset.name}`)}`}><Icon name="mail" size={13} /> Attach to Mail</a></span>
              </article>
            ))}
            {!visibleAssets.length && <div className="gulf-empty" role="row"><span role="cell"><Icon name={query ? 'search' : 'folder'} size={22} /><b>{query ? 'No matching assets' : 'No assets in this project yet'}</b><span>{query ? 'Try another search.' : 'Files added to this project will appear here.'}</span></span></div>}
          </div>
          <footer className="gulf-footnote"><Icon name="lock" size={14} /> Security labels do not restrict access in this preview. Example records are based on your screenshot; uploads and project edits stay in this browser session (file contents are not uploaded). Email links open a draft; attach files manually.</footer>
        </section>
      </div>
      </>}
    </div>
  )
}
