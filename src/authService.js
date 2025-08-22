// authService.js - Servicio de autenticación corregido y completo

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // En producción usa la misma URL (URLs relativas)
  : '';  // En desarrollo también usa URLs relativas

class AuthService {
  constructor() {
    this.token = this.getToken();
    this.user = this.getUser();
  }

  // Obtener token del localStorage
  getToken() {
    try {
      return localStorage.getItem('authToken');
    } catch (error) {
      console.warn('Error accediendo a localStorage:', error);
      return null;
    }
  }

  // Obtener usuario del localStorage
  getUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.warn('Error parseando usuario:', error);
      return null;
    }
  }

  // Verificar si está autenticado
  isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    return !!token && !!user && !this.isTokenExpired();
  }

  // Headers con autenticación
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = token;
      console.log('Token incluido en headers');
    }

    return headers;
  }

  // Login
  async login(username, password) {
    try {
      console.log('Intentando login...');
      
      const response = await fetch(`${API_BASE_URL}/api/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.token && data.user) {
        // Guardar en localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Actualizar instancia
        this.token = data.token;
        this.user = data.user;
        
        console.log('Login exitoso');
        return { success: true, user: data.user };
      } else {
        throw new Error('Respuesta de login inválida');
      }
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  // Logout
  logout() {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      this.token = null;
      this.user = null;
      console.log('Logout exitoso');
    } catch (error) {
      console.error('Error en logout:', error);
    }
  }

  // Verificar si el token ha expirado
  isTokenExpired() {
    const token = this.getToken();
    if (!token) return true;

    try {
      let tokenData = token;
      
      // Remover prefijos si existen
      if (token.startsWith('bearer_')) {
        tokenData = token.substring(7);
      } else if (token.startsWith('Bearer ')) {
        tokenData = token.substring(7);
      }
      
      const decoded = JSON.parse(atob(tokenData));
      
      if (decoded.exp && decoded.exp < Date.now()) {
        console.log('Token expirado');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error verificando expiración del token:', error);
      return true;
    }
  }

  // Verificar token con el servidor
  async verifyToken() {
    try {
      const token = this.getToken();
      if (!token) return false;

      const response = await fetch(`${API_BASE_URL}/api/test-auth`, {
        method: 'GET',
        headers: {
          'Authorization': token
        }
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.authenticated === true;
    } catch (error) {
      console.error('Error verificando token:', error);
      return false;
    }
  }

  // Realizar petición autenticada
  async authenticatedFetch(url, options = {}) {
    const currentToken = this.getToken();
    
    if (!currentToken) {
      console.error('No hay token disponible');
      throw new Error('No autorizado - Sin token');
    }

    if (this.isTokenExpired()) {
      this.logout();
      throw new Error('Sesión expirada');
    }

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': currentToken,
        ...options.headers,
      },
    };

    console.log('Realizando petición autenticada a:', url);

    const response = await fetch(url, config);

    if (response.status === 401) {
      console.log('Respuesta 401 - Token inválido o expirado');
      this.logout();
      throw new Error('Sesión expirada');
    }

    return response;
  }

  // ============================================
  // MÉTODOS PARA PRODUCTOS (ADMIN)
  // ============================================

  // Obtener productos (API protegida) - MÉTODO CORREGIDO
  async getProducts() {
    try {
      console.log('Obteniendo productos desde API protegida...');
      
      // CORRECCIÓN: Usar la URL correcta directamente
      const response = await this.authenticatedFetch(`${API_BASE_URL}/api/admin/products`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error respuesta:', errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const products = await response.json();
      console.log(`Productos obtenidos: ${products.length}`);
      return products;
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      throw error;
    }
  }

  // Crear producto
  async createProduct(productData) {
    try {
      console.log('Creando producto:', productData);
      
      const response = await this.authenticatedFetch(`${API_BASE_URL}/api/admin/products`, {
        method: 'POST',
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Producto creado:', result);
      return result;
    } catch (error) {
      console.error('Error creando producto:', error);
      throw error;
    }
  }

  // Actualizar producto
  async updateProduct(productData) {
    try {
      console.log('Actualizando producto:', productData);
      
      // Asegurarse de que el ID esté presente
      if (!productData.id) {
        throw new Error('ID del producto es requerido para actualizar');
      }
      
      const response = await this.authenticatedFetch(`${API_BASE_URL}/api/admin/products`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Producto actualizado:', result);
      return result;
    } catch (error) {
      console.error('Error actualizando producto:', error);
      throw error;
    }
  }

  // Eliminar producto
  async deleteProduct(productId) {
    try {
      console.log('Eliminando producto con ID:', productId);
      
      const response = await this.authenticatedFetch(`${API_BASE_URL}/api/admin/products?id=${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Producto eliminado:', result);
      return result;
    } catch (error) {
      console.error('Error eliminando producto:', error);
      throw error;
    }
  }

  // ============================================
  // MÉTODOS PARA PRODUCTOS PÚBLICOS
  // ============================================

  // Obtener productos públicos (sin autenticación)
  async getPublicProducts() {
    try {
      console.log('Obteniendo productos públicos...');
      
      const response = await fetch(`${API_BASE_URL}/api/products`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const products = await response.json();
      console.log(`Productos públicos obtenidos: ${products.length}`);
      return products;
    } catch (error) {
      console.error('Error obteniendo productos públicos:', error);
      throw error;
    }
  }

  // Actualizar stock público
  async updateProductStock(productId, inStock) {
    try {
      console.log('Actualizando stock:', { productId, inStock });
      
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: productId, inStock }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Stock actualizado:', result);
      return result;
    } catch (error) {
      console.error('Error actualizando stock:', error);
      throw error;
    }
  }

  // ============================================
  // MÉTODOS DE UTILIDAD
  // ============================================

  // Refrescar token desde localStorage (útil después de cambios)
  refreshTokenFromStorage() {
    this.token = this.getToken();
    this.user = this.getUser();
    console.log('Token refrescado desde localStorage');
  }

  // Obtener información del usuario actual
  getCurrentUser() {
    return this.user;
  }

  // Verificar si el usuario es admin
  isAdmin() {
    return this.user && this.user.role === 'admin';
  }
}

// Crear instancia singleton
const authService = new AuthService();

// Exportar la instancia
export default authService;