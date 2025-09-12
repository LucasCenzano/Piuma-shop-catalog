// src/AdminPanel.js - Versión completa con edición inline
import React, { useState, useEffect } from 'react';
import authService from './authService';
import { 
  useProductValidation, 
  validateImageUrl, 
  formatUtils, 
  VALID_CATEGORIES,
  errorUtils 
} from './utils/validationUtils';
import './AdminPanel.css';

// Componente para imagen con fallback mejorado
const SafeImage = ({ src, alt, className, style, onError, ...props }) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setImageSrc(src);
    setImageError(false);
    setLoading(true);
  }, [src]);

  const handleImageLoad = () => {
    setLoading(false);
    setImageError(false);
  };

  const handleImageError = (e) => {
    setLoading(false);
    setImageError(true);
    if (onError) onError(e);
  };

  if (!src || imageError) {
    return (
      <div 
        className={className} 
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          border: '2px dashed #dee2e6',
          color: '#6c757d',
          fontSize: style?.width ? (parseInt(style.width) < 100 ? '0.7rem' : '0.9rem') : '0.9rem',
          textAlign: 'center',
          position: 'relative'
        }}
        {...props}
      >
        <div>
          <div style={{ marginBottom: '4px' }}>📷</div>
          <div style={{ fontSize: '0.8em' }}>Sin imagen</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {loading && (
        <div 
          className={className}
          style={{
            ...style,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            color: '#6c757d',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1
          }}
        >
          <div style={{ fontSize: '0.8rem' }}>⏳</div>
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={className}
        style={{
          ...style,
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.3s ease'
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        {...props}
      />
    </div>
  );
};

const AdminPanel = ({ onLogout }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    inStock: true,
    imagesUrl: []
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  
  const newProductValidation = useProductValidation();
  const editProductValidation = useProductValidation();
  const [imageUrlError, setImageUrlError] = useState('');

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

  const getProductImageUrl = (product) => {
    if (!product.images_url || !Array.isArray(product.images_url) || product.images_url.length === 0) {
      return null;
    }
    return product.images_url.find(url => url && url.trim().length > 0) || null;
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value.trim();
    setImageUrl(url);
    setImageUrlError('');

    if (url) {
      const validation = validateImageUrl(url);
      if (!validation.isValid) {
        setImageUrlError(validation.error);
        setPreviewUrl('');
      } else {
        setPreviewUrl(url);
      }
    } else {
      setPreviewUrl('');
    }
  };

  const addImageToProduct = () => {
    if (!imageUrl) {
      setImageUrlError('Ingresa una URL de imagen');
      return;
    }

    const validation = validateImageUrl(imageUrl);
    if (!validation.isValid) {
      setImageUrlError(validation.error);
      return;
    }

    if (editingProduct) {
      const currentImages = editingProduct.imagesUrl || [];
      if (currentImages.includes(imageUrl)) {
        setImageUrlError('Esta imagen ya está agregada');
        return;
      }
      if (currentImages.length >= 10) {
        setImageUrlError('Máximo 10 imágenes por producto');
        return;
      }
      
      setEditingProduct({
        ...editingProduct,
        imagesUrl: [...currentImages, imageUrl]
      });
    } else {
      const currentImages = newProduct.imagesUrl || [];
      if (currentImages.includes(imageUrl)) {
        setImageUrlError('Esta imagen ya está agregada');
        return;
      }
      if (currentImages.length >= 10) {
        setImageUrlError('Máximo 10 imágenes por producto');
        return;
      }
      
      setNewProduct({
        ...newProduct,
        imagesUrl: [...currentImages, imageUrl]
      });
    }
    
    setImageUrl('');
    setPreviewUrl('');
    setImageUrlError('');
  };

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

  const handleNewProductChange = (field, value) => {
    const updatedProduct = { ...newProduct, [field]: value };
    setNewProduct(updatedProduct);
    newProductValidation.validateField(field, value, updatedProduct);
    newProductValidation.markFieldTouched(field);
  };

  const handleEditProductChange = (field, value) => {
    const updatedProduct = { ...editingProduct, [field]: value };
    setEditingProduct(updatedProduct);
    editProductValidation.validateField(field, value, updatedProduct);
    editProductValidation.markFieldTouched(field);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    
    if (!newProductValidation.validateAll(newProduct)) {
      setError('Por favor, corrige los errores en el formulario');
      return;
    }

    try {
      setLoading(true);
      const productToCreate = {
        ...newProduct,
        price: formatUtils.formatPrice(newProduct.price)
      };
      
      await authService.createProduct(productToCreate);
      
      setNewProduct({
        name: '',
        price: '',
        category: '',
        description: '',
        inStock: true,
        imagesUrl: []
      });
      setShowAddForm(false);
      setImageUrl('');
      setPreviewUrl('');
      newProductValidation.clearErrors();
      
      await loadProducts();
      alert('Producto creado exitosamente');
    } catch (error) {
      console.error('Error creando producto:', error);
      setError(`Error creando producto: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    
    if (!editingProduct) return;

    if (!editProductValidation.validateAll(editingProduct)) {
      setError('Por favor, corrige los errores en el formulario');
      return;
    }

    try {
      setLoading(true);
      const productToUpdate = {
        ...editingProduct,
        price: formatUtils.formatPrice(editingProduct.price)
      };
      
      await authService.updateProduct(productToUpdate);
      
      setEditingProductId(null);
      setEditingProduct(null);
      setImageUrl('');
      setPreviewUrl('');
      editProductValidation.clearErrors();
      
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
      const updatedProduct = {
        id: product.id,
        inStock: !product.in_stock
      };
      
      await authService.updateProduct(updatedProduct);
      await loadProducts();
    } catch (error) {
      console.error('Error actualizando stock:', error);
      setError(`Error actualizando stock: ${error.message}`);
    }
  };

  const startEditing = (product) => {
    setEditingProductId(product.id);
    setEditingProduct({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description || '',
      inStock: product.in_stock,
      imagesUrl: Array.isArray(product.images_url) ? product.images_url : []
    });
    setImageUrl('');
    setPreviewUrl('');
    editProductValidation.clearErrors();
  };

  const cancelEditing = () => {
    setEditingProductId(null);
    setEditingProduct(null);
    setImageUrl('');
    setPreviewUrl('');
    editProductValidation.clearErrors();
  };

  const handleLogout = () => {
    authService.logout();
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  // Componente de formulario inline para edición
  const InlineEditForm = ({ product }) => (
    <tr className="inline-edit-row">
      <td colSpan="8">
        <div className="inline-edit-form">
          <h4>Editando: {product.name}</h4>
          <form onSubmit={handleUpdateProduct}>
            <div className="edit-form-grid">
              <div className="edit-form-section">
                <h5>Información básica</h5>
                <div className="form-row">
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => handleEditProductChange('name', e.target.value)}
                    placeholder="Nombre del producto"
                    required
                    style={{ flex: 1 }}
                  />
                  <input
                    type="text"
                    value={editingProduct.price}
                    onChange={(e) => handleEditProductChange('price', e.target.value)}
                    placeholder="Precio (ej: $25.000)"
                    style={{ flex: 1 }}
                  />
                </div>
                <div className="form-row">
                  <select
                    value={editingProduct.category}
                    onChange={(e) => handleEditProductChange('category', e.target.value)}
                    required
                    style={{ flex: 1 }}
                  >
                    <option value="">Seleccionar categoría</option>
                    {VALID_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editingProduct.inStock}
                      onChange={(e) => handleEditProductChange('inStock', e.target.checked)}
                    />
                    En Stock
                  </label>
                </div>
                <div className="form-row">
                  <textarea
                    value={editingProduct.description}
                    onChange={(e) => handleEditProductChange('description', e.target.value)}
                    placeholder="Descripción del producto"
                    rows={3}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="edit-form-section">
                <h5>Gestión de imágenes</h5>
                <div className="form-row">
                  <div style={{ flex: 1 }}>
                    <input
                      type="url"
                      placeholder="URL de la imagen (ej: https://...)"
                      value={imageUrl}
                      onChange={handleImageUrlChange}
                      style={{
                        width: '100%',
                        padding: '1rem 1.25rem',
                        border: `2px solid ${imageUrlError ? '#dc3545' : 'rgba(230, 227, 212, 0.6)'}`,
                        borderRadius: 'var(--border-radius)',
                        fontSize: '0.95rem',
                        background: 'white',
                        transition: 'var(--transition)',
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.04)',
                        boxSizing: 'border-box'
                      }}
                    />
                    {imageUrlError && (
                      <div style={{ 
                        color: '#dc3545', 
                        fontSize: '0.8rem', 
                        marginTop: '0.25rem',
                        paddingLeft: '0.25rem'
                      }}>
                        {imageUrlError}
                      </div>
                    )}
                  </div>
                  <button 
                    type="button" 
                    onClick={addImageToProduct} 
                    className="add-image-btn"
                    disabled={!imageUrl || !!imageUrlError}
                  >
                    Agregar
                  </button>
                </div>
                
                {previewUrl && (
                  <div className="image-preview">
                    <p>Vista previa:</p>
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="preview-image"
                      onError={() => {
                        setPreviewUrl('');
                        setImageUrlError('No se pudo cargar la imagen. Verifica la URL.');
                      }}
                    />
                  </div>
                )}
                
                {editingProduct.imagesUrl && editingProduct.imagesUrl.length > 0 && (
                  <div className="current-images">
                    <p>Imágenes actuales ({editingProduct.imagesUrl.length}/10):</p>
                    <div className="images-grid">
                      {editingProduct.imagesUrl.map((url, index) => (
                        <div key={index} className="image-item">
                          <img 
                            src={url} 
                            alt={`Imagen ${index + 1}`}
                            className="thumbnail"
                            onError={(e) => {
                              e.target.style.border = '2px solid #dc3545';
                              e.target.title = 'Error cargando imagen';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index, true)}
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
              <button 
                type="submit" 
                disabled={loading || editProductValidation.hasErrors} 
                className="save-btn"
              >
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
                newProductValidation.clearErrors();
                setNewProduct({
                  name: '',
                  price: '',
                  category: '',
                  description: '',
                  inStock: true,
                  imagesUrl: []
                });
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

      {/* Guía para imágenes */}
      {showAddForm && (
        <div style={{
          background: 'linear-gradient(135deg, #e8f4fd 0%, #f0f8ff 100%)',
          padding: '1.5rem',
          margin: '1rem 2.5rem',
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#1e40af', fontFamily: 'Didot, serif' }}>
            💡 ¿Dónde conseguir URLs de imágenes?
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <strong>📸 Imgur (Recomendado)</strong><br/>
              <small>1. Ve a imgur.com<br/>2. Sube tu imagen<br/>3. Copia "Direct Link"</small>
            </div>
            <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <strong>☁️ Cloudinary</strong><br/>
              <small>1. Regístrate gratis<br/>2. Sube imagen<br/>3. Copia URL optimizada</small>
            </div>
            <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <strong>🖼️ ImgBB</strong><br/>
              <small>1. Ve a imgbb.com<br/>2. Sube sin registro<br/>3. Copia "Direct link"</small>
            </div>
          </div>
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
                            {formatUtils.truncateText(product.description, 50)}
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
                    {editingProductId === product.id && editingProduct && (
                      <InlineEditForm product={product} />
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