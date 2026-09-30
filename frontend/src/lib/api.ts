const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'https://ai-cohost-api.onrender.com'
).replace(/\/$/, '')

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, init)
}
