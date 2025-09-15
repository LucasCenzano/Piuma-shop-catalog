// src/AdminPanel.js - Versión CORREGIDA y optimizada
import React, { useState, useEffect } from 'react';
import authService from './authService';
import './AdminPanel.css';

// Categorías válidas
const VALID_CATEGORIES = [
  'Bandoleras', 
  'Carteras', 
  'Billeteras', 
  'Mochilas', 
  'Riñoneras', 
  'Porta Celulares'
];

// Componente simple para imagen
const SafeImage = ({ src, alt, style, ...props }) => {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div 
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          border: '2px dashed #dee2e6',
          color: '#6c757d',
          fontSize: '0.8rem',
          textAlign: 'center'
        }}
        {...props}
      >
        📷 Sin imagen
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      style={style}
      onError={() => setImageError(true)}
      {...props}
    />
  );
};

// ✅ COMPONENTE INLINE EDIT FORM DEFINIDO FUERA PARA OPTIMIZACIÓN
const InlineEditForm = ({ 
  product, 
  editName,
  editPrice,
  editCategory,
  editDescription,
  editInStock,
  editImages,
  editImageUrl,
  setEditName,
  setEditPrice,
  setEditCategory,
  setEditDescription,
  setEditInStock,
  setEditImageUrl,
  handleUpdateProduct, 
  cancelEditing, 
  loading,
  addEditImage,
  removeEditImage
}) => (
  <tr className="inline-edit-row">
    <td colSpan="8">
      <div className="inline-edit-form">
        <h4>Editando: {product.name}</h4>
        <form onSubmit={handleUpdateProduct}>
          <div className="edit-form-grid">
            <div className="edit-form-section">
              <h5>Información básica</h5>
              <div className="form-row">
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nombre del producto"
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1, marginLeft: '1rem' }}>
                  <input
                    type="text"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="Precio (ej: $25.000)"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div className="form-row">
                <div style={{ flex: 1 }}>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  >
                    <option value="">Seleccionar categoría</option>
                    {VALID_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <label className="checkbox-label" style={{ marginLeft: '1rem' }}>
                  <input
                    type="checkbox"
                    checked={editInStock}
                    onChange={(e) => setEditInStock(e.target.checked)}
                  />
                  En Stock
                </label>
              </div>
              <div className="form-row">
                <div style={{ width: '100%' }}>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Descripción del producto"
                    rows={3}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            <div className="edit-form-section">
              <h5>Gestión de imágenes</h5>
              <div className="form-row">
                <div style={{ flex: 1 }}>
                  <input
                    type="url"
                    placeholder="URL de la imagen (ej: https://...)"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <button 
                  type="button" 
                  onClick={addEditImage} 
                  className="add-image-btn"
                  disabled={!editImageUrl}
                >
                  Agregar
                </button>
              </div>
              
              {editImages.length > 0 && (
                <div className="current-images">
                  <p>Imágenes actuales ({editImages.length}/10):</p>
                  <div className="images-grid">
                    {editImages.map((url, index) => (
                      <div key={index} className="image-item">
                        <SafeImage 
                          src={url} 
                          alt={`Imagen ${index + 1}`}
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeEditImage(index)}
                          className="remove-image-btn"
                          title={`Eliminar imagen ${index + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="inline-form-actions">
            <button type="submit" disabled={loading} className="save-btn">
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button type="button" onClick={cancelEditing} className="cancel-btn">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </td>
  </tr>
);

// ✅ COMPONENTE PRINCIPAL AdminPanel
const AdminPanel = ({ onLogout }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // ✅ Estados separados para nuevo producto
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newInStock, setNewInStock] = useState(true);
  const [newImages, setNewImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // ✅ Estados separados para edición
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editInStock, setEditInStock] = useState(true);
  const [editImages, setEditImages] = useState([]);
  const [editImageUrl, setEditImageUrl] = useState('');

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
      const productsData = await authService.getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error cargando productos:', error);
      setError(`Error cargando productos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getProductImageUrl = (product) => {
    if (!product.images_url || !Array.isArray(product.images_url) || product.images_url.length === 0) {
      return null;
    }
    return product.images_url.find(url => url && url.trim().length > 0) || null;
  };

  // ✅ Funciones para agregar imágenes (nuevo producto)
  const addNewImage = () => {
    if (newImageUrl.trim()) {
      setNewImages([...newImages, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const removeNewImage = (index) => {
    const updated = newImages.filter((_, i) => i !== index);
    setNewImages(updated);
  };

  // ✅ Funciones para agregar imágenes (edición)
  const addEditImage = () => {
    if (editImageUrl.trim()) {
      setEditImages([...editImages, editImageUrl.trim()]);
      setEditImageUrl('');
    }
  };

  const removeEditImage = (index) => {
    const updated = editImages.filter((_, i) => i !== index);
    setEditImages(updated);
  };

  // ✅ Crear producto
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    
    if (!newName.trim()) {
      alert('El nombre es requerido');
      return;
    }
    
    if (!newCategory) {
      alert('La categoría es requerida');
      return;
    }

    try {
      setLoading(true);
      
      await authService.createProduct({
        name: newName.trim(),
        price: newPrice.trim(),
        category: newCategory,
        description: newDescription.trim(),
        inStock: newInStock,
        imagesUrl: newImages
      });
      
      // Limpiar formulario
      setNewName('');
      setNewPrice('');
      setNewCategory('');
      setNewDescription('');
      setNewInStock(true);
      setNewImages([]);
      setNewImageUrl('');
      setShowAddForm(false);
      
      await loadProducts();
      alert('Producto creado exitosamente');
    } catch (error) {
      console.error('Error creando producto:', error);
      setError(`Error creando producto: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Actualizar producto
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    
    if (!editName.trim()) {
      alert('El nombre es requerido');
      return;
    }
    
    if (!editCategory) {
      alert('La categoría es requerida');
      return;
    }

    try {
      setLoading(true);
      
      await authService.updateProduct({
        id: editingProductId,
        name: editName.trim(),
        price: editPrice.trim(),
        category: editCategory,
        description: editDescription.trim(),
        inStock: editInStock,
        imagesUrl: editImages
      });
      
      cancelEditing();
      await loadProducts();
      alert('Producto actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando producto:', error);
      setError(`Error actualizando producto: ${error.message}`);
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
      setError(`Error eliminando producto: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStock = async (product) => {
    try {
      await authService.updateProduct({
        id: product.id,
        inStock: !product.in_stock
      });
      await loadProducts();
    } catch (error) {
      console.error('Error actualizando stock:', error);
      setError(`Error actualizando stock: ${error.message}`);
    }
  };

  const startEditing = (product) => {
    setEditingProductId(product.id);
    setEditName(product.name || '');
    setEditPrice(String(product.price || ''));
    setEditCategory(product.category || '');
    setEditDescription(product.description || '');
    setEditInStock(product.in_stock);
    setEditImages(Array.isArray(product.images_url) ? product.images_url : []);
    setEditImageUrl('');
  };

  const cancelEditing = () => {
    setEditingProductId(null);
    setEditName('');
    setEditPrice('');
    setEditCategory('');
    setEditDescription('');
    setEditInStock(true);
    setEditImages([]);
    setEditImageUrl('');
  };

  const handleLogout = () => {
    authService.logout();
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

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
            onClick={() => {
              setShowAddForm(!showAddForm);
              if (showAddForm) {
                // Limpiar formulario al cerrar
                setNewName('');
                setNewPrice('');
                setNewCategory('');
                setNewDescription('');
                setNewInStock(true);
                setNewImages([]);
                setNewImageUrl('');
              }
            }}
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
          <button onClick={() => setError(null)}>Cerrar</button>
        </div>
      )}

      {/* ✅ Formulario de agregar producto */}
      {showAddForm && (
        <div className="product-form">
          <h3>Agregar Nuevo Producto</h3>
          <form onSubmit={handleCreateProduct}>
            <div className="form-row">
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="Nombre del producto"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>
              <div style={{ flex: 1, marginLeft: '1rem' }}>
                <input
                  type="text"
                  placeholder="Precio (ej: $25.000)"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div style={{ flex: 1 }}>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {VALID_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <label style={{ marginLeft: '1rem' }}>
                <input
                  type="checkbox"
                  checked={newInStock}
                  onChange={(e) => setNewInStock(e.target.checked)}
                />
                En Stock
              </label>
            </div>
            
            <div className="form-row">
              <div style={{ width: '100%' }}>
                <textarea
                  placeholder="Descripción del producto"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Sección de imágenes */}
            <div className="image-section">
              <h4>Agregar Imágenes</h4>
              <div className="form-row">
                <input
                  type="url"
                  placeholder="URL de la imagen (ej: https://...)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                />
                <button type="button" onClick={addNewImage} className="add-image-btn">
                  Agregar
                </button>
              </div>
              
              {newImages.length > 0 && (
                <div className="current-images">
                  <p>Imágenes agregadas ({newImages.length}/10):</p>
                  <div className="images-grid">
                    {newImages.map((url, index) => (
                      <div key={index} className="image-item">
                        <SafeImage 
                          src={url} 
                          alt={`Imagen ${index + 1}`}
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="remove-image-btn"
                          title={`Eliminar imagen ${index + 1}`}
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
              <button type="button" onClick={() => setShowAddForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de productos */}
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
                  <th>Descripción</th>
                  <th>Precio</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <React.Fragment key={product.id}>
                    <tr className={editingProductId === product.id ? 'editing-row' : ''}>
                      <td>{product.id}</td>
                      <td>
                        <SafeImage 
                          src={getProductImageUrl(product)}
                          alt={product.name}
                          style={{ 
                            width: '60px', 
                            height: '60px', 
                            objectFit: 'cover',
                            borderRadius: '8px'
                          }}
                        />
                      </td>
                      <td>
                        <strong>{product.name}</strong>
                        {(!product.images_url || product.images_url.length === 0) && (
                          <div style={{ fontSize: '0.7rem', color: '#e67e22', marginTop: '2px' }}>
                            ⚠️ Sin imágenes
                          </div>
                        )}
                      </td>
                      <td style={{ 
                        maxWidth: '200px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {product.description ? (
                          <span title={product.description}>
                            {product.description.length > 50 ? product.description.substring(0, 50) + '...' : product.description}
                          </span>
                        ) : (
                          <span style={{ color: '#999', fontStyle: 'italic' }}>Sin descripción</span>
                        )}
                      </td>
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
                            onClick={() => editingProductId === product.id ? cancelEditing() : startEditing(product)}
                            className={`btn-edit ${editingProductId === product.id ? 'editing' : ''}`}
                            disabled={loading}
                          >
                            {editingProductId === product.id ? '❌ Cancelar' : '✏️ Editar'}
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="btn-delete"
                            disabled={loading || editingProductId === product.id}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* ✅ Formulario de edición inline optimizado */}
                    {editingProductId === product.id && (
                      <InlineEditForm 
                        product={product}
                        editName={editName}
                        editPrice={editPrice}
                        editCategory={editCategory}
                        editDescription={editDescription}
                        editInStock={editInStock}
                        editImages={editImages}
                        editImageUrl={editImageUrl}
                        setEditName={setEditName}
                        setEditPrice={setEditPrice}
                        setEditCategory={setEditCategory}
                        setEditDescription={setEditDescription}
                        setEditInStock={setEditInStock}
                        setEditImageUrl={setEditImageUrl}
                        handleUpdateProduct={handleUpdateProduct}
                        cancelEditing={cancelEditing}
                        loading={loading}
                        addEditImage={addEditImage}
                        removeEditImage={removeEditImage}
                      />
                    )}
                  </React.Fragment>
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