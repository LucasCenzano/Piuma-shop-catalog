// AdminPanel.js - Panel de administración con soporte para imágenes
import React, { useState, useEffect } from 'react';
import authService from './authService';
import './AdminPanel.css';

const AdminPanel = ({ onLogout }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    inStock: true,
    imagesUrl: []
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  // Cargar productos al montar
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      setError('No tienes permisos para acceder a esta página');
      setLoading(false);
      return;
    }
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Cargando productos...');
      const productsData = await authService.getProducts();
      setProducts(productsData);
      console.log('Productos cargados exitosamente');
    } catch (error) {
      console.error('Error cargando productos:', error);
      
      if (error.message.includes('Sesión expirada') || error.message.includes('No autorizado')) {
        setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else {
        setError(`Error cargando productos: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Manejar URL de imagen
  const handleImageUrlChange = (e) => {
    const url = e.target.value.trim();
    setImageUrl(url);

  // Si es URL absoluta o relativa a /assets/, mostrar preview
    if (
      url &&
      (url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('/assets/'))
    ) {
      setPreviewUrl(url);
    } else {
      setPreviewUrl('');
    }
  };  


  // Agregar imagen a la lista
  const addImageToProduct = () => {
    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      if (editingProduct) {
        setEditingProduct({
          ...editingProduct,
          imagesUrl: [...(editingProduct.imagesUrl || []), imageUrl]
        });
      } else {
        setNewProduct({
          ...newProduct,
          imagesUrl: [...newProduct.imagesUrl, imageUrl]
        });
      }
      setImageUrl('');
      setPreviewUrl('');
    } else {
      alert('Por favor ingresa una URL válida (debe empezar con http:// o https://)');
    }
  };

  // Eliminar imagen de la lista
  const removeImage = (index, isEditing = false) => {
    if (isEditing && editingProduct) {
      const newImages = [...(editingProduct.imagesUrl || [])];
      newImages.splice(index, 1);
      setEditingProduct({
        ...editingProduct,
        imagesUrl: newImages
      });
    } else {
      const newImages = [...newProduct.imagesUrl];
      newImages.splice(index, 1);
      setNewProduct({
        ...newProduct,
        imagesUrl: newImages
      });
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    
    if (!newProduct.name || !newProduct.category) {
      alert('Nombre y categoría son requeridos');
      return;
    }

    try {
      setLoading(true);
      await authService.createProduct(newProduct);
      
      // Limpiar formulario
      setNewProduct({
        name: '',
        price: '',
        category: '',
        inStock: true,
        imagesUrl: []
      });
      setShowAddForm(false);
      setImageUrl('');
      setPreviewUrl('');
      
      // Recargar productos
      await loadProducts();
      alert('Producto creado exitosamente');
    } catch (error) {
      console.error('Error creando producto:', error);
      alert(`Error creando producto: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    
    if (!editingProduct) return;

    try {
      setLoading(true);
      await authService.updateProduct(editingProduct);
      
      setEditingProduct(null);
      setImageUrl('');
      setPreviewUrl('');
      await loadProducts();
      alert('Producto actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando producto:', error);
      alert(`Error actualizando producto: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    try {
      setLoading(true);
      await authService.deleteProduct(productId);
      await loadProducts();
      alert('Producto eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando producto:', error);
      alert(`Error eliminando producto: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStock = async (product) => {
    try {
      const updatedProduct = {
        id: product.id,
        inStock: !product.in_stock
      };
      
      await authService.updateProduct(updatedProduct);
      await loadProducts();
    } catch (error) {
      console.error('Error actualizando stock:', error);
      alert(`Error actualizando stock: ${error.message}`);
    }
  };

  const startEditing = (product) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      inStock: product.in_stock,
      imagesUrl: Array.isArray(product.images_url) ? product.images_url : []
    });
    setImageUrl('');
    setPreviewUrl('');
  };

  const handleLogout = () => {
    authService.logout();
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  // Estados de carga y error
  if (error && error.includes('No tienes permisos')) {
    return (
      <div className="admin-panel">
        <div className="error-container">
          <h2>Acceso Denegado</h2>
          <p>{error}</p>
          <button onClick={() => window.location.href = '/admin'}>
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  if (loading && products.length === 0) {
    return (
      <div className="admin-panel">
        <div className="loading">
          <h2>Cargando panel de administración...</h2>
          <p>Obteniendo productos de la base de datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>Panel de Administración - Piuma</h1>
        <div className="admin-actions">
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary"
          >
            {showAddForm ? 'Cancelar' : 'Agregar Producto'}
          </button>
          <button onClick={handleLogout} className="btn-secondary">
            Cerrar Sesión
          </button>
        </div>
      </header>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadProducts}>Reintentar</button>
        </div>
      )}

      {/* Formulario para agregar producto */}
      {showAddForm && (
        <div className="product-form">
          <h3>Agregar Nuevo Producto</h3>
          <form onSubmit={handleCreateProduct}>
            <div className="form-row">
              <input
                type="text"
                placeholder="Nombre del producto"
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Precio (ej: $25.000)"
                value={newProduct.price}
                onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
              />
            </div>
            <div className="form-row">
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                required
              >
                <option value="">Seleccionar categoría</option>
                <option value="Bandoleras">Bandoleras</option>
                <option value="Carteras">Carteras</option>
                <option value="Billeteras">Billeteras</option>
                <option value="Mochilas">Mochilas</option>
                <option value="Riñoneras">Riñoneras</option>
                <option value="Porta Celulares">Porta Celulares</option>
              </select>
              <label>
                <input
                  type="checkbox"
                  checked={newProduct.inStock}
                  onChange={(e) => setNewProduct({...newProduct, inStock: e.target.checked})}
                />
                En Stock
              </label>
            </div>
            
            {/* Sección de imágenes */}
            <div className="image-section" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <h4>Imágenes del producto</h4>
              <div className="form-row">
                <input
                  type="url"
                  placeholder="URL de la imagen (ej: https://...)"
                  value={imageUrl}
                  onChange={handleImageUrlChange}
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={addImageToProduct} style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>
                  Agregar Imagen
                </button>
              </div>
              
              {/* Preview de la imagen */}
              {previewUrl && (
                <div style={{ marginTop: '1rem' }}>
                  <p>Vista previa:</p>
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px' }}
                    onError={() => {
                      setPreviewUrl('');
                      alert('No se pudo cargar la imagen. Verifica la URL.');
                    }}
                  />
                </div>
              )}
              
              {/* Lista de imágenes agregadas */}
              {newProduct.imagesUrl.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <p>Imágenes agregadas:</p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {newProduct.imagesUrl.map((url, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <img 
                          src={url} 
                          alt={`Imagen ${index + 1}`}
                          style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            backgroundColor: 'red',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Creando...' : 'Crear Producto'}
              </button>
              <button type="button" onClick={() => {
                setShowAddForm(false);
                setImageUrl('');
                setPreviewUrl('');
              }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Formulario de edición (similar al de agregar) */}
      {editingProduct && (
        <div className="product-form editing">
          <h3>Editar Producto</h3>
          <form onSubmit={handleUpdateProduct}>
            <div className="form-row">
              <input
                type="text"
                placeholder="Nombre del producto"
                value={editingProduct.name}
                onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Precio (ej: $25.000)"
                value={editingProduct.price}
                onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
              />
            </div>
            <div className="form-row">
              <select
                value={editingProduct.category}
                onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                required
              >
                <option value="Bandoleras">Bandoleras</option>
                <option value="Carteras">Carteras</option>
                <option value="Billeteras">Billeteras</option>
                <option value="Mochilas">Mochilas</option>
                <option value="Riñoneras">Riñoneras</option>
                <option value="Porta Celulares">Porta Celulares</option>
              </select>
              <label>
                <input
                  type="checkbox"
                  checked={editingProduct.inStock}
                  onChange={(e) => setEditingProduct({...editingProduct, inStock: e.target.checked})}
                />
                En Stock
              </label>
            </div>
            
            {/* Sección de imágenes para edición */}
            <div className="image-section" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <h4>Imágenes del producto</h4>
              <div className="form-row">
                <input
                  type="url"
                  placeholder="URL de la imagen (ej: https://...)"
                  value={imageUrl}
                  onChange={handleImageUrlChange}
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={addImageToProduct} style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>
                  Agregar Imagen
                </button>
              </div>
              
              {previewUrl && (
                <div style={{ marginTop: '1rem' }}>
                  <p>Vista previa:</p>
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px' }}
                    onError={() => {
                      setPreviewUrl('');
                      alert('No se pudo cargar la imagen. Verifica la URL.');
                    }}
                  />
                </div>
              )}
              
              {editingProduct.imagesUrl && editingProduct.imagesUrl.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <p>Imágenes actuales:</p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {editingProduct.imagesUrl.map((url, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <img 
                          src={url} 
                          alt={`Imagen ${index + 1}`}
                          style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index, true)}
                          style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            backgroundColor: 'red',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Actualizando...' : 'Actualizar'}
              </button>
              <button type="button" onClick={() => {
                setEditingProduct(null);
                setImageUrl('');
                setPreviewUrl('');
              }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de productos con miniaturas de imágenes */}
      <div className="products-section">
        <h2>Productos ({products.length})</h2>
        
        {products.length === 0 ? (
          <div className="no-products">
            <p>No hay productos cargados</p>
            <button onClick={loadProducts}>Recargar</button>
          </div>
        ) : (
          <div className="products-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>
                      {product.images_url && product.images_url.length > 0 ? (
                        <img 
                          src={product.images_url[0]} 
                          alt={product.name}
                          style={{ 
                            width: '50px', 
                            height: '50px', 
                            objectFit: 'cover', 
                            borderRadius: '4px' 
                          }}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/50x50?text=Sin+imagen';
                          }}
                        />
                      ) : (
                        <div style={{ 
                          width: '50px', 
                          height: '50px', 
                          backgroundColor: '#f0f0f0', 
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: '#999'
                        }}>
                          Sin imagen
                        </div>
                      )}
                    </td>
                    <td>{product.name}</td>
                    <td>{product.price}</td>
                    <td>{product.category}</td>
                    <td>
                      <button
                        className={`stock-toggle ${product.in_stock ? 'in-stock' : 'out-stock'}`}
                        onClick={() => handleToggleStock(product)}
                        disabled={loading}
                      >
                        {product.in_stock ? '✅ En Stock' : '❌ Sin Stock'}
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => startEditing(product)}
                          className="btn-edit"
                          disabled={loading}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="btn-delete"
                          disabled={loading}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {loading && products.length > 0 && (
        <div className="loading-overlay">
          <p>Procesando...</p>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;