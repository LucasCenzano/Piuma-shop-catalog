// dataService.js - Servicio optimizado para carga rápida de datos e imágenes

class DataService {
  constructor() {
    this.apiUrl = '/api/products';
    this.cache = null;
    this.cacheTime = null;
    this.cacheDuration = 10 * 60 * 1000; // ✅ Aumentado a 10 minutos para mejor rendimiento
    
    // ✅ Cache de imágenes precargadas
    this.imageCache = new Map();
    this.preloadInProgress = false;
  }

  // Verificar si el cache es válido
  isCacheValid() {
    return this.cache && this.cacheTime &&
           (Date.now() - this.cacheTime) < this.cacheDuration;
  }

  // ✅ Precargar una imagen específica
  async preloadImage(url) {
    if (!url || this.imageCache.has(url)) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const img = new Image();
      
      // Configurar para carga optimizada
      img.loading = 'eager';
      img.decoding = 'async';
      img.crossOrigin = 'anonymous'; // Para evitar problemas de CORS
      
      const handleComplete = (success = true) => {
        this.imageCache.set(url, { loaded: success, timestamp: Date.now() });
        resolve();
      };

      img.onload = () => handleComplete(true);
      img.onerror = () => {
        console.warn(`⚠️ Error precargando imagen: ${url}`);
        handleComplete(false);
      };

      // Iniciar la carga
      img.src = url;
    });
  }

  // ✅ Precargar todas las imágenes de los productos
  async preloadAllImages(products) {
    if (this.preloadInProgress) {
      console.log('🔄 Precarga ya en progreso...');
      return;
    }

    this.preloadInProgress = true;
    console.log('🖼️ Iniciando precarga masiva de imágenes...');

    try {
      // Recopilar todas las URLs únicas
      const allUrls = new Set();
      products.forEach(product => {
        if (product.images_url && Array.isArray(product.images_url)) {
          product.images_url.forEach(url => {
            if (url && url.trim().length > 0) {
              allUrls.add(url.trim());
            }
          });
        }
      });

      const urlsArray = Array.from(allUrls);
      console.log(`📊 Precargando ${urlsArray.length} imágenes únicas...`);

      // ✅ Precargar en lotes para no saturar la red
      const batchSize = 5; // Cargar 5 imágenes simultáneamente
      const batches = [];
      
      for (let i = 0; i < urlsArray.length; i += batchSize) {
        batches.push(urlsArray.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        await Promise.all(batch.map(url => this.preloadImage(url)));
      }

      console.log('✅ Precarga de imágenes completada');
    } catch (error) {
      console.error('❌ Error en precarga de imágenes:', error);
    } finally {
      this.preloadInProgress = false;
    }
  }

  // ✅ Obtener todos los productos con precarga optimizada
  async getAllProducts() {
    if (this.isCacheValid()) {
      console.log('📦 Usando productos del cache');
      
      // ✅ Precargar imágenes en segundo plano si no se ha hecho
      if (!this.preloadInProgress && this.imageCache.size === 0) {
        setTimeout(() => this.preloadAllImages(this.cache), 100);
      }
      
      return this.cache;
    }

    try {
      console.log('🚀 Obteniendo productos de la base de datos...');
      
      // ✅ Configurar fetch para mejor rendimiento
      const response = await fetch(this.apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'max-age=300' // Cache del navegador por 5 minutos
        },
        // ✅ Configuraciones para mejor rendimiento
        cache: 'reload', // Usar cache del navegador si está disponible
        priority: 'high' // Alta prioridad para esta petición
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const productsFromDB = await response.json();
      console.log(`📦 ${productsFromDB.length} productos obtenidos de la DB`);

      // ✅ Guardar en cache inmediatamente
      this.cache = productsFromDB;
      this.cacheTime = Date.now();

      // ✅ Iniciar precarga de imágenes en paralelo (no bloqueante)
      setTimeout(() => this.preloadAllImages(productsFromDB), 50);

      return productsFromDB;
    } catch (error) {
      console.error('❌ Error al obtener productos de la API:', error);
      throw error;
    }
  }

  // ✅ Verificar si una imagen está precargada
  isImagePreloaded(url) {
    return this.imageCache.has(url) && this.imageCache.get(url).loaded;
  }

  // ✅ Obtener estadísticas de precarga
  getPreloadStats() {
    const total = this.imageCache.size;
    const loaded = Array.from(this.imageCache.values()).filter(item => item.loaded).length;
    
    return {
      total,
      loaded,
      percentage: total > 0 ? Math.round((loaded / total) * 100) : 0,
      inProgress: this.preloadInProgress
    };
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
      console.error('❌ Error al actualizar stock:', error);
      throw error;
    }
  }

  // Obtener un producto específico
  async getProduct(productId) {
    try {
      const response = await fetch(`${this.apiUrl}?id=${productId}`, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'max-age=300'
        },
        cache: 'force-cache'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const dbProduct = await response.json();
      return dbProduct;
    } catch (error) {
      console.warn('❌ Error al obtener producto de la API:', error);
      throw error;
    }
  }

  // Buscar productos por nombre o categoría
  async searchProducts(searchTerm) {
    const products = await this.getAllProducts();
    const lowercasedTerm = searchTerm.toLowerCase();

    return products.filter(product =>
      product.name.toLowerCase().includes(lowercasedTerm) ||
      product.category.toLowerCase().includes(lowercasedTerm) ||
      (product.description && product.description.toLowerCase().includes(lowercasedTerm))
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

  // ✅ Invalidar cache completo (incluyendo imágenes)
  invalidateCache() {
    console.log('🗑️ Invalidando cache completo...');
    this.cache = null;
    this.cacheTime = null;
    this.imageCache.clear();
    this.preloadInProgress = false;
  }

  // ✅ Invalidar solo cache de imágenes
  invalidateImageCache() {
    console.log('🖼️ Invalidando cache de imágenes...');
    this.imageCache.clear();
    this.preloadInProgress = false;
  }

  // Obtener estadísticas de productos
  async getProductStats() {
    const products = await this.getAllProducts();

    const stats = {
      total: products.length,
      inStock: products.filter(p => p.in_stock).length,
      outOfStock: products.filter(p => !p.in_stock).length,
      byCategory: {},
      totalImages: 0,
      preloadStats: this.getPreloadStats()
    };

    // Contar por categoría y total de imágenes
    products.forEach(product => {
      if (!stats.byCategory[product.category]) {
        stats.byCategory[product.category] = 0;
      }
      stats.byCategory[product.category]++;
      
      // Contar imágenes
      if (product.images_url && Array.isArray(product.images_url)) {
        stats.totalImages += product.images_url.length;
      }
    });

    return stats;
  }

  // ✅ Método para optimizar el rendimiento general
  async optimizePerformance() {
    console.log('⚡ Optimizando rendimiento...');
    
    try {
      // 1. Precargar productos si no están en cache
      if (!this.isCacheValid()) {
        await this.getAllProducts();
      }
      
      // 2. Iniciar precarga de imágenes si no está en progreso
      if (!this.preloadInProgress && this.cache) {
        await this.preloadAllImages(this.cache);
      }
      
      // 3. Limpiar cache antiguo de imágenes (más de 1 hora)
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      for (const [url, data] of this.imageCache.entries()) {
        if (data.timestamp < oneHourAgo) {
          this.imageCache.delete(url);
        }
      }
      
      console.log('✅ Optimización completada');
      return this.getPreloadStats();
      
    } catch (error) {
      console.error('❌ Error en optimización:', error);
      throw error;
    }
  }

  // ✅ Método de utilidad para debugging
  getDebugInfo() {
    return {
      cacheValid: this.isCacheValid(),
      cacheTime: this.cacheTime ? new Date(this.cacheTime).toLocaleString() : null,
      productsInCache: this.cache ? this.cache.length : 0,
      imagesInCache: this.imageCache.size,
      preloadInProgress: this.preloadInProgress,
      preloadStats: this.getPreloadStats()
    };
  }
}

const dataService = new DataService();

// ✅ Optimizar automáticamente cuando se carga el módulo
if (typeof window !== 'undefined') {
  // Solo en el navegador
  window.addEventListener('load', () => {
    setTimeout(() => {
      dataService.optimizePerformance().catch(console.error);
    }, 1000); // Esperar 1 segundo después de la carga inicial
  });
}

export default dataService;
