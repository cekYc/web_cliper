// API Base URL - Production'da değişir
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://web-clipper-api.onrender.com'

export const api = {
  // Auth
  login: (data) => fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),

  register: (data) => fetch(`${API_BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),

  // Snippets
  getSnippets: (token) => fetch(`${API_BASE_URL}/api/snippets`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }),

  saveSnippet: (token, data) => fetch(`${API_BASE_URL}/api/save`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  }),

  deleteSnippet: (token, id) => fetch(`${API_BASE_URL}/api/snippets/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  }),

  updateSnippetCategory: (token, id, categoryId) => fetch(`${API_BASE_URL}/api/snippets/${id}/category`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ categoryId })
  }),

  // Categories
  getCategories: (token) => fetch(`${API_BASE_URL}/api/categories`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }),

  createCategory: (token, data) => fetch(`${API_BASE_URL}/api/categories`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  }),

  updateCategory: (token, id, data) => fetch(`${API_BASE_URL}/api/categories/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  }),

  deleteCategory: (token, id) => fetch(`${API_BASE_URL}/api/categories/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
}

export const API_URL = API_BASE_URL
export default api
