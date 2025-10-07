// src/AdminVentas.js - Panel de Ventas completo e independiente
import React, { useState, useEffect, useCallback } from 'react'; 
import authService from './authService';
const API_BASE_URL = process.env.REACT_APP_API_URL || '';


const AdminVentas = () => {
  const [activeTab, setActiveTab] = useState('new-sale');
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para nueva venta
  const [newSale, setNewSale] = useState({
    customer_name: '',
    customer_lastname: '',
    customer_phone: '',
    customer_email: '',
    payment_method: 'efectivo',
    notes: '',
    items: []
  });
  
  // Estados para el formulario de item
  const [newItem, setNewItem] = useState({
    product_id: '',
    quantity: 1,
    unit_price: ''
  });
  
  // Estados para filtros y estadísticas
  const [stats, setStats] = useState(null);
  const [salesFilter, setSalesFilter] = useState({
    page: 1,
    limit: 10,
    start_date: '',
    end_date: '',
    payment_method: ''
  });


  // ===== FUNCIONES DE CARGA DE DATOS =====

  const loadProducts = async () => {
    try {
      const productsData = await authService.getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error cargando productos:', error);
      setError('Error al cargar productos');
    }
  };

  const loadSales = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/api/sales?page=${salesFilter.page}&limit=${salesFilter.limit}` + // 👈 Corregido
        `${salesFilter.start_date ? '&start_date=' + salesFilter.start_date : ''}` +
        `${salesFilter.end_date ? '&end_date=' + salesFilter.end_date : ''}` +
        `${salesFilter.payment_method ? '&payment_method=' + salesFilter.payment_method : ''}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSales(data.sales || data);
      } else {
        throw new Error('Error al obtener ventas');
      }
    } catch (error) {
      console.error('Error cargando ventas:', error);
      setError('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  }, [salesFilter]);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/api/sales-stats`); // 👈 Corregido
      
      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      } else {
        throw new Error('Error al obtener estadísticas');
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setError('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    if (activeTab === 'sales-list') {
      loadSales();
    } else if (activeTab === 'statistics') {
      loadStats();
    }
  },  [activeTab, loadSales, loadStats]);

  // ===== FUNCIONES DE MANEJO DE ESTADO =====
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSalesFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewSaleChange = (field, value) => {
    setNewSale(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setSalesFilter({
      page: 1,
      limit: 10,
      start_date: '',
      end_date: '',
      payment_method: ''
    });
    // loadSales() se disparará automáticamente por el cambio en el estado
  };

  const handleNewItemChange = (field, value) => {
    setNewItem(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-completar precio cuando se selecciona un producto
    if (field === 'product_id' && value) {
      const selectedProduct = products.find(p => p.id === parseInt(value));
      if (selectedProduct && selectedProduct.price) {
        const numericPrice = selectedProduct.price.replace(/[^\d]/g, '');
        setNewItem(prev => ({
          ...prev,
          unit_price: numericPrice || ''
        }));
      }
    }
  };

  const addItemToSale = () => {
    if (!newItem.product_id || !newItem.quantity || !newItem.unit_price) {
      alert('Por favor completa todos los campos del producto');
      return;
    }

    const product = products.find(p => p.id === parseInt(newItem.product_id));
    const subtotal = parseInt(newItem.quantity) * parseFloat(newItem.unit_price);

    const item = {
      product_id: parseInt(newItem.product_id),
      product_name: product.name,
      quantity: parseInt(newItem.quantity),
      unit_price: parseFloat(newItem.unit_price),
      subtotal: subtotal
    };

    setNewSale(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    // Resetear formulario de item
    setNewItem({
      product_id: '',
      quantity: 1,
      unit_price: ''
    });
  };

  const removeItemFromSale = (index) => {
    setNewSale(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return newSale.items.reduce((total, item) => total + item.subtotal, 0);
  };

  const handleSubmitSale = async (e) => {
    e.preventDefault();
    
    if (!newSale.customer_name || !newSale.customer_lastname || newSale.items.length === 0) {
      alert('Por favor completa los datos del cliente y agrega al menos un producto');
      return;
    }

    try {
      setLoading(true);
      const saleData = {
        ...newSale,
        total_amount: calculateTotal()
      };

      const response = await authService.authenticatedFetch(`${API_BASE_URL}/api/sales`, { // 👈 Corregido
        method: 'POST',
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        await response.json(); 
        setSuccessMessage('¡Venta registrada exitosamente!');
        
        // Resetear formulario
        setNewSale({
          customer_name: '',
          customer_lastname: '',
          customer_phone: '',
          customer_email: '',
          payment_method: 'efectivo',
          notes: '',
          items: []
        });
        
        // Cambiar a la pestaña de ventas
        setTimeout(() => {
          setActiveTab('sales-list');
          setSuccessMessage('');
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al registrar venta');
      }
    } catch (error) {
      console.error('Error registrando venta:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
    // ✅ Función para eliminar venta
    const handleDeleteSale = async (saleId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta venta?')) {
        return;
    }

    try {
        setLoading(true);
        const response = await authService.authenticatedFetch(`${API_BASE_URL}/api/sales?id=${saleId}`, { // 👈 Corregido
        method: 'DELETE'
        });

        if (response.ok) {
        setSuccessMessage('Venta eliminada exitosamente');
        loadSales(); // Recargar la lista
        } else {
        throw new Error('Error al eliminar venta');
        }
    } catch (error) {
        setError(error.message);
    } finally {
        setLoading(false);
    }
    };

    
  const handleLogout = () => {
    authService.logout();
    window.location.href = '/admin';
  };

  // ===== FUNCIONES DE UTILIDAD =====

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ===== COMPONENTES DE RENDERIZADO =====

  const renderTabNavigation = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '2rem',
      background: 'white',
      borderRadius: '16px',
      padding: '0.5rem',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(230, 227, 212, 0.5)'
    }}>
      {[
        { key: 'new-sale', label: 'Nueva Venta', icon: '📝' },
        { key: 'sales-list', label: 'Lista de Ventas', icon: '📊' },
        { key: 'statistics', label: 'Estadísticas', icon: '📈' }
      ].map(tab => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          style={{
            padding: '1rem 2rem',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease',
            background: activeTab === tab.key 
              ? 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)'
              : 'transparent',
            color: activeTab === tab.key ? 'white' : '#333'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderNewSaleForm = () => (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '2.5rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(230, 227, 212, 0.5)'
    }}>
      <h3 style={{ 
        fontFamily: 'Didot, serif',
        fontSize: '1.8rem',
        color: '#333',
        textAlign: 'center',
        marginBottom: '2rem',
        fontWeight: '400'
      }}>
        Nueva Venta
      </h3>

      <form onSubmit={handleSubmitSale}>
        {/* Datos del Cliente */}
        <div style={{
          background: 'linear-gradient(135deg, #f3f1eb 0%, #f8f6f0 100%)',
          padding: '2rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          border: '1px solid rgba(230, 227, 212, 0.8)'
        }}>
          <h4 style={{ 
            fontFamily: 'Montserrat, sans-serif',
            color: '#333',
            marginBottom: '1.5rem',
            fontSize: '1.2rem',
            fontWeight: '600'
          }}>
            👤 Datos del Cliente
          </h4>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.5rem' 
          }}>
            <input
              type="text"
              placeholder="Nombre *"
              value={newSale.customer_name}
              onChange={(e) => handleNewSaleChange('customer_name', e.target.value)}
              required
              style={{
                padding: '1rem',
                border: '2px solid #e9ecef',
                borderRadius: '12px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#d4af37'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
            
            <input
              type="text"
              placeholder="Apellido *"
              value={newSale.customer_lastname}
              onChange={(e) => handleNewSaleChange('customer_lastname', e.target.value)}
              required
              style={{
                padding: '1rem',
                border: '2px solid #e9ecef',
                borderRadius: '12px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#d4af37'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
            
            <input
              type="tel"
              placeholder="Teléfono (opcional)"
              value={newSale.customer_phone}
              onChange={(e) => handleNewSaleChange('customer_phone', e.target.value)}
              style={{
                padding: '1rem',
                border: '2px solid #e9ecef',
                borderRadius: '12px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#d4af37'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
            
            <input
              type="email"
              placeholder="Email (opcional)"
              value={newSale.customer_email}
              onChange={(e) => handleNewSaleChange('customer_email', e.target.value)}
              style={{
                padding: '1rem',
                border: '2px solid #e9ecef',
                borderRadius: '12px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#d4af37'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1.5rem',
            marginTop: '1.5rem'
          }}>
            <select
              value={newSale.payment_method}
              onChange={(e) => handleNewSaleChange('payment_method', e.target.value)}
              style={{
                padding: '1rem',
                border: '2px solid #e9ecef',
                borderRadius: '12px',
                fontSize: '1rem',
                backgroundColor: 'white',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="efectivo">💵 Efectivo</option>
              <option value="transferencia">🏦 Transferencia</option>
            </select>
            
            <textarea
              placeholder="Notas (opcional)"
              value={newSale.notes}
              onChange={(e) => handleNewSaleChange('notes', e.target.value)}
              rows={3}
              style={{
                padding: '1rem',
                border: '2px solid #e9ecef',
                borderRadius: '12px',
                fontSize: '1rem',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                gridColumn: '1 / -1'
              }}
              onFocus={(e) => e.target.style.borderColor = '#d4af37'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
          </div>
        </div>

        {/* Agregar Productos */}
        <div style={{
          background: 'linear-gradient(135deg, #e8f4fd 0%, #f0f8ff 100%)',
          padding: '2rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <h4 style={{ 
            fontFamily: 'Montserrat, sans-serif',
            color: '#1e40af',
            marginBottom: '1.5rem',
            fontSize: '1.2rem',
            fontWeight: '600'
          }}>
            🛍️ Agregar Productos
          </h4>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '2fr 1fr 1.5fr 1fr', 
            gap: '1rem',
            alignItems: 'end'
          }}>
            <select
              value={newItem.product_id}
              onChange={(e) => handleNewItemChange('product_id', e.target.value)}
              style={{
                padding: '1rem',
                border: '2px solid #e9ecef',
                borderRadius: '12px',
                fontSize: '1rem',
                backgroundColor: 'white',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="">Seleccionar producto</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.category}) - {product.price}
                </option>
              ))}
            </select>
            
            <input
              type="number"
              placeholder="Cantidad"
              min="1"
              value={newItem.quantity}
              onChange={(e) => handleNewItemChange('quantity', e.target.value)}
              style={{
                padding: '1rem',
                border: '2px solid #e9ecef',
                borderRadius: '12px',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            
            <input
              type="number"
              placeholder="Precio unitario"
              min="0"
              step="0.01"
              value={newItem.unit_price}
              onChange={(e) => handleNewItemChange('unit_price', e.target.value)}
              style={{
                padding: '1rem',
                border: '2px solid #e9ecef',
                borderRadius: '12px',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            
            <button
              type="button"
              onClick={addItemToSale}
              disabled={!newItem.product_id || !newItem.quantity || !newItem.unit_price}
              style={{
                padding: '1rem 2rem',
                background: newItem.product_id && newItem.quantity && newItem.unit_price 
                  ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' 
                  : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: newItem.product_id && newItem.quantity && newItem.unit_price 
                  ? 'pointer' 
                  : 'not-allowed',
                fontWeight: '600',
                whiteSpace: 'nowrap'
              }}
            >
              ➕ Agregar
            </button>
          </div>
        </div>

        {/* Lista de Items Agregados */}
        {newSale.items.length > 0 && (
          <div style={{
            background: 'white',
            border: '2px solid #d4af37',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h4 style={{ 
              fontFamily: 'Montserrat, sans-serif',
              color: '#333',
              marginBottom: '1.5rem',
              fontSize: '1.2rem',
              fontWeight: '600'
            }}>
              🛒 Productos Agregados ({newSale.items.length})
            </h4>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Producto</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Cantidad</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Precio Unit.</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Subtotal</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {newSale.items.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '1rem' }}>{item.product_name}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>
                        {formatCurrency(item.subtotal)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => removeItemFromSale(index)}
                          style={{
                            background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '500'
                          }}
                        >
                          🗑️ Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)',
              borderRadius: '12px',
              color: 'white',
              textAlign: 'right'
            }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '1.5rem', 
                fontWeight: '700' 
              }}>
                💰 Total: {formatCurrency(calculateTotal())}
              </h3>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'center',
          paddingTop: '1rem'
        }}>
          <button 
            type="submit" 
            disabled={loading || newSale.items.length === 0}
            style={{
              background: loading || newSale.items.length === 0 
                ? '#6c757d' 
                : 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)',
              color: 'white',
              border: 'none',
              padding: '1rem 3rem',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading || newSale.items.length === 0 
                ? 'not-allowed' 
                : 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              minWidth: '200px'
            }}
          >
            {loading ? '⏳ Registrando...' : '✅ Registrar Venta'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderSalesList = () => (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '2.5rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(230, 227, 212, 0.5)'
    }}>
      <h3 style={{ 
        fontFamily: 'Didot, serif',
        fontSize: '1.8rem',
        color: '#333',
        textAlign: 'center',
        marginBottom: '2rem',
        fontWeight: '400'
      }}>
        📊 Lista de Ventas
      </h3>
      <div style={{
        display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem',
        padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px'
      }}>
        <input
          type="date"
          name="start_date"
          value={salesFilter.start_date}
          onChange={handleFilterChange}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <input
          type="date"
          name="end_date"
          value={salesFilter.end_date}
          onChange={handleFilterChange}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <select
          name="payment_method"
          value={salesFilter.payment_method}
          onChange={handleFilterChange}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
        >
          <option value="">Todos los métodos</option>
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
        </select>
        <button
          onClick={clearFilters}
          style={{
            padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
            background: '#6c757d', color: 'white', cursor: 'pointer'
          }}
        >
          Limpiar Filtros
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          Cargando ventas...
        </div>
      ) : sales.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📊</div>
          <p>No hay ventas registradas</p>
          <button 
            onClick={() => setActiveTab('new-sale')}
            style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              marginTop: '1rem'
            }}
          >
            📝 Registrar Primera Venta
          </button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{
                background: 'linear-gradient(135deg, #e6e3d4 0%, #ddd8c7 100%)'
              }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>ID</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Cliente</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Contacto</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Método Pago</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Total</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Items</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Fecha</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '1rem', fontWeight: '600' }}>{sale.id}</td>
                  <td style={{ padding: '1rem' }}>
                    <div>
                      <strong>{sale.customer_name} {sale.customer_lastname}</strong>
                      {sale.notes && (
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                          💬 {sale.notes}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                    {sale.customer_phone && <div>📞 {sale.customer_phone}</div>}
                    {sale.customer_email && <div>✉️ {sale.customer_email}</div>}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDeleteSale(sale.id)}
                      style={{
                        background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      background: sale.payment_method === 'efectivo' 
                        ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)'
                        : 'linear-gradient(135deg, #cce5ff 0%, #b3d9ff 100%)',
                      color: sale.payment_method === 'efectivo' ? '#155724' : '#004085'
                    }}>
                      {sale.payment_method === 'efectivo' ? '💵 Efectivo' : '🏦 Transferencia'}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '1rem', 
                    textAlign: 'center',
                    fontSize: '0.9rem',
                    color: '#666'
                  }}>
                    {formatDate(sale.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderStatistics = () => (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '2.5rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(230, 227, 212, 0.5)'
    }}>
      <h3 style={{ 
        fontFamily: 'Didot, serif',
        fontSize: '1.8rem',
        color: '#333',
        textAlign: 'center',
        marginBottom: '2rem',
        fontWeight: '400'
      }}>
        📈 Estadísticas de Ventas
      </h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #d4af37',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          Cargando estadísticas...
        </div>
      ) : !stats ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📈</div>
          <p>No hay datos de estadísticas disponibles</p>
          <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
            Las estadísticas aparecerán una vez que registres algunas ventas
          </p>
        </div>
      ) : (
        <div>
          {/* Estadísticas Generales */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)',
              color: 'white',
              padding: '2rem',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(212, 175, 55, 0.3)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💰</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {formatCurrency(stats.general?.total_revenue || 0)}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>Ingresos Totales</div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
              color: 'white',
              padding: '2rem',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(40, 167, 69, 0.3)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📊</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {stats.general?.total_sales || 0}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>Total de Ventas</div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
              color: 'white',
              padding: '2rem',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 123, 255, 0.3)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📈</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {formatCurrency(stats.general?.average_sale || 0)}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>Venta Promedio</div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #6f42c1 0%, #5a3a9a 100%)',
              color: 'white',
              padding: '2rem',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(111, 66, 193, 0.3)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🛍️</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {Object.values(stats.payment_methods || {}).reduce((sum, method) => sum + (method.count || 0), 0)}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>Items Vendidos</div>
            </div>
          </div>

          {/* Métodos de Pago */}
          {stats.payment_methods && (
            <div style={{
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              padding: '2rem',
              borderRadius: '16px',
              marginBottom: '2rem',
              border: '1px solid rgba(230, 227, 212, 0.8)'
            }}>
              <h4 style={{
                fontFamily: 'Montserrat, sans-serif',
                color: '#333',
                marginBottom: '1.5rem',
                fontSize: '1.3rem',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                💳 Ventas por Método de Pago
              </h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem'
              }}>
                {stats.payment_methods.map((method) => (
                  <div key={method.payment_method} style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '1px solid #dee2e6',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{
                      fontSize: '2rem',
                      marginBottom: '1rem'
                    }}>
                      {method.payment_method === 'efectivo' ? '💵' : '🏦'}
                    </div>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: method.payment_method === 'efectivo' ? '#28a745' : '#007bff',
                      marginBottom: '0.5rem'
                    }}>
                      {formatCurrency(method.revenue || 0)}
                    </div>
                    <div style={{ color: '#666', fontSize: '1rem', marginBottom: '0.5rem' }}>
                      {method.count || 0} ventas ({method.percentage || 0}%)
                    </div>
                    <div style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      background: method.payment_method === 'efectivo' ? '#d4edda' : '#cce5ff',
                      color: method.payment_method === 'efectivo' ? '#155724' : '#004085',
                      display: 'inline-block'
                    }}>
                      {method.payment_method === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Productos Más Vendidos */}
          {stats.top_products && stats.top_products.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
              padding: '2rem',
              borderRadius: '16px',
              marginBottom: '2rem',
              border: '1px solid rgba(255, 152, 0, 0.2)'
            }}>
              <h4 style={{
                fontFamily: 'Montserrat, sans-serif',
                color: '#e65100',
                marginBottom: '1.5rem',
                fontSize: '1.3rem',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                🏆 Productos Más Vendidos
              </h4>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 152, 0, 0.1)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>🏅</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Producto</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Cantidad Vendida</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.top_products.slice(0, 5).map((product, index) => (
                      <tr key={index} style={{ 
                        background: 'white', 
                        borderBottom: '1px solid rgba(255, 152, 0, 0.1)' 
                      }}>
                        <td style={{ padding: '1rem', textAlign: 'center', fontSize: '1.2rem' }}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: '600', fontSize: '1rem' }}>{product.name}</div>
                          {product.category && (
                            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                              📂 {product.category}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '1.1rem' }}>
                          {product.total_quantity_sold || product.total_quantity || 0} unidades
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#e65100', fontSize: '1.1rem' }}>
                          {formatCurrency(product.total_revenue || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ventas Recientes */}
          {stats.daily_sales && stats.daily_sales.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)',
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid rgba(76, 175, 80, 0.2)'
            }}>
              <h4 style={{
                fontFamily: 'Montserrat, sans-serif',
                color: '#2e7d32',
                marginBottom: '1.5rem',
                fontSize: '1.3rem',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                📅 Ventas por Día (Últimos 7 días)
              </h4>
              
              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                {stats.daily_sales.slice(0, 7).map((day, index) => (
                  <div key={index} style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid rgba(76, 175, 80, 0.1)',
                    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.1)'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '1rem', color: '#2e7d32' }}>
                        📅 {formatDate(day.date)}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                        {day.sales_count || 0} ventas realizadas
                      </div>
                    </div>
                    <div style={{
                      fontWeight: '700',
                      color: '#2e7d32',
                      fontSize: '1.3rem'
                    }}>
                      {formatCurrency(day.daily_revenue || 0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ===== RENDER PRINCIPAL =====

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f9f7f4 0%, #f5f3ee 100%)',
      fontFamily: 'Montserrat, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #e6e3d4 0%, #ddd8c7 100%)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Logo y Título */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => window.location.href = '/admin'}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#333',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Volver al Panel Principal"
            >
              ← 
            </button>
            <h1 style={{
              fontFamily: 'Didot, serif',
              fontSize: '2rem',
              fontStyle: 'italic',
              color: '#333',
              margin: 0,
              fontWeight: '400'
            }}>
              Piuma Ventas
            </h1>
          </div>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={() => window.location.href = '/admin'}
              style={{
                background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>🏠</span>
              <span>Panel Principal</span>
            </button>
            
            <button
              onClick={handleLogout}
              style={{
                background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>🚪</span>
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {/* Mensajes de Estado */}
        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
            color: '#721c24',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid #f1aeb5',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div>
              <strong>Error:</strong> {error}
            </div>
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: '#721c24',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0.25rem'
              }}
            >
              ✕
            </button>
          </div>
        )}

        {successMessage && (
          <div style={{
            background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
            color: '#155724',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid #c6e2c7',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '1.2rem' }}>✅</span>
            <div>
              <strong>Éxito:</strong> {successMessage}
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: '#155724',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0.25rem'
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Navegación de Pestañas */}
        {renderTabNavigation()}

        {/* Contenido de la Pestaña Activa */}
        {activeTab === 'new-sale' && renderNewSaleForm()}
        {activeTab === 'sales-list' && renderSalesList()}
        {activeTab === 'statistics' && renderStatistics()}
      </main>

        {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'white',
            padding: '2.5rem 3rem',
            borderRadius: '16px',
            fontSize: '1.2rem',
            color: '#333',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(230, 227, 212, 0.5)',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #d4af37',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            Procesando...
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @media (max-width: 768px) {
            main {
              padding: 1rem !important;
            }
            
            .grid-responsive {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default AdminVentas;