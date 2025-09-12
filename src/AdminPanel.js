// AdminPanel.js - Panel de administración mejorado con validaciones
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
  
  // Estados para validación
  const newProductValidation = useProductValidation();
  const editProductValidation = useProductValidation();
  const [imageUrlError, setImageUrlError] = useState('');

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

  // Manejar cambios en URL de imagen con validación
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

  // Agregar imagen con validación
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

  // Eliminar imagen
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

  // Manejar cambios en formulario nuevo producto
  const handleNewProductChange = (field, value) => {
    const updatedProduct = { ...newProduct, [field]: value };
    setNewProduct(updatedProduct);
    
    // Validar campo en tiempo real
    newProductValidation.validateField(field, value, updatedProduct);
    newProductValidation.markFieldTouched(field);
  };

  // Manejar cambios en formulario de edición
  const handleEditProductChange = (field, value) => {
    const updatedProduct = { ...editingProduct, [field]: value };
    setEditingProduct(updatedProduct);
    
    // Validar campo en tiempo real
    editProductValidation.validateField(field, value, updatedProduct);
    editProductValidation.markFieldTouched(field);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    
    // Validar todo el formulario
    if (!newProductValidation.validateAll(newProduct)) {
      setError('Por favor, corrige los errores en el formulario');
      return;
    }

    try {
      setLoading(true);
      
      // Formatear precio antes de enviar
      const productToCreate = {
        ...newProduct,
        price: formatUtils.formatPrice(newProduct.price)
      };
      
      await authService.createProduct(productToCreate);
      
      // Limpiar formulario
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
      
      // Recargar productos
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

    // Validar todo el formulario
    if (!editProductValidation.validateAll(editingProduct)) {
      setError('Por favor, corrige los errores en el formulario');
      return;
    }

    try {
      setLoading(true);
      
      // Formatear precio antes de enviar
      const productToUpdate = {
        ...editingProduct,
        price: formatUtils.formatPrice(editingProduct.price)
      };
      
      await authService.updateProduct(productToUpdate);
      
      // Limpiar estado de edición
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

  // Componente de campo con validación
  const ValidatedInput = ({ 
    type = "text", 
    value, 
    onChange, 
    placeholder, 
    required = false, 
    validation, 
    fieldName,
    ...props 
  }) => {
    const hasError = validation.hasFieldError(fieldName);
    const error = validation.getFieldError(fieldName);

    return (
      <div style={{ flex: 1 }}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(fieldName, e.target.value)}
          placeholder={placeholder}
          required={required}
          onBlur={() => validation.markFieldTouched(fieldName)}
          style={{
            width: '100%',
            padding: '1rem 1.25rem',
            border: `2px solid ${hasError ? '#dc3545' : 'rgba(230, 227, 212, 0.6)'}`,
            borderRadius: 'var(--border-radius)',
            fontSize: '0.95rem',
            minWidth: '220px',
            background: 'white',
            transition: 'var(--transition)',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.04)',
            boxSizing: 'border-box'
          }}
          {...props}
        />
        {hasError && (
          <div style={{ 
            color: '#dc3545', 
            fontSize: '0.8rem', 
            marginTop: '0.25rem',
            paddingLeft: '0.25rem'
          }}>
            {errorUtils.formatErrorMessage(error)}
          </div>
        )}
      </div>
    );
  };

  // Componente de textarea con validación
  const ValidatedTextarea = ({ 
    value, 
    onChange, 
    placeholder, 
    validation, 
    fieldName,
    rows = 3,
    ...props 
  }) => {
    const hasError = validation.hasFieldError(fieldName);
    const error = validation.getFieldError(fieldName);

    return (
      <div style={{ width: '100%' }}>
        <textarea
          value={value}
          onChange={(e) => onChange(fieldName, e.target.value)}
          placeholder={placeholder}
          rows={rows}
          onBlur={() => validation.markFieldTouched(fieldName)}
          style={{
            width: '100%',
            padding: '1rem 1.25rem',
            border: `2px solid ${hasError ? '#dc3545' : 'rgba(230, 227, 212, 0.6)'}`,
            borderRadius: 'var(--border-radius)',
            fontSize: '0.95rem',
            fontFamily: 'inherit',
            resize: 'vertical',
            background: 'white',
            transition: 'var(--transition)',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.04)',
            boxSizing: 'border-box'
          }}
          {...props}
        />
        {hasError && (
          <div style={{ 
            color: '#dc3545', 
            fontSize: '0.8rem', 
            marginTop: '0.25rem',
            paddingLeft: '0.25rem'
          }}>
            {errorUtils.formatErrorMessage(error)}
          </div>
        )}
      </div>
    );
  };

  // Componente de select con validación
  const ValidatedSelect = ({ 
    value, 
    onChange, 
    options, 
    validation, 
    fieldName,
    placeholder = "Seleccionar...",
    ...props 
  }) => {
    const hasError = validation.hasFieldError(fieldName);
    const error = validation.getFieldError(fieldName);

    return (
      <div style={{ flex: 1 }}>
        <select
          value={value}
          onChange={(e) => onChange(fieldName, e.target.value)}
          onBlur={() => validation.markFieldTouched(fieldName)}
          style={{
            width: '100%',
            padding: '1rem 1.25rem',
            border: `2px solid ${hasError ? '#dc3545' : 'rgba(230, 227, 212, 0.6)'}`,
            borderRadius: 'var(--border-radius)',
            fontSize: '0.95rem',
            minWidth: '220px',
            background: 'white',
            transition: 'var(--transition)',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.04)',
            boxSizing: 'border-box'
          }}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        {hasError && (
          <div style={{ 
            color: '#dc3545', 
            fontSize: '0.8rem', 
            marginTop: '0.25rem',
            paddingLeft: '0.25rem'
          }}>
            {errorUtils.formatErrorMessage(error)}
          </div>
        )}
      </div>
    );
  };

  // Componente del formulario de edición inline
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
                  <ValidatedInput
                    value={editingProduct.name}
                    onChange={handleEditProductChange}
                    placeholder="Nombre del producto"
                    required
                    validation={editProductValidation}
                    fieldName="name"
                  />
                  <ValidatedInput
                    value={editingProduct.price}
                    onChange={handleEditProductChange}
                    placeholder="Precio (ej: $25.000)"
                    validation={editProductValidation}
                    fieldName="price"
                  />
                </div>
                <div className="form-row">
                  <ValidatedSelect
                    value={editingProduct.category}
                    onChange={handleEditProductChange}
                    options={VALID_CATEGORIES}
                    validation={editProductValidation}
                    fieldName="category"
                    placeholder="Seleccionar categoría"
                    required
                  />
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
                  <ValidatedTextarea
                    value={editingProduct.description}
                    onChange={handleEditProductChange}
                    placeholder="Descripción del producto"
                    validation={editProductValidation}
                    fieldName="description"
                    rows={3}
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

      {/* Formulario para agregar producto */}
      {showAddForm && (
        <div className="product-form">
          <h3>Agregar Nuevo Producto</h3>
          <form onSubmit={handleCreateProduct}>
            <div className="form-row">
              <ValidatedInput
                value={newProduct.name}
                onChange={handleNewProductChange}
                placeholder="Nombre del producto"
                required
                validation={newProductValidation}
                fieldName="name"
              />
              <ValidatedInput
                value={newProduct.price}
                onChange={handleNewProductChange}
                placeholder="Precio (ej: $25.000)"
                validation={newProductValidation}
                fieldName="price"
              />
            </div>
            <div className="form-row">
              <ValidatedSelect
                value={newProduct.category}
                onChange={handleNewProductChange}
                options={VALID_CATEGORIES}
                validation={newProductValidation}
                fieldName="category"
                placeholder="Seleccionar categoría"
                required
              />
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newProduct.inStock}
                  onChange={(e) => handleNewProductChange('inStock', e.target.checked)}
                />
                En Stock
              </label>
            </div>
            
            <div className="form-row">
              <ValidatedTextarea
                value={newProduct.description}
                onChange={handleNewProductChange}
                placeholder="Descripción del producto"
                validation={newProductValidation}
                fieldName="description"
                rows={3}
              />
            </div>
            
            {/* Sección de imágenes */}
            <div className="image-section">
              <h4>Imágenes del producto</h4>
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
                  Agregar Imagen
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
              
              {newProduct.imagesUrl.length > 0 && (
                <div className="current-images">
                  <p>Imágenes agregadas ({newProduct.imagesUrl.length}/10):</p>
                  <div className="images-grid">
                    {newProduct.imagesUrl.map((url, index) => (
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
                          onClick={() => removeImage(index)}
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
              <button 
                type="submit" 
                disabled={loading || newProductValidation.hasErrors}
              >
                {loading ? 'Creando...' : 'Crear Producto'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowAddForm(false);
                  setImageUrl('');
                  setPreviewUrl('');
                  setImageUrlError('');
                  newProductValidation.clearErrors();
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de productos con edición inline */}
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
                              e.target.src = '/assets/sin-imagen.png';
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
                    {/* Formulario de edición inline */}
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