// src/salesService.js - Servicio para gestión de ventas en el frontend
import authService from './authService';

class SalesService {
  constructor() {
    this.apiUrl = '/api/sales';
    this.statsUrl = '/api/sales-stats';
    this.cache = new Map();
    this.cacheDuration = 5 * 60 * 1000; // 5 minutos
  }

  // Función helper para manejar errores de respuesta
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // ✅ Crear nueva venta
  async createSale(saleData) {
    try {
      console.log('💰 Creando nueva venta...');
      
      // Validaciones básicas
      if (!saleData.customer_name || !saleData.customer_lastname) {
        throw new Error('Nombre y apellido del cliente son requeridos');
      }
      
      if (!saleData.items || saleData.items.length === 0) {
        throw new Error('Debe agregar al menos un producto');
      }
      
      if (!['efectivo', 'transferencia'].includes(saleData.payment_method)) {
        throw new Error('Método de pago inválido');
      }

      const response = await authService.authenticatedFetch(this.apiUrl, {
        method: 'POST',
        body: JSON.stringify(saleData)
      });

      const result = await this.handleResponse(response);
      
      // Limpiar cache para forzar actualización
      this.invalidateCache();
      
      console.log('✅ Venta creada exitosamente:', result.sale.id);
      return result;
      
    } catch (error) {
      console.error('❌ Error creando venta:', error);
      throw error;
    }
  }

  // ✅ Obtener lista de ventas con filtros
  async getSales(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        start_date,
        end_date,
        payment_method
      } = filters;

      // Crear clave de cache
      const cacheKey = `sales_${JSON.stringify(filters)}`;
      
      // Verificar cache
      if (this.isCacheValid(cacheKey)) {
        console.log('📦 Usando ventas del cache');
        return this.cache.get(cacheKey).data;
      }

      console.log('🔍 Obteniendo ventas...');

      // Construir query string
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (start_date) params.append('start_date', start_date);
      if (end_date) params.append('end_date', end_date);
      if (payment_method) params.append('payment_method', payment_method);

      const response = await authService.authenticatedFetch(
        `${this.apiUrl}?${params.toString()}`
      );

      const result = await this.handleResponse(response);
      
      // Guardar en cache
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      console.log(`✅ ${result.sales?.length || 0} ventas obtenidas`);
      return result;
      
    } catch (error) {
      console.error('❌ Error obteniendo ventas:', error);
      throw error;
    }
  }

  // ✅ Obtener una venta específica con detalles
  async getSale(saleId) {
    try {
      console.log(`🔍 Obteniendo venta ${saleId}...`);

      const response = await authService.authenticatedFetch(
        `${this.apiUrl}?id=${saleId}`
      );

      const sale = await this.handleResponse(response);
      console.log('✅ Venta obtenida con éxito');
      return sale;
      
    } catch (error) {
      console.error('❌ Error obteniendo venta:', error);
      throw error;
    }
  }

  // ✅ Actualizar una venta existente
  async updateSale(saleId, updateData) {
    try {
      console.log(`✏️ Actualizando venta ${saleId}...`);

      const response = await authService.authenticatedFetch(this.apiUrl, {
        method: 'PUT',
        body: JSON.stringify({
          id: saleId,
          ...updateData
        })
      });

      const result = await this.handleResponse(response);
      
      // Limpiar cache
      this.invalidateCache();
      
      console.log('✅ Venta actualizada exitosamente');
      return result;
      
    } catch (error) {
      console.error('❌ Error actualizando venta:', error);
      throw error;
    }
  }

  // ✅ Eliminar una venta
  async deleteSale(saleId) {
    try {
      console.log(`🗑️ Eliminando venta ${saleId}...`);

      if (!window.confirm('¿Estás seguro de que quieres eliminar esta venta? Esta acción no se puede deshacer.')) {
        return null;
      }

      const response = await authService.authenticatedFetch(
        `${this.apiUrl}?id=${saleId}`,
        { method: 'DELETE' }
      );

      const result = await this.handleResponse(response);
      
      // Limpiar cache
      this.invalidateCache();
      
      console.log('✅ Venta eliminada exitosamente');
      return result;
      
    } catch (error) {
      console.error('❌ Error eliminando venta:', error);
      throw error;
    }
  }

  // ✅ Obtener estadísticas de ventas
  async getStats(period = '30') {
    try {
      const cacheKey = `stats_${period}`;
      
      // Verificar cache
      if (this.isCacheValid(cacheKey)) {
        console.log('📊 Usando estadísticas del cache');
        return this.cache.get(cacheKey).data;
      }

      console.log('📈 Obteniendo estadísticas de ventas...');

      const params = new URLSearchParams({
        period: period.toString()
      });

      const response = await authService.authenticatedFetch(
        `${this.statsUrl}?${params.toString()}`
      );

      const stats = await this.handleResponse(response);
      
      // Guardar en cache por menos tiempo (las estadísticas cambian frecuentemente)
      this.cache.set(cacheKey, {
        data: stats,
        timestamp: Date.now()
      });

      console.log('✅ Estadísticas obtenidas');
      return stats;
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // ✅ Obtener estadísticas por rango de fechas
  async getStatsByDateRange(startDate, endDate) {
    try {
      const cacheKey = `stats_range_${startDate}_${endDate}`;
      
      if (this.isCacheValid(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }

      console.log('📈 Obteniendo estadísticas por rango de fechas...');

      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
      });

      const response = await authService.authenticatedFetch(
        `${this.statsUrl}?${params.toString()}`
      );

      const stats = await this.handleResponse(response);
      
      this.cache.set(cacheKey, {
        data: stats,
        timestamp: Date.now()
      });

      return stats;
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas por rango:', error);
      throw error;
    }
  }

  // ✅ Funciones de utilidad

  // Verificar si el cache es válido
  isCacheValid(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    return (Date.now() - cached.timestamp) < this.cacheDuration;
  }

  // Invalidar todo el cache
  invalidateCache() {
    this.cache.clear();
    console.log('🗑️ Cache de ventas limpiado');
  }

  // Invalidar cache específico
  invalidateCacheKey(key) {
    this.cache.delete(key);
  }

  // ✅ Funciones de validación y formato

  // Validar datos de venta antes de enviar
  validateSaleData(saleData) {
    const errors = [];

    if (!saleData.customer_name?.trim()) {
      errors.push('El nombre del cliente es requerido');
    }

    if (!saleData.customer_lastname?.trim()) {
      errors.push('El apellido del cliente es requerido');
    }

    if (!saleData.payment_method || !['efectivo', 'transferencia'].includes(saleData.payment_method)) {
      errors.push('Método de pago inválido');
    }

    if (!saleData.items || saleData.items.length === 0) {
      errors.push('Debe agregar al menos un producto');
    } else {
      saleData.items.forEach((item, index) => {
        if (!item.product_id) {
          errors.push(`Item ${index + 1}: Producto es requerido`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Cantidad debe ser mayor a 0`);
        }
        if (!item.unit_price || item.unit_price <= 0) {
          errors.push(`Item ${index + 1}: Precio debe ser mayor a 0`);
        }
      });
    }

    if (saleData.customer_email && !this.isValidEmail(saleData.customer_email)) {
      errors.push('Email del cliente no es válido');
    }

    return errors;
  }

  // Validar email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Calcular total de una venta
  calculateSaleTotal(items) {
    if (!Array.isArray(items)) return 0;
    
    return items.reduce((total, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      return total + (quantity * unitPrice);
    }, 0);
  }

  // Formatear moneda
  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount || 0);
  }

  // Formatear fecha
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ✅ Funciones de exportación

  // Exportar ventas a CSV
  exportSalesToCSV(sales) {
    const headers = [
      'ID',
      'Fecha',
      'Cliente',
      'Teléfono',
      'Email',
      'Método Pago',
      'Total',
      'Items',
      'Notas'
    ];

    const rows = sales.map(sale => [
      sale.id,
      this.formatDate(sale.created_at),
      `${sale.customer_name} ${sale.customer_lastname}`,
      sale.customer_phone || '',
      sale.customer_email || '',
      sale.payment_method,
      sale.total_amount,
      sale.items_count || sale.total_items || 0,
      sale.notes || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ventas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  // ✅ Funciones de análisis

  // Analizar tendencias de ventas
  analyzeSalesTrends(dailySales) {
    if (!Array.isArray(dailySales) || dailySales.length < 2) {
      return { trend: 'insuficiente', change: 0 };
    }

    const sorted = dailySales.sort((a, b) => new Date(a.date) - new Date(b.date));
    const recent = sorted.slice(-7); // Últimos 7 días
    const previous = sorted.slice(-14, -7); // 7 días anteriores

    const recentAvg = recent.reduce((sum, day) => sum + parseFloat(day.daily_revenue || 0), 0) / recent.length;
    const previousAvg = previous.length > 0 
      ? previous.reduce((sum, day) => sum + parseFloat(day.daily_revenue || 0), 0) / previous.length 
      : recentAvg;

    const change = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

    let trend = 'estable';
    if (change > 5) trend = 'creciente';
    else if (change < -5) trend = 'decreciente';

    return { trend, change: Math.round(change * 100) / 100 };
  }

  // Obtener información de debug
  getDebugInfo() {
    return {
      cacheSize: this.cache.size,
      cacheKeys: Array.from(this.cache.keys()),
      cacheDuration: this.cacheDuration,
      apiUrl: this.apiUrl,
      statsUrl: this.statsUrl
    };
  }
}

const salesService = new SalesService();
export default salesService;