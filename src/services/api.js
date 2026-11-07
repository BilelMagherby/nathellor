import { upload } from '@vercel/blob/client'

export async function request(path, init) {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  const response = await fetch(`${base}${path}`, { cache: 'no-store', ...init })
  const body = await response.json().catch(() => ({}))
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('taskflow:locked'))
    throw new Error('Your session expired. Unlock the dashboard and try again.')
  }
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`)
  return body
}

export const api = {
  list: (collection) => request(`/api/docs?collection=${encodeURIComponent(collection)}`),
  get: (path) => request(`/api/docs?path=${encodeURIComponent(path)}`),
  put: (path, data) =>
    request('/api/docs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path, data }) }),
  patch: (path, data) =>
    request('/api/docs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, data }),
    }),
  remove: (path) => request(`/api/docs?path=${encodeURIComponent(path)}`, { method: 'DELETE' }),
  uploadFile: async (file, scope) => {
    if (import.meta.env.VITE_VERCEL_BLOB_UPLOADS) {
      const id = Array.from(globalThis.crypto.getRandomValues(new Uint8Array(18)))
        .map((value) => value.toString(16).padStart(2, '0'))
        .join('')
      await upload(id, file, {
        access: 'private',
        contentType: file.type || 'application/octet-stream',
        handleUploadUrl: `/api/files?scope=${encodeURIComponent(scope)}`,
        clientPayload: JSON.stringify({ id, name: file.name, scope }),
        multipart: file.size > 5 * 1024 * 1024,
      })
      return { id, url: `/api/files/${encodeURIComponent(id)}`, name: file.name, size: file.size }
    }
    const formData = new FormData()
    formData.append('file', file)
    return request(`/api/files?scope=${encodeURIComponent(scope)}`, { method: 'POST', body: formData })
  },
  fileUrl: (id) =>
    `${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')}/api/files/${encodeURIComponent(id)}`,
  downloadFile: async (id) => {
    const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    const response = await fetch(`${base}/api/files/${encodeURIComponent(id)}`, { cache: 'no-store' })
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('taskflow:locked'))
      throw new Error('Your session expired. Unlock the dashboard and try again.')
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body.error || `Request failed (${response.status})`)
    }
    return response.blob()
  },
  deleteFile: (id) => request(`/api/files/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
