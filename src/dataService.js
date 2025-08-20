// dataService.js - Servicio para manejar datos locales y de la API Neon PostgreSQL
import localBagsData from './data';

class DataService {
  constructor() {
    this.apiUrl = process.env.NODE_ENV === 'production' 
      ? '/api/products' 
      : '/api/products';
    this.fallbackData = localBagsData;
    this.cache = null;
    this.cacheTime = null;
    this.cacheDuration = 5 * 60 * 1000; // 5 minutos
  }

  // Verificar si el cache es válido
  isCacheValid() {
    return this.cache && this.cacheTime && 
           (Date.now() - this.cacheTime) < this.cacheDuration;
  }

  // Obtener todos los productos
  async getAllProducts() {
    // Si hay cache válido, usar cache
    if (this.isCacheValid()) {
      return this.cache;
    }

    try {
      const response = await fetch(this.apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const productsFromDB = await response.json();
      
      // Combinar datos de la DB con datos locales (imágenes y otros datos estáticos)
      const combinedProducts = this.combineProductData(productsFromDB);
      
      // Actualizar cache
      this.cache = combinedProducts;
      this.cacheTime = Date.now();
      
      return combinedProducts;
      
    } catch (error) {
      console.warn('Error al obtener productos de la API, usando datos locales:', error);
      
      // Si falla la API, usar datos locales
      return this.fallbackData;
    }
  }

  // Combinar datos de la base de datos PostgreSQL con datos locales
  combineProductData(dbProducts) {
    return this.fallbackData.map(localProduct => {
      // Buscar el producto correspondiente en la DB
      const dbProduct = dbProducts.find(p => p.id === localProduct.id);
      
      if (dbProduct) {
        // Combinar datos: usar stock de DB, resto de datos locales
        // Convertir nombres de campos de PostgreSQL (snake_case) a camelCase
        return {
          ...localProduct,
          inStock: dbProduct.in_stock,
          // Si hay otros campos en la DB, también los usamos
          ...(dbProduct.price && { price: dbProduct.price }),
          ...(dbProduct.name && { name: dbProduct.name }),
          // Las imágenes vienen de la DB como images_url, pero preferimos las locales
          // para mantener las referencias de importación de React
        };
      }
      
      // Si no está en la DB, usar datos locales
      return localProduct;
    });
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

  // Sincronizar datos locales con la base de datos
  async syncLocalDataToDB() {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products: this.fallbackData })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Datos sincronizados correctamente:', result);
      
      // Limpiar cache
      this.cache = null;
      
      return result;
      
    } catch (error) {
      console.error('Error al sincronizar datos:', error);
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
      const localProduct = this.fallbackData.find(p => p.id === productId);
      
      if (localProduct && dbProduct) {
        return {
          ...localProduct,
          inStock: dbProduct.in_stock // Convertir de snake_case a camelCase
        };
      }
      
      return dbProduct || localProduct;
      
    } catch (error) {
      console.warn('Error al obtener producto de la API:', error);
      return this.fallbackData.find(p => p.id === productId);
    }
  }

  // Invalidar cache manualmente
  invalidateCache() {
    this.cache = null;
    this.cacheTime = null;
  }
}

// Exportar instancia singleton
const dataService = new DataService();
export default dataService;