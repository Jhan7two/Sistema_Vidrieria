// frontend/src/services/auth.service.js
import api from './api'

class AuthService {
  async login(credentials) {
    return api.post('/auth/login', credentials)
  }
  
  async logout() {
    return api.get('/auth/logout')
  }
  
  async getCurrentUser() {
    return api.get('/auth/me')
  }
  
  async changePassword(passwordData) {
    return api.post('/users/change-password', passwordData)
  }
}

export default new AuthService()
