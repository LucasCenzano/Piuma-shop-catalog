// dataService.js - Servicio para manejar datos de la API y locales
import localBagsData from './data';

class DataService {
  constructor() {
    this.apiUrl = '/api/products';
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
      console.log(`Productos de la DB: ${productsFromDB.length}`);
      
      // IMPORTANTE: Ahora usamos TODOS los productos de la DB
      // y complementamos con datos locales si existen
      const combinedProducts = this.combineAllProducts(productsFromDB);
      
      // Actualizar cache
      this.cache = combinedProducts;
      this.cacheTime = Date.now();
      
      console.log(`Total de productos combinados: ${combinedProducts.length}`);
      return combinedProducts;
      
    } catch (error) {
      console.warn('Error al obtener productos de la API, usando datos locales:', error);
      
      // Si falla la API, usar datos locales
      return this.fallbackData;
    }
  }

  // Combinar TODOS los productos de la DB con datos locales si existen
  combineAllProducts(dbProducts) {
    // Crear un mapa de productos locales por nombre para búsqueda rápida
    const localProductsMap = new Map();
    this.fallbackData.forEach(product => {
      localProductsMap.set(product.name.toLowerCase(), product);
    });

    // Procesar TODOS los productos de la base de datos
    const combinedProducts = dbProducts.map(dbProduct => {
      // Buscar si existe un producto local con el mismo nombre
      const localProduct = localProductsMap.get(dbProduct.name.toLowerCase());
      
      if (localProduct) {
        // Si existe localmente, combinar datos
        // Usar datos de la DB para stock y precio, pero mantener imágenes locales si existen
        return {
          ...localProduct, // Datos locales (incluye imágenes importadas)
          id: dbProduct.id,
          name: dbProduct.name, // Nombre de la DB
          price: dbProduct.price || localProduct.price,
          category: dbProduct.category || localProduct.category,
          inStock: dbProduct.in_stock, // Stock siempre de la DB
          // Si hay URLs de imágenes en la DB, usarlas; si no, usar las locales
          imagesUrl: (dbProduct.images_url && dbProduct.images_url.length > 0) 
            ? dbProduct.images_url 
            : localProduct.imagesUrl,
          // Para las imágenes del componente React (imports)
          images: localProduct.images || []
        };
      } else {
        // Si NO existe localmente (producto nuevo), crear desde la DB
        return {
          id: dbProduct.id,
          name: dbProduct.name,
          price: dbProduct.price || '',
          category: dbProduct.category,
          inStock: dbProduct.in_stock,
          // Usar las URLs de imágenes de la DB si existen
          imagesUrl: dbProduct.images_url || [],
          // No hay imágenes importadas para productos nuevos
          images: [],
          // Marcar como producto nuevo (opcional, para debugging)
          isNew: true
        };
      }
    });

    // Ordenar productos: primero por categoría, luego por nombre
    combinedProducts.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    return combinedProducts;
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

  // Sincronizar datos locales con la base de datos (opcional)
  async syncLocalDataToDB() {
    try {
      console.log('Sincronizando datos locales con la base de datos...');
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
      
      // Buscar si existe localmente
      const localProduct = this.fallbackData.find(p => p.id === productId);
      
      if (localProduct && dbProduct) {
        // Combinar datos
        return {
          ...localProduct,
          name: dbProduct.name,
          price: dbProduct.price || localProduct.price,
          category: dbProduct.category || localProduct.category,
          inStock: dbProduct.in_stock,
          imagesUrl: dbProduct.images_url || localProduct.imagesUrl || []
        };
      }
      
      // Si solo existe en la DB (producto nuevo)
      if (dbProduct) {
        return {
          id: dbProduct.id,
          name: dbProduct.name,
          price: dbProduct.price || '',
          category: dbProduct.category,
          inStock: dbProduct.in_stock,
          imagesUrl: dbProduct.images_url || [],
          images: []
        };
      }
      
      // Si solo existe localmente (no debería pasar)
      return localProduct;
      
    } catch (error) {
      console.warn('Error al obtener producto de la API:', error);
      return this.fallbackData.find(p => p.id === productId);
    }
  }

  // Buscar productos por nombre o categoría
  searchProducts(searchTerm) {
    const products = this.cache || this.fallbackData;
    const lowercasedTerm = searchTerm.toLowerCase();
    
    return products.filter(product => 
      product.name.toLowerCase().includes(lowercasedTerm) ||
      product.category.toLowerCase().includes(lowercasedTerm)
    );
  }

  // Obtener productos por categoría
  getProductsByCategory(category) {
    const products = this.cache || this.fallbackData;
    
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
  getProductStats() {
    const products = this.cache || this.fallbackData;
    
    const stats = {
      total: products.length,
      inStock: products.filter(p => p.inStock).length,
      outOfStock: products.filter(p => !p.inStock).length,
      byCategory: {},
      newProducts: products.filter(p => p.isNew).length
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

// Exportar instancia singleton
const dataService = new DataService();
export default dataService;