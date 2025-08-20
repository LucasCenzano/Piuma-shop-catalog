// src/AdminPanel.js - Panel completo de administración
import React, { useState, useEffect } from 'react';
import authService from './authService';

function AdminPanel({ onLogout }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState(null);

  const categories = ['Bandoleras', 'Carteras', 'Billeteras', 'Riñoneras', 'Mochilas', 'Porta Celulares'];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authService.getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Error cargando productos:', err);
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const toggleStock = async (productId, currentStock) => {
    try {
      setUpdating(productId);
      await authService.updateProduct({ id: productId, inStock: !currentStock });
      setProducts(products.map(p => 
        p.id === productId ? { ...p, in_stock: !currentStock } : p
      ));
    } catch (error) {
      console.error('Error actualizando stock:', error);
      setError('Error al actualizar el stock');
    } finally {
      setUpdating(null);
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    try {
      setUpdating(productId);
      await authService.deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error eliminando producto:', error);
      setError('Error al eliminar el producto');
    } finally {
      setUpdating(null);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'in_stock' && product.in_stock) ||
      (filter === 'out_of_stock' && !product.in_stock);
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: products.length,
    inStock: products.filter(p => p.in_stock).length,
    outOfStock: products.filter(p => !p.in_stock).length
  };

  const currentUser = authService.getCurrentUser();

  if (loading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif' 
      }}>
        Cargando panel de administración...
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '1400px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ color: '#333', margin: '0 0 0.5rem' }}>
            Panel de Administración - Piuma
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            Bienvenido, {currentUser?.username || 'Admin'}
          </p>
        </div>
        <button
          onClick={onLogout}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Estadísticas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem', color: '#333' }}>Total Productos</h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', color: '#007bff' }}>
            {stats.total}
          </p>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '2px solid #d4edda'
        }}>
          <h3 style={{ margin: '0 0 0.5rem', color: '#333' }}>En Stock</h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', color: '#28a745' }}>
            {stats.inStock}
          </p>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '2px solid #f8d7da'
        }}>
          <h3 style={{ margin: '0 0 0.5rem', color: '#333' }}>Sin Stock</h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', color: '#dc3545' }}>
            {stats.outOfStock}
          </p>
        </div>
      </div>

      {/* Controles */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.75rem',
              border: '2px solid #e1e1e1',
              borderRadius: '8px',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '2px solid #e1e1e1',
              borderRadius: '8px',
              backgroundColor: 'white',
              fontSize: '1rem',
              outline: 'none'
            }}
          >
            <option value="all">Todos los productos</option>
            <option value="in_stock">Solo en stock</option>
            <option value="out_of_stock">Solo sin stock</option>
          </select>
          
          <button
            onClick={loadProducts}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Actualizar
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            + Nuevo Producto
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '1rem',
          marginBottom: '2rem',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          {error}
          <button 
            onClick={() => setError(null)}
            style={{ 
              marginLeft: '1rem', 
              padding: '0.25rem 0.5rem',
              backgroundColor: 'transparent',
              border: '1px solid #721c24',
              borderRadius: '4px',
              color: '#721c24',
              cursor: 'pointer'
            }}
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Lista de productos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '1.5rem'
      }}>
        {filteredProducts.map(product => (
          <div
            key={product.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `2px solid ${product.in_stock ? '#d4edda' : '#f8d7da'}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 0.5rem', color: '#333', fontSize: '1.25rem' }}>
                  {product.name}
                </h4>
                <p style={{ margin: '0 0 0.5rem', color: '#666', fontSize: '0.9rem' }}>
                  <strong>Categoría:</strong> {product.category}
                </p>
                <p style={{ margin: '0 0 0.5rem', fontWeight: 'bold', color: '#333', fontSize: '1.1rem' }}>
                  <strong>Precio:</strong> {product.price || 'No definido'}
                </p>
                <p style={{ margin: '0 0 1rem', color: '#666', fontSize: '0.85rem' }}>
                  <strong>ID:</strong> {product.id}
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: product.in_stock ? '#28a745' : '#dc3545',
                marginRight: '0.5rem'
              }}></span>
              <span style={{ color: product.in_stock ? '#28a745' : '#dc3545', fontWeight: '500' }}>
                {product.in_stock ? 'En Stock' : 'Sin Stock'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => toggleStock(product.id, product.in_stock)}
                disabled={updating === product.id}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  backgroundColor: product.in_stock ? '#ffc107' : '#28a745',
                  color: product.in_stock ? '#000' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: updating === product.id ? 'not-allowed' : 'pointer',
                  opacity: updating === product.id ? 0.7 : 1,
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                {updating === product.id ? 'Actualizando...' : 
                 (product.in_stock ? 'Quitar Stock' : 'Agregar Stock')}
              </button>
              
              <button
                onClick={() => setEditingProduct(product)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                Editar
              </button>
              
              <button
                onClick={() => deleteProduct(product.id)}
                disabled={updating === product.id}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: updating === product.id ? 'not-allowed' : 'pointer',
                  opacity: updating === product.id ? 0.7 : 1,
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && !loading && (
        <div style={{
          backgroundColor: 'white',
          textAlign: 'center',
          padding: '3rem',
          borderRadius: '12px',
          color: '#666',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '1.2rem', margin: 0 }}>
            No se encontraron productos que coincidan con los filtros.
          </p>
        </div>
      )}

      {/* Modales */}
      {showCreateModal && (
        <ProductModal
          product={null}
          categories={categories}
          onSave={async (productData) => {
            try {
              await authService.createProduct(productData);
              setShowCreateModal(false);
              loadProducts();
            } catch (error) {
              setError('Error al crear el producto');
            }
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {editingProduct && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onSave={async (productData) => {
            try {
              await authService.updateProduct({ ...productData, id: editingProduct.id });
              setEditingProduct(null);
              loadProducts();
            } catch (error) {
              setError('Error al actualizar el producto');
            }
          }}
          onCancel={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
}

// Componente Modal para crear/editar productos
function ProductModal({ product, categories, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    price: product?.price || '',
    category: product?.category || categories[0],
    inStock: product?.in_stock !== undefined ? product.in_stock : true,
    imagesUrl: product?.images_url || []
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ marginTop: 0, color: '#333' }}>
          {product ? 'Editar Producto' : 'Nuevo Producto'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Nombre del Producto *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e1e1e1',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Precio
            </label>
            <input
              type="text"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Ej: $25.000"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e1e1e1',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Categoría *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e1e1e1',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: 'white',
                boxSizing: 'border-box'
              }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', fontWeight: '500' }}>
              <input
                type="checkbox"
                name="inStock"
                checked={formData.inStock}
                onChange={handleChange}
                style={{ marginRight: '0.5rem' }}
              />
              Producto en stock
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={loading || !formData.name}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: loading ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminPanel;