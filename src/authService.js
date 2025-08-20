// src/authService.js - Servicio para manejar autenticación
class AuthService {
  constructor() {
    this.apiUrl = '/api/auth';
    this.adminApiUrl = '/api/admin/products';
    this.token = localStorage.getItem('admin_token');
    this.user = null;
    
    // Verificar token al inicializar
    if (this.token) {
      const storedUser = localStorage.getItem('admin_user');
      if (storedUser) {
        this.user = JSON.parse(storedUser);
      }
    }
  }

  // Iniciar sesión
  async login(username, password) {
    try {
      console.log('Intentando login...', { username }); // Debug
      
      // Simulación para desarrollo local (mientras configuramos las APIs)
      if (process.env.NODE_ENV === 'development') {
        return this.loginDevelopment(username, password);
      }
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      console.log('Response status:', response.status); // Debug
      
      // Verificar si la respuesta es JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Response is not JSON:', text.substring(0, 200));
        throw new Error('El servidor no está respondiendo correctamente. Verifica que las APIs estén configuradas.');
      }

      const data = await response.json();
      console.log('Response data:', data); // Debug

      if (!response.ok) {
        throw new Error(data.error || 'Error de autenticación');
      }

      // Guardar token y usuario
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('admin_token', this.token);
      localStorage.setItem('admin_user', JSON.stringify(this.user));

      return { success: true, user: this.user };
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  // Login simulado para desarrollo
  loginDevelopment(username, password) {
    console.log('🔧 Usando login de desarrollo');
    
    // Credenciales de desarrollo
    if (username === 'admin' && password === 'admin123') {
      this.token = `dev-token-${Date.now()}`;
      this.user = { 
        id: 1, 
        username: 'admin', 
        email: 'admin@piuma.com',
        role: 'admin' 
      };
      localStorage.setItem('admin_token', this.token);
      localStorage.setItem('admin_user', JSON.stringify(this.user));
      
      console.log('✅ Login exitoso en modo desarrollo');
      return Promise.resolve({ success: true, user: this.user });
    }
    
    return Promise.reject(new Error('Credenciales inválidas'));
  }

  // Cerrar sesión
  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }

  // Verificar si está autenticado
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  // Obtener usuario actual
  getCurrentUser() {
    if (!this.user) {
      const storedUser = localStorage.getItem('admin_user');
      if (storedUser) {
        this.user = JSON.parse(storedUser);
      }
    }
    return this.user;
  }

  // Verificar token con el servidor
  async verifyToken() {
    if (!this.token) return false;

    // En desarrollo, siempre válido
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    try {
      const response = await fetch(`${this.apiUrl}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
        localStorage.setItem('admin_user', JSON.stringify(this.user));
        return true;
      } else {
        // Token inválido, limpiar
        this.logout();
        return false;
      }
    } catch (error) {
      console.error('Error verificando token:', error);
      this.logout();
      return false;
    }
  }

  // Obtener headers de autorización
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  // Métodos para gestión de productos (requieren autenticación)
  
  // Obtener todos los productos (vista admin)
  async getProducts() {
    if (!this.isAuthenticated()) {
      throw new Error('No autenticado');
    }

    // En desarrollo, usar la API pública
    if (process.env.NODE_ENV === 'development') {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          // Si no hay API, usar datos simulados
          return this.getProductsDevelopment();
        }
        return await response.json();
      } catch (error) {
        console.log('🔧 API no disponible, usando datos simulados');
        return this.getProductsDevelopment();
      }
    }

    try {
      const response = await fetch(this.adminApiUrl, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      throw error;
    }
  }

  // Datos simulados para desarrollo
  getProductsDevelopment() {
    return [
      { id: 1, name: "Eclipse", price: "$25.000", category: "Bandoleras", in_stock: true },
      { id: 2, name: "Estepa", price: "$28.000", category: "Bandoleras", in_stock: true },
      { id: 3, name: "Sabana", price: "$25.000", category: "Bandoleras", in_stock: false },
      { id: 5, name: "Amayra", price: "$45.000", category: "Carteras", in_stock: true }
    ];
  }

  // Crear nuevo producto
  async createProduct(productData) {
    if (!this.isAuthenticated()) {
      throw new Error('No autenticado');
    }

    // En desarrollo, simular éxito
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Simulando creación de producto:', productData);
      return Promise.resolve({ 
        message: 'Producto creado exitosamente (simulado)',
        product: { ...productData, id: Date.now() }
      });
    }

    try {
      const response = await fetch(this.adminApiUrl, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creando producto');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creando producto:', error);
      throw error;
    }
  }

  // Actualizar producto
  async updateProduct(productData) {
    if (!this.isAuthenticated()) {
      throw new Error('No autenticado');
    }

    // En desarrollo, simular éxito
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Simulando actualización de producto:', productData);
      return Promise.resolve({ 
        message: 'Producto actualizado exitosamente (simulado)',
        product: productData
      });
    }

    try {
      const response = await fetch(this.adminApiUrl, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error actualizando producto');
      }

      return await response.json();
    } catch (error) {
      console.error('Error actualizando producto:', error);
      throw error;
    }
  }

  // Eliminar producto
  async deleteProduct(productId) {
    if (!this.isAuthenticated()) {
      throw new Error('No autenticado');
    }

    // En desarrollo, simular éxito
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Simulando eliminación de producto:', productId);
      return Promise.resolve({ 
        message: 'Producto eliminado exitosamente (simulado)'
      });
    }

    try {
      const response = await fetch(`${this.adminApiUrl}?id=${productId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error eliminando producto');
      }

      return await response.json();
    } catch (error) {
      console.error('Error eliminando producto:', error);
      throw error;
    }
  }

  // Subir imagen (placeholder - implementar según tu servicio de imágenes)
  async uploadImage(file) {
    // Este método debería integrarse con tu servicio de almacenamiento de imágenes
    // Por ahora, simula una URL
    return new Promise((resolve) => {
      setTimeout(() => {
        const fakeUrl = URL.createObjectURL(file);
        resolve(fakeUrl);
      }, 1000);
    });
  }
}

// Exportar instancia singleton
const authService = new AuthService();
export default authService;