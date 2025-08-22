// dataService.js - Servicio para manejar datos solo desde la API (sin datos locales)

class DataService {
  constructor() {
    this.apiUrl = '/api/products';
    this.cache = null;
    this.cacheTime = null;
    this.cacheDuration = 5 * 60 * 1000; // 5 minutos
  }

  // Verificar si el cache es válido
  isCacheValid() {
    return this.cache && this.cacheTime &&
           (Date.now() - this.cacheTime) < this.cacheDuration;
  }

  // Obtener todos los productos desde la DB
  async getAllProducts() {
    if (this.isCacheValid()) {
      console.log('Usando productos del cache');
      return this.cache;
    }

    try {
      console.log('Obteniendo productos de la base de datos...');
      const response = await fetch(this.apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const productsFromDB = await response.json();
      console.log(`Productos obtenidos de la DB: ${productsFromDB.length}`);

      // Guardar en cache
      this.cache = productsFromDB;
      this.cacheTime = Date.now();

      return productsFromDB;
    } catch (error) {
      console.error('Error al obtener productos de la API:', error);
      throw error; // Ya no usamos fallback local
    }
  }

  // Actualizar stock de un producto
  async updateProductStock(productId, inStock) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: productId, inStock })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Limpiar cache para forzar actualización
      this.cache = null;

      const updatedProduct = await response.json();
      return updatedProduct;
    } catch (error) {
      console.error('Error al actualizar stock:', error);
      throw error;
    }
  }

  // Obtener un producto específico
  async getProduct(productId) {
    try {
      const response = await fetch(`${this.apiUrl}?id=${productId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const dbProduct = await response.json();
      return dbProduct;
    } catch (error) {
      console.warn('Error al obtener producto de la API:', error);
      throw error;
    }
  }

  // Buscar productos por nombre o categoría
  async searchProducts(searchTerm) {
    const products = await this.getAllProducts();
    const lowercasedTerm = searchTerm.toLowerCase();

    return products.filter(product =>
      product.name.toLowerCase().includes(lowercasedTerm) ||
      product.category.toLowerCase().includes(lowercasedTerm)
    );
  }

  // Obtener productos por categoría
  async getProductsByCategory(category) {
    const products = await this.getAllProducts();

    if (category === 'Todos') {
      return products;
    }

    return products.filter(product => product.category === category);
  }

  // Invalidar cache manualmente
  invalidateCache() {
    console.log('Cache invalidado - se cargarán datos frescos en la próxima petición');
    this.cache = null;
    this.cacheTime = null;
  }

  // Obtener estadísticas de productos
  async getProductStats() {
    const products = await this.getAllProducts();

    const stats = {
      total: products.length,
      inStock: products.filter(p => p.in_stock).length,
      outOfStock: products.filter(p => !p.in_stock).length,
      byCategory: {}
    };

    // Contar por categoría
    products.forEach(product => {
      if (!stats.byCategory[product.category]) {
        stats.byCategory[product.category] = 0;
      }
      stats.byCategory[product.category]++;
    });

    return stats;
  }
}

const dataService = new DataService();
export default dataService;
