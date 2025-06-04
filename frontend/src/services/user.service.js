// frontend/src/services/user.service.js
import api from './api'

class UserService {
  async getAllUsers() {
    const response = await api.get('/users')
    // Asegurarnos de que el estado activo sea booleano
    return {
      ...response,
      data: response.data.map(user => ({
        ...user,
        activo: Boolean(user.activo)
      }))
    }
  }
  
  async getUserById(id) {
    const response = await api.get(`/users/${id}`)
    return {
      ...response,
      data: {
        ...response.data,
        activo: Boolean(response.data.activo)
      }
    }
  }
  
  async createUser(userData) {
    // Asegurarnos de que el estado activo sea booleano
    const data = {
      ...userData,
      activo: Boolean(userData.activo)
    }
    return api.post('/users', data)
  }
  
  async updateUser(id, userData) {
    // Asegurarnos de que el estado activo sea booleano
    const data = {
      ...userData,
      activo: Boolean(userData.activo)
    }
    return api.put(`/users/${id}`, data)
  }

  async deleteUser(id) {
    return api.delete(`/users/${id}`)
  }
}

export default new UserService()
