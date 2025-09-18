// src/SalesComponent.js - Componente completo para gestión de ventas
import React, { useState, useEffect } from 'react';
import authService from './authService';

const SalesComponent = () => {
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

  useEffect(() => {
    loadProducts();
    if (activeTab === 'sales-list') {
      loadSales();
    } else if (activeTab === 'statistics') {
      loadStats();
    }
  }, [activeTab]);

  const loadProducts = async () => {
    try {
      const productsData = await authService.getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error cargando productos:', error);
      setError('Error al cargar productos');
    }
  };

  const loadSales = async () => {
    try {
      setLoading(true);
      const response = await authService.authenticatedFetch(
        `/api/sales?page=${salesFilter.page}&limit=${salesFilter.limit}` +
        `${salesFilter.start_date ? '&start_date=' + salesFilter.start_date : ''}` +
        `${salesFilter.end_date ? '&end_date=' + salesFilter.end_date : ''}` +
        `${salesFilter.payment_method ? '&payment_method=' + salesFilter.payment_method : ''}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSales(data.sales || data); // Compatible con diferentes formatos de respuesta
      } else {
        throw new Error('Error al obtener ventas');
      }
    } catch (error) {
      console.error('Error cargando ventas:', error);
      setError('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await authService.authenticatedFetch('/api/sales-stats');
      
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
  };

  const handleNewSaleChange = (field, value) => {
    setNewSale(prev => ({
      ...prev,
      [field]: value
    }));
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
        // Extraer número del precio (ej: "$25.000" -> 25000)
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

      const response = await authService.authenticatedFetch('/api/sales', {
        method: 'POST',
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        const result = await response.json();
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
            Datos del Cliente
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
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
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
            Agregar Productos
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
                  {product.name} ({product.category})
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
              Agregar
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
              Productos Agregados ({newSale.items.length})
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
                          Quitar
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
                Total: {formatCurrency(calculateTotal())}
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
            {loading ? 'Registrando...' : 'Registrar Venta'}
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
        Lista de Ventas
      </h3>

      {/* Filtros */}
      <div style={{
        background: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <input
          type="date"
          value={salesFilter.start_date}
          onChange={(e) => setSalesFilter(prev => ({ ...prev, start_date: e.target.value }))}
          style={{
            padding: '0.75rem',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            outline: 'none'
          }}
        />
        <input
          type="date"
          value={salesFilter.end_date}
          onChange={(e) => setSalesFilter(prev => ({ ...prev, end_date: e.target.value }))}
          style={{
            padding: '0.75rem',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            outline: 'none'
          }}
        />
        <select
          value={salesFilter.payment_method}
          onChange={(e) => setSalesFilter(prev => ({ ...prev, payment_method: e.target.value }))}
          style={{
            padding: '0.75rem',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            outline: 'none',
            backgroundColor: 'white'
          }}
        >
          <option value="">Todos los métodos</option>
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
        </select>
        <button
          onClick={loadSales}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Filtrar
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
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                          {sale.notes}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                    {sale.customer_phone && <div>{sale.customer_phone}</div>}
                    {sale.customer_email && <div>{sale.customer_email}</div>}
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
                      {sale.payment_method === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '1rem', 
                    textAlign: 'right', 
                    fontWeight: '700',
                    color: '#d4af37',
                    fontSize: '1.1rem'
                  }}>
                    {formatCurrency(sale.total_amount)}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{
                      background: '#f8f9fa',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#495057'
                    }}>
                      {sale.total_items || sale.items_count || 0} items
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

      {/* Paginación */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem',
        marginTop: '2rem',
        padding: '1rem'
      }}>
        <button
          onClick={() => setSalesFilter(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
          disabled={salesFilter.page === 1}
          style={{
            padding: '0.75rem 1.5rem',
            background: salesFilter.page === 1 ? '#e9ecef' : 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
            color: salesFilter.page === 1 ? '#6c757d' : 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: salesFilter.page === 1 ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}
        >
          Anterior
        </button>
        
        <span style={{
          padding: '0.75rem 1rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          fontWeight: '600',
          color: '#495057'
        }}>
          Página {salesFilter.page}
        </span>
        
        <button
          onClick={() => setSalesFilter(prev => ({ ...prev, page: prev.page + 1 }))}
          disabled={sales.length < salesFilter.limit}
          style={{
            padding: '0.75rem 1.5rem',
            background: sales.length < salesFilter.limit ? '#e9ecef' : 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
            color: sales.length < salesFilter.limit ? '#6c757d' : 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: sales.length < salesFilter.limit ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}
        >
          Siguiente
        </button>
      </div>
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
        Estadísticas de Ventas
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
        </div>
      ) : (
        <div>
          {/* Estadísticas Generales */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)',
              color: 'white',
              padding: '2rem',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {formatCurrency(stats.total_revenue || 0)}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>Ingresos Totales</div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
              color: 'white',
              padding: '2rem',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {stats.total_sales || 0}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>Total de Ventas</div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
              color: 'white',
              padding: '2rem',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {formatCurrency(stats.average_sale || 0)}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>Venta Promedio</div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #6f42c1 0%, #5a3a9a 100%)',
              color: 'white',
              padding: '2rem',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {stats.total_items || 0}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>Items Vendidos</div>
            </div>
          </div>

          {/* Ventas por Método de Pago */}
          {stats.by_payment_method && (
            <div style={{
              background: '#f8f9fa',
              padding: '2rem',
              borderRadius: '12px',
              marginBottom: '2rem'
            }}>
              <h4 style={{
                fontFamily: 'Montserrat, sans-serif',
                color: '#333',
                marginBottom: '1.5rem',
                fontSize: '1.2rem',
                fontWeight: '600'
              }}>
                Ventas por Método de Pago
              </h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {Object.entries(stats.by_payment_method).map(([method, data]) => (
                  <div key={method} style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid #dee2e6'
                  }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: method === 'efectivo' ? '#28a745' : '#007bff',
                      marginBottom: '0.5rem'
                    }}>
                      {formatCurrency(data.total || 0)}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      {data.count || 0} ventas
                    </div>
                    <div style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      background: method === 'efectivo' ? '#d4edda' : '#cce5ff',
                      color: method === 'efectivo' ? '#155724' : '#004085'
                    }}>
                      {method === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Productos Más Vendidos */}
          {stats.top_products && stats.top_products.length > 0 && (
            <div style={{
              background: '#f8f9fa',
              padding: '2rem',
              borderRadius: '12px',
              marginBottom: '2rem'
            }}>
              <h4 style={{
                fontFamily: 'Montserrat, sans-serif',
                color: '#333',
                marginBottom: '1.5rem',
                fontSize: '1.2rem',
                fontWeight: '600'
              }}>
                Productos Más Vendidos
              </h4>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'white' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Producto</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Cantidad Vendida</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.top_products.map((product, index) => (
                      <tr key={index} style={{ background: 'white', borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: '600' }}>{product.name}</div>
                          {product.category && (
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>
                              {product.category}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>
                          {product.total_quantity || 0}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#d4af37' }}>
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
          {stats.recent_sales && stats.recent_sales.length > 0 && (
            <div style={{
              background: '#f8f9fa',
              padding: '2rem',
              borderRadius: '12px'
            }}>
              <h4 style={{
                fontFamily: 'Montserrat, sans-serif',
                color: '#333',
                marginBottom: '1.5rem',
                fontSize: '1.2rem',
                fontWeight: '600'
              }}>
                Ventas Recientes
              </h4>
              
              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                {stats.recent_sales.slice(0, 5).map(sale => (
                  <div key={sale.id} style={{
                    background: 'white',
                    padding: '1rem',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid #dee2e6'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600' }}>
                        {sale.customer_name} {sale.customer_lastname}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        {formatDate(sale.created_at)} • {sale.payment_method === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                      </div>
                    </div>
                    <div style={{
                      fontWeight: '700',
                      color: '#d4af37',
                      fontSize: '1.1rem'
                    }}>
                      {formatCurrency(sale.total_amount)}
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

  // Render principal del componente
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '2rem'
    }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            fontFamily: 'Didot, serif',
            fontSize: '3rem',
            color: '#333',
            marginBottom: '0.5rem',
            fontWeight: '400',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}>
            Gestión de Ventas
          </h1>
          <p style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '1.1rem',
            color: '#666',
            margin: 0
          }}>
            Sistema completo de registro y seguimiento de ventas
          </p>
        </div>

        {/* Mensajes de Estado */}
        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
            color: '#721c24',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            marginBottom: '1rem',
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
            marginBottom: '1rem',
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
      </div>
    </div>
  );
};

export default SalesComponent;