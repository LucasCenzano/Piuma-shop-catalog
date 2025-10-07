import React, { useState, useEffect, useMemo } from 'react';
import authService from './authService';
import './AdminPanel.css';
import { Link } from 'react-router-dom';

// Categorías válidas con íconos
const ADMIN_SECTIONS = [
  { id: 'dashboard', name: 'Tablero', icon: '📊' },
  { id: 'products', name: 'Productos', icon: '🛍️' },
  { id: 'reports', name: 'Informes', icon: '📋' },
  { id: 'settings', name: 'Configuración', icon: '⚙️' }
];

const VALID_CATEGORIES = [
  'Bandoleras', 
  'Carteras', 
  'Billeteras', 
  'Mochilas', 
  'Riñoneras', 
  'Porta Celulares'
];

// Componente para imagen segura
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
          textAlign: 'center',
          borderRadius: '8px'
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

// Componente Dashboard Stats
const DashboardStats = ({ products }) => {
  const stats = {
    total: products.length,
    inStock: products.filter(p => p.in_stock).length,
    outStock: products.filter(p => !p.in_stock).length,
    categories: [...new Set(products.map(p => p.category))].length
  };

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
      gap: '2rem',
      marginBottom: '3rem' 
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📦</div>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', fontWeight: '700' }}>{stats.total}</h3>
        <p style={{ margin: 0, opacity: 0.9 }}>Total Productos</p>
      </div>
      
      <div style={{
        background: 'linear-gradient(135deg, #2ed573 0%, #3742fa 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(46, 213, 115, 0.3)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', fontWeight: '700' }}>{stats.inStock}</h3>
        <p style={{ margin: 0, opacity: 0.9 }}>En Stock</p>
      </div>
      
      <div style={{
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(255, 107, 107, 0.3)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>❌</div>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', fontWeight: '700' }}>{stats.outStock}</h3>
        <p style={{ margin: 0, opacity: 0.9 }}>Sin Stock</p>
      </div>
      
      <div style={{
        background: 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(255, 167, 38, 0.3)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📂</div>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', fontWeight: '700' }}>{stats.categories}</h3>
        <p style={{ margin: 0, opacity: 0.9 }}>Categorías</p>
      </div>
    </div>
  );
};

// Componente principal del Admin Panel
const AdminPanel = ({ onLogout }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // ✅ 1. ESTADO PARA GUARDAR EL ORDEN
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'descending' });

  // Estados para nuevo producto
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newInStock, setNewInStock] = useState(true);
  const [newImages, setNewImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Estados para edición
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editInStock, setEditInStock] = useState(true);
  const [editImages, setEditImages] = useState([]);
  const [editImageUrl, setEditImageUrl] = useState('');

  // ✅ 2. FUNCIÓN PARA ORDENAR (corregida)
  const requestSort = (key) => {
    let direction = 'ascending';
    // Si ya está ordenando por esta columna, invierte la dirección
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // ✅ 3. useMemo PARA ORDENAR LOS PRODUCTOS (corregido)
  const sortedProducts = useMemo(() => {
    let sortableProducts = [...products];
    if (sortConfig.key) {
      sortableProducts.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Manejar valores null/undefined
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        
        // SI ES PRECIO, CONVERTIR A NÚMERO
        if (sortConfig.key === 'price') {
          aValue = parseFloat(String(aValue).replace(/[^0-9.-]/g, '')) || 0;
          bValue = parseFloat(String(bValue).replace(/[^0-9.-]/g, '')) || 0;
        }
        
        // SI ES NOMBRE, CONVERTIR A MINÚSCULAS
        if (sortConfig.key === 'name') {
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }
        
        // ✅ SI ES STOCK (BOOLEANO)
        if (sortConfig.key === 'in_stock') {
          // Convertir booleano a número: true = 1, false = 0
          aValue = aValue ? 1 : 0;
          bValue = bValue ? 1 : 0;
        }
        
        // Comparación
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableProducts;
  }, [products, sortConfig]);

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
    if (!window.confirm('¿Estás seguro de que quieres DESACTIVAR este producto? Ya no será visible en el catálogo.')) {
      return;
    }

    try {
      setLoading(true);
      await authService.deleteProduct(productId);
      await loadProducts();
      alert('Producto DESACTIVADO exitosamente');
    } catch (error) {
      console.error('Error desactivando  producto:', error);
      setError(`Error desactivando  producto: ${error.message}`);
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

  const getProductImageUrl = (product) => {
    if (!product.images_url || !Array.isArray(product.images_url) || product.images_url.length === 0) {
      return null;
    }
    return product.images_url.find(url => url && url.trim().length > 0) || null;
  };

  const handleLogout = () => {
    authService.logout();
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  // Renderizar contenido según la sección activa
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div>
            <h2 style={{ 
              fontFamily: 'Didot, serif', 
              fontSize: '2.5rem', 
              color: '#333',
              textAlign: 'center',
              marginBottom: '3rem',
              fontWeight: '400'
            }}>
              📊 Panel de Control
            </h2>
            <DashboardStats products={products} />
            
            {/* Productos recientes */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(230, 227, 212, 0.5)'
            }}>
              <h3 style={{ 
                fontFamily: 'Didot, serif',
                fontSize: '1.8rem',
                color: '#333',
                marginBottom: '1.5rem',
                fontWeight: '400'
              }}>
                📦 Productos Recientes
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '1.5rem' 
              }}>
                {products.slice(0, 6).map(product => (
                  <div key={product.id} style={{
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    borderRadius: '12px',
                    padding: '1rem',
                    textAlign: 'center',
                    border: '1px solid #dee2e6'
                  }}>
                    <SafeImage 
                      src={getProductImageUrl(product)}
                      alt={product.name}
                      style={{ 
                        width: '60px', 
                        height: '60px', 
                        objectFit: 'cover',
                        borderRadius: '8px',
                        margin: '0 auto 1rem'
                      }}
                    />
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>{product.name}</h4>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      background: product.in_stock ? '#d4edda' : '#f8d7da',
                      color: product.in_stock ? '#155724' : '#721c24'
                    }}>
                      {product.in_stock ? '✅ En Stock' : '❌ Sin Stock'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Acceso directo al módulo de ventas */}
            <div style={{
              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '3rem',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(40, 167, 69, 0.3)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
              <h3 style={{ 
                color: 'white',
                fontSize: '1.8rem',
                marginBottom: '1rem',
                fontFamily: 'Didot, serif',
                fontWeight: '400'
              }}>
                Módulo de Ventas
              </h3>
              <p style={{ color: 'white', opacity: 0.9, marginBottom: '2rem', fontSize: '1.1rem' }}>
                Registra ventas, gestiona clientes y visualiza estadísticas
              </p>
              <Link to="/admin/ventas" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    background: 'white',
                    color: '#28a745',
                    // ... los mismos estilos que ya tenías
                    border: 'none',
                    padding: '1rem 2.5rem',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease'
                  }}
                  // Ya no necesita el onClick
                >
                  🚀 Ir a Ventas
                </button>
              </Link>
            </div>
          </div>
        );

      case 'products':
        return (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <h2 style={{ 
                fontFamily: 'Didot, serif', 
                fontSize: '2.5rem', 
                color: '#333',
                margin: 0,
                fontWeight: '400'
              }}>
                🛍️ Gestión de Productos ({products.length})
              </h2>
              
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                style={{
                  background: 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(212, 175, 55, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(212, 175, 55, 0.3)';
                }}
              >
                {showAddForm ? '❌ Cancelar' : '➕ Agregar Producto'}
              </button>
            </div>

            {/* Controles de ordenamiento */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '1.5rem 2rem',
              marginBottom: '2rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '2px solid rgba(212, 175, 55, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <span style={{
                fontWeight: '600',
                fontSize: '1rem',
                color: '#333',
                fontFamily: 'Montserrat, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🔍 Ordenar por:
              </span>
              
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => requestSort('id')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    border: sortConfig.key === 'id' ? '2px solid #d4af37' : '2px solid #e9ecef',
                    background: sortConfig.key === 'id' 
                      ? 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)' 
                      : 'white',
                    color: sortConfig.key === 'id' ? 'white' : '#333',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    fontFamily: 'Montserrat, sans-serif',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  ID
                  {sortConfig.key === 'id' && (
                    <span>{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>
                  )}
                </button>

                <button
                  onClick={() => requestSort('name')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    border: sortConfig.key === 'name' ? '2px solid #d4af37' : '2px solid #e9ecef',
                    background: sortConfig.key === 'name' 
                      ? 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)' 
                      : 'white',
                    color: sortConfig.key === 'name' ? 'white' : '#333',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    fontFamily: 'Montserrat, sans-serif',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Nombre
                  {sortConfig.key === 'name' && (
                    <span>{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>
                  )}
                </button>

                <button
                  onClick={() => requestSort('price')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    border: sortConfig.key === 'price' ? '2px solid #d4af37' : '2px solid #e9ecef',
                    background: sortConfig.key === 'price' 
                      ? 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)' 
                      : 'white',
                    color: sortConfig.key === 'price' ? 'white' : '#333',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    fontFamily: 'Montserrat, sans-serif',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Precio
                  {sortConfig.key === 'price' && (
                    <span>{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>
                  )}
                </button>

                <button
                  onClick={() => requestSort('in_stock')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    border: sortConfig.key === 'in_stock' ? '2px solid #d4af37' : '2px solid #e9ecef',
                    background: sortConfig.key === 'in_stock' 
                      ? 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)' 
                      : 'white',
                    color: sortConfig.key === 'in_stock' ? 'white' : '#333',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    fontFamily: 'Montserrat, sans-serif',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Stock
                  {sortConfig.key === 'in_stock' && (
                    <span>{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>
                  )}
                </button>
              </div>
              
              {sortConfig.key && (
                <button
                  onClick={() => setSortConfig({ key: null, direction: 'ascending' })}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: '12px',
                    border: '2px solid #dc3545',
                    background: 'white',
                    color: '#dc3545',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    fontFamily: 'Montserrat, sans-serif',
                    transition: 'all 0.3s ease',
                    marginLeft: 'auto'
                  }}
                >
                  🔄 Reiniciar orden
                </button>
              )}
            </div>

            {/* Formulario de agregar producto */}
            {showAddForm && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2.5rem',
                marginBottom: '2rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(230, 227, 212, 0.5)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #d4af37 0%, #e6c757 50%, #d4af37 100%)'
                }} />
                
                <h3 style={{ 
                  fontFamily: 'Didot, serif',
                  fontSize: '1.8rem',
                  color: '#333',
                  textAlign: 'center',
                  marginBottom: '2rem',
                  fontWeight: '400'
                }}>
                  ✨ Nuevo Producto
                </h3>
                
                <form onSubmit={handleCreateProduct}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: '1.5rem',
                    marginBottom: '1.5rem'
                  }}>
                    <input
                      type="text"
                      placeholder="Nombre del producto"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                      style={{
                        padding: '1rem',
                        border: '2px solid #e9ecef',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontFamily: 'Montserrat, sans-serif',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                    />
                    
                    <input
                      type="text"
                      placeholder="Precio (ej: $25.000)"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      style={{
                        padding: '1rem',
                        border: '2px solid #e9ecef',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontFamily: 'Montserrat, sans-serif',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                    />
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '1.5rem',
                    marginBottom: '1.5rem'
                  }}>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      required
                      style={{
                        padding: '1rem',
                        border: '2px solid #e9ecef',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontFamily: 'Montserrat, sans-serif',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="">Seleccionar categoría</option>
                      {VALID_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '1rem',
                      background: '#f8f9fa',
                      borderRadius: '12px',
                      border: '2px solid #e9ecef',
                      cursor: 'pointer',
                      fontFamily: 'Montserrat, sans-serif',
                      fontWeight: '500'
                    }}>
                      <input
                        type="checkbox"
                        checked={newInStock}
                        onChange={(e) => setNewInStock(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#d4af37' }}
                      />
                      En Stock
                    </label>
                  </div>
                  
                  <textarea
                    placeholder="Descripción del producto"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '2px solid #e9ecef',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      fontFamily: 'Montserrat, sans-serif',
                      resize: 'vertical',
                      marginBottom: '1.5rem',
                      outline: 'none'
                    }}
                  />

                  {/* Sección de imágenes */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f3f1eb 0%, #f8f6f0 100%)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    marginBottom: '2rem',
                    border: '1px solid rgba(230, 227, 212, 0.8)'
                  }}>
                    <h4 style={{ 
                      fontFamily: 'Didot, serif',
                      color: '#333',
                      marginBottom: '1rem',
                      fontSize: '1.3rem',
                      fontWeight: '400'
                    }}>
                      🖼️ Agregar Imágenes
                    </h4>
                    
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      <input
                        type="url"
                        placeholder="URL de la imagen (ej: https://...)"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        style={{
                          flex: 1,
                          minWidth: '300px',
                          padding: '1rem',
                          border: '2px solid #e9ecef',
                          borderRadius: '12px',
                          fontSize: '1rem',
                          outline: 'none'
                        }}
                      />
                      
                      <button 
                        type="button" 
                        onClick={addNewImage}
                        disabled={!newImageUrl}
                        style={{
                          background: newImageUrl ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : '#6c757d',
                          color: 'white',
                          border: 'none',
                          padding: '1rem 2rem',
                          borderRadius: '12px',
                          cursor: newImageUrl ? 'pointer' : 'not-allowed',
                          fontWeight: '600',
                          transition: 'all 0.3s ease',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        ➕ Agregar
                      </button>
                    </div>
                    
                    {newImages.length > 0 && (
                      <div>
                        <p style={{ marginBottom: '1rem', fontWeight: '500' }}>
                          Imágenes agregadas ({newImages.length}/10):
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          {newImages.map((url, index) => (
                            <div key={index} style={{ position: 'relative' }}>
                              <SafeImage 
                                src={url} 
                                alt={`Imagen ${index + 1}`}
                                style={{ 
                                  width: '80px', 
                                  height: '80px', 
                                  objectFit: 'cover', 
                                  borderRadius: '8px',
                                  border: '2px solid #dee2e6'
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => removeNewImage(index)}
                                style={{
                                  position: 'absolute',
                                  top: '-8px',
                                  right: '-8px',
                                  background: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
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

                  <div style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    justifyContent: 'center',
                    paddingTop: '1rem',
                    borderTop: '2px solid rgba(230, 227, 212, 0.6)',
                    flexWrap: 'wrap'
                  }}>
                    <button 
                      type="submit" 
                      disabled={loading}
                      style={{
                        background: loading ? '#6c757d' : 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '1rem 3rem',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)',
                        transition: 'all 0.3s ease',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        minWidth: '180px'
                      }}
                    >
                      {loading ? '⏳ Creando...' : '✨ Crear Producto'}
                    </button>
                    
                    <button 
                      type="button" 
                      onClick={() => setShowAddForm(false)}
                      style={{
                        background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '1rem 3rem',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        minWidth: '180px'
                      }}
                    >
                      ❌ Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Lista de productos */}
            {products.length === 0 ? (
              <div style={{
                background: 'white',
                padding: '4rem 2rem',
                textAlign: 'center',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(230, 227, 212, 0.5)'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>📦</div>
                <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem' }}>
                  No hay productos cargados
                </p>
                <button 
                  onClick={loadProducts}
                  style={{
                    background: 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                >
                  🔄 Recargar
                </button>
              </div>
            ) : (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(230, 227, 212, 0.5)'
              }}>
                <div style={{ 
                  overflowX: 'auto',
                  minWidth: '100%'
                }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    minWidth: '800px'
                  }}>
                    <thead>
                      <tr style={{
                        background: 'linear-gradient(135deg, #e6e3d4 0%, #ddd8c7 100%)'
                      }}>
                        <th style={{ 
                          padding: '1.5rem 1rem', 
                          textAlign: 'left',
                          fontFamily: 'Montserrat, sans-serif',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          color: '#333',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          borderBottom: '2px solid rgba(230, 227, 212, 0.8)'
                        }}>ID</th>
                        
                        <th style={{ 
                          padding: '1.5rem 1rem', 
                          textAlign: 'left',
                          fontFamily: 'Montserrat, sans-serif',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          color: '#333',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          borderBottom: '2px solid rgba(230, 227, 212, 0.8)'
                        }}>Imagen</th>
                        
                        <th style={{ 
                          padding: '1.5rem 1rem', 
                          textAlign: 'left',
                          fontFamily: 'Montserrat, sans-serif',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          color: '#333',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          borderBottom: '2px solid rgba(230, 227, 212, 0.8)'
                        }}>Nombre</th>
                        
                        <th style={{ 
                          padding: '1.5rem 1rem', 
                          textAlign: 'left',
                          fontFamily: 'Montserrat, sans-serif',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          color: '#333',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          borderBottom: '2px solid rgba(230, 227, 212, 0.8)',
                          maxWidth: '200px'
                        }}>Descripción</th>
                        
                        <th style={{ 
                          padding: '1.5rem 1rem', 
                          textAlign: 'left',
                          fontFamily: 'Montserrat, sans-serif',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          color: '#333',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          borderBottom: '2px solid rgba(230, 227, 212, 0.8)'
                        }}>Precio</th>
                        
                        <th style={{ 
                          padding: '1.5rem 1rem', 
                          textAlign: 'left',
                          fontFamily: 'Montserrat, sans-serif',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          color: '#333',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          borderBottom: '2px solid rgba(230, 227, 212, 0.8)'
                        }}>Categoría</th>
                        
                        <th style={{ 
                          padding: '1.5rem 1rem', 
                          textAlign: 'left',
                          fontFamily: 'Montserrat, sans-serif',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          color: '#333',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          borderBottom: '2px solid rgba(230, 227, 212, 0.8)'
                        }}>Stock</th>
                        
                        <th style={{ 
                          padding: '1.5rem 1rem', 
                          textAlign: 'left',
                          fontFamily: 'Montserrat, sans-serif',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          color: '#333',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          borderBottom: '2px solid rgba(230, 227, 212, 0.8)'
                        }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedProducts.map(product => (
                        <React.Fragment key={product.id}>
                          <tr style={{
                            borderBottom: '1px solid rgba(230, 227, 212, 0.4)',
                            transition: 'all 0.3s ease',
                            backgroundColor: editingProductId === product.id ? 'rgba(212, 175, 55, 0.1)' : 'transparent'
                          }}>
                            <td style={{ 
                              padding: '1.25rem 1rem', 
                              color: '#333',
                              fontSize: '0.9rem',
                              fontWeight: '600'
                            }}>{product.id}</td>
                            <td style={{ padding: '1.25rem 1rem' }}>
                              <SafeImage 
                                src={getProductImageUrl(product)}
                                alt={product.name}
                                style={{ 
                                  width: '60px', 
                                  height: '60px', 
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  border: '2px solid #dee2e6'
                                }}
                              />
                            </td>
                            <td style={{ 
                              padding: '1.25rem 1rem',
                              color: '#333',
                              fontSize: '0.9rem'
                            }}>
                              <strong>{product.name}</strong>
                              {(!product.images_url || product.images_url.length === 0) && (
                                <div style={{ 
                                  fontSize: '0.7rem', 
                                  color: '#e67e22', 
                                  marginTop: '2px',
                                  fontWeight: '500'
                                }}>
                                  ⚠️ Sin imágenes
                                </div>
                              )}
                            </td>
                            <td style={{ 
                              padding: '1.25rem 1rem',
                              color: '#666',
                              fontSize: '0.85rem',
                              maxWidth: '200px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {product.description || '—'}
                            </td>
                            <td style={{ 
                              padding: '1.25rem 1rem',
                              color: '#333',
                              fontSize: '0.9rem',
                              fontWeight: '600'
                            }}>{product.price}</td>
                            <td style={{ 
                              padding: '1.25rem 1rem',
                              color: '#666',
                              fontSize: '0.9rem'
                            }}>{product.category}</td>
                            <td style={{ padding: '1.25rem 1rem' }}>
                              <button
                                onClick={() => handleToggleStock(product)}
                                disabled={loading}
                                style={{
                                  padding: '0.6rem 1.2rem',
                                  borderRadius: '20px',
                                  fontSize: '0.8rem',
                                  fontWeight: '500',
                                  cursor: loading ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.3s ease',
                                  minWidth: '120px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  background: product.in_stock 
                                    ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' 
                                    : 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                                  color: product.in_stock ? '#155724' : '#721c24',
                                  border: `1px solid ${product.in_stock ? 'rgba(21, 87, 36, 0.2)' : 'rgba(114, 28, 36, 0.2)'}`,
                                  opacity: loading ? 0.5 : 1
                                }}
                              >
                                {product.in_stock ? '✅ En Stock' : '❌ Sin Stock'}
                              </button>
                            </td>
                            <td style={{ padding: '1.25rem 1rem' }}>
                              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => editingProductId === product.id ? cancelEditing() : startEditing(product)}
                                  disabled={loading}
                                  style={{
                                    padding: '0.6rem 1rem',
                                    background: editingProductId === product.id 
                                      ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
                                      : 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    fontWeight: '500',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    minWidth: '80px',
                                    opacity: loading ? 0.5 : 1
                                  }}
                                >
                                  {editingProductId === product.id ? '❌ Cancelar' : '✏️ Editar'}
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product.id)}
                                  disabled={loading || editingProductId === product.id}
                                  style={{
                                    padding: '0.6rem 1rem',
                                    background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem',
                                    cursor: (loading || editingProductId === product.id) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    fontWeight: '500',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    minWidth: '80px',
                                    opacity: (loading || editingProductId === product.id) ? 0.5 : 1
                                  }}
                                >
                                  🗑️ Desactivar
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Formulario de edición inline */}
                          {editingProductId === product.id && (
                            <tr style={{ background: 'white' }}>
                              <td colSpan="8">
                                <div style={{
                                  padding: '2.5rem',
                                  border: '2px solid #d4af37',
                                  borderRadius: '16px',
                                  margin: '1rem',
                                  background: 'white',
                                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                                  position: 'relative',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '4px',
                                    background: 'linear-gradient(90deg, #d4af37 0%, #e6c757 50%, #d4af37 100%)'
                                  }} />
                                  
                                  <h4 style={{ 
                                    fontFamily: 'Didot, serif',
                                    color: '#333',
                                    margin: '0 0 2rem 0',
                                    fontSize: '1.4rem',
                                    fontWeight: '400',
                                    textAlign: 'center'
                                  }}>
                                    ✏️ Editando: {product.name}
                                  </h4>
                                  
                                  <form onSubmit={handleUpdateProduct}>
                                    <div style={{ 
                                      display: 'grid', 
                                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                                      gap: '2rem',
                                      marginBottom: '2rem'
                                    }}>
                                      <div>
                                        <h5 style={{ 
                                          margin: '0 0 1rem 0',
                                          color: '#333',
                                          fontSize: '1rem',
                                          fontWeight: '600'
                                        }}>
                                          📝 Información Básica
                                        </h5>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                          <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            placeholder="Nombre del producto"
                                            required
                                            style={{
                                              padding: '1rem',
                                              border: '2px solid #e9ecef',
                                              borderRadius: '12px',
                                              fontSize: '1rem',
                                              outline: 'none',
                                              transition: 'all 0.3s ease'
                                            }}
                                          />
                                          
                                          <input
                                            type="text"
                                            value={editPrice}
                                            onChange={(e) => setEditPrice(e.target.value)}
                                            placeholder="Precio (ej: $25.000)"
                                            style={{
                                              padding: '1rem',
                                              border: '2px solid #e9ecef',
                                              borderRadius: '12px',
                                              fontSize: '1rem',
                                              outline: 'none',
                                              transition: 'all 0.3s ease'
                                            }}
                                          />
                                          
                                          <select
                                            value={editCategory}
                                            onChange={(e) => setEditCategory(e.target.value)}
                                            required
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
                                            <option value="">Seleccionar categoría</option>
                                            {VALID_CATEGORIES.map(category => (
                                              <option key={category} value={category}>{category}</option>
                                            ))}
                                          </select>
                                          
                                          <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: '1rem',
                                            background: '#f8f9fa',
                                            borderRadius: '12px',
                                            border: '2px solid #e9ecef',
                                            cursor: 'pointer',
                                            fontWeight: '500'
                                          }}>
                                            <input
                                              type="checkbox"
                                              checked={editInStock}
                                              onChange={(e) => setEditInStock(e.target.checked)}
                                              style={{ width: '18px', height: '18px', accentColor: '#d4af37' }}
                                            />
                                            En Stock
                                          </label>
                                          
                                          <textarea
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            placeholder="Descripción del producto"
                                            rows={3}
                                            style={{
                                              padding: '1rem',
                                              border: '2px solid #e9ecef',
                                              borderRadius: '12px',
                                              fontSize: '1rem',
                                              resize: 'vertical',
                                              outline: 'none',
                                              transition: 'all 0.3s ease'
                                            }}
                                          />
                                        </div>
                                      </div>

                                      <div>
                                        <h5 style={{ 
                                          margin: '0 0 1rem 0',
                                          color: '#333',
                                          fontSize: '1rem',
                                          fontWeight: '600'
                                        }}>
                                          🖼️ Gestión de Imágenes
                                        </h5>
                                        
                                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                          <input
                                            type="url"
                                            placeholder="URL de la imagen"
                                            value={editImageUrl}
                                            onChange={(e) => setEditImageUrl(e.target.value)}
                                            style={{
                                              flex: 1,
                                              padding: '1rem',
                                              border: '2px solid #e9ecef',
                                              borderRadius: '12px',
                                              fontSize: '1rem',
                                              outline: 'none'
                                            }}
                                          />
                                          
                                          <button 
                                            type="button" 
                                            onClick={addEditImage}
                                            disabled={!editImageUrl}
                                            style={{
                                              background: editImageUrl ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : '#6c757d',
                                              color: 'white',
                                              border: 'none',
                                              padding: '1rem',
                                              borderRadius: '12px',
                                              cursor: editImageUrl ? 'pointer' : 'not-allowed',
                                              fontWeight: '600',
                                              minWidth: '80px'
                                            }}
                                          >
                                            ➕
                                          </button>
                                        </div>
                                        
                                        {editImages.length > 0 && (
                                          <div>
                                            <p style={{ marginBottom: '1rem', fontWeight: '500' }}>
                                              Imágenes ({editImages.length}/10):
                                            </p>
                                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                              {editImages.map((url, index) => (
                                                <div key={index} style={{ position: 'relative' }}>
                                                  <SafeImage 
                                                    src={url} 
                                                    alt={`Imagen ${index + 1}`}
                                                    style={{ 
                                                      width: '60px', 
                                                      height: '60px', 
                                                      objectFit: 'cover', 
                                                      borderRadius: '8px',
                                                      border: '2px solid #dee2e6'
                                                    }}
                                                  />
                                                  <button
                                                    type="button"
                                                    onClick={() => removeEditImage(index)}
                                                    style={{
                                                      position: 'absolute',
                                                      top: '-8px',
                                                      right: '-8px',
                                                      background: '#dc3545',
                                                      color: 'white',
                                                      border: 'none',
                                                      borderRadius: '50%',
                                                      width: '24px',
                                                      height: '24px',
                                                      cursor: 'pointer',
                                                      fontSize: '14px',
                                                      fontWeight: 'bold',
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      justifyContent: 'center'
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
                                    </div>
                                    
                                    <div style={{ 
                                      display: 'flex', 
                                      gap: '1rem', 
                                      justifyContent: 'center',
                                      paddingTop: '2rem',
                                      borderTop: '2px solid rgba(230, 227, 212, 0.6)'
                                    }}>
                                      <button 
                                        type="submit" 
                                        disabled={loading}
                                        style={{
                                          background: loading ? '#6c757d' : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                          color: 'white',
                                          border: 'none',
                                          padding: '1rem 2.5rem',
                                          borderRadius: '12px',
                                          fontSize: '1rem',
                                          fontWeight: '600',
                                          cursor: loading ? 'not-allowed' : 'pointer',
                                          transition: 'all 0.3s ease',
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.5px',
                                          minWidth: '160px'
                                        }}
                                      >
                                        {loading ? '⏳ Guardando...' : '✅ Guardar Cambios'}
                                      </button>
                                      
                                      <button 
                                        type="button" 
                                        onClick={cancelEditing}
                                        style={{
                                          background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                                          color: 'white',
                                          border: 'none',
                                          padding: '1rem 2.5rem',
                                          borderRadius: '12px',
                                          fontSize: '1rem',
                                          fontWeight: '600',
                                          cursor: 'pointer',
                                          transition: 'all 0.3s ease',
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.5px',
                                          minWidth: '160px'
                                        }}
                                      >
                                        ❌ Cancelar
                                      </button>
                                    </div>
                                  </form>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

      case 'reports':
        return (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>📋</div>
            <h2 style={{ 
              fontFamily: 'Didot, serif', 
              fontSize: '2rem', 
              color: '#333',
              marginBottom: '1rem',
              fontWeight: '400'
            }}>
              Informes
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#666', maxWidth: '500px', margin: '0 auto' }}>
              Próximamente podrás generar reportes de inventario, ventas por categoría, 
              productos más populares y exportar datos en diferentes formatos.
            </p>
          </div>
        );

      case 'settings':
        return (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>⚙️</div>
            <h2 style={{ 
              fontFamily: 'Didot, serif', 
              fontSize: '2rem', 
              color: '#333',
              marginBottom: '1rem',
              fontWeight: '400'
            }}>
              Configuración
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#666', maxWidth: '500px', margin: '0 auto' }}>
              Aquí podrás configurar usuarios, cambiar contraseñas, ajustar preferencias del sistema
              y gestionar la configuración general de la aplicación.
            </p>
          </div>
        );

      default:
        return <div>Sección no encontrada</div>;
    }
  };

  // Estados de error y loading
  if (error && error.includes('No tienes permisos')) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f9f7f4 0%, #f5f3ee 100%)',
        fontFamily: 'Montserrat, sans-serif'
      }}>
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          border: '1px solid rgba(230, 227, 212, 0.5)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>🔒</div>
          <h2 style={{ 
            fontFamily: 'Didot, serif',
            color: '#dc3545',
            marginBottom: '1rem',
            fontSize: '2rem',
            fontWeight: '400'
          }}>
            Acceso Denegado
          </h2>
          <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2rem' }}>
            {error}
          </p>
          <button 
            onClick={() => window.location.href = '/admin'}
            style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            🔑 Ir al Login
          </button>
        </div>
      </div>
    );
  }

  if (loading && products.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f9f7f4 0%, #f5f3ee 100%)',
        fontFamily: 'Montserrat, sans-serif'
      }}>
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          border: '1px solid rgba(230, 227, 212, 0.5)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '6px solid #f3f3f3',
            borderTop: '6px solid #d4af37',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 2rem'
          }}></div>
          <h2 style={{ 
            fontFamily: 'Didot, serif',
            color: '#333',
            marginBottom: '1rem',
            fontSize: '1.6rem',
            fontWeight: '400'
          }}>
            Cargando panel de administración...
          </h2>
          <p style={{ color: '#666', fontSize: '1.1rem', margin: 0 }}>
            Obteniendo productos de la base de datos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f9f7f4 0%, #f5f3ee 100%)',
      fontFamily: 'Montserrat, sans-serif'
    }}>
      {/* Header con navegación */}
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
          {/* Logo */}
          <h1 style={{
            fontFamily: 'Didot, serif',
            fontSize: '2rem',
            fontStyle: 'italic',
            color: '#333',
            margin: 0,
            fontWeight: '400'
          }}>
            Piuma Admin
          </h1>

          {/* Navegación desktop */}
          <nav style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            {ADMIN_SECTIONS.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  background: activeSection === section.id 
                    ? 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)'
                    : 'transparent',
                  color: activeSection === section.id ? 'white' : '#333',
                  border: activeSection === section.id ? 'none' : '2px solid rgba(51, 51, 51, 0.2)',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: 'Montserrat, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  boxShadow: activeSection === section.id 
                    ? '0 4px 15px rgba(212, 175, 55, 0.3)' 
                    : 'none'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{section.icon}</span>
                <span className="nav-text" style={{ 
                  display: window.innerWidth > 768 ? 'inline' : 'none' 
                }}>
                  {section.name}
                </span>
              </button>
            ))}
          </nav>

          {/* Botón de menú móvil */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
            style={{
              display: window.innerWidth <= 768 ? 'flex' : 'none',
              flexDirection: 'column',
              justifyContent: 'space-around',
              width: '30px',
              height: '25px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <div style={{
              width: '100%',
              height: '3px',
              background: '#333',
              borderRadius: '5px',
              transition: 'all 0.3s ease'
            }}></div>
            <div style={{
              width: '100%',
              height: '3px',
              background: '#333',
              borderRadius: '5px',
              transition: 'all 0.3s ease'
            }}></div>
            <div style={{
              width: '100%',
              height: '3px',
              background: '#333',
              borderRadius: '5px',
              transition: 'all 0.3s ease'
            }}></div>
          </button>

          {/* Botón especial para Ventas */}
          <button
            onClick={() => window.location.href = '/admin/ventas'}
            style={{
              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
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
              gap: '0.5rem',
              fontFamily: 'Montserrat, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>💰</span>
            <span>Ventas</span>
          </button>

          {/* Botón logout */}
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
              gap: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            <span>🚪</span>
            <span>Salir</span>
          </button>
        </div>

        {/* Menú móvil desplegable */}
        {mobileMenuOpen && (
          <div style={{
            background: 'linear-gradient(135deg, #e6e3d4 0%, #ddd8c7 100%)',
            borderTop: '1px solid rgba(51, 51, 51, 0.1)',
            padding: '1rem 2rem'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {ADMIN_SECTIONS.map(section => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    background: activeSection === section.id 
                      ? 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)'
                      : 'transparent',
                    color: activeSection === section.id ? 'white' : '#333',
                    border: 'none',
                    padding: '1rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    textAlign: 'left',
                    width: '100%'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{section.icon}</span>
                  <span>{section.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Contenido principal */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #fee 0%, #fdd 100%)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            color: '#721c24',
            padding: '1.5rem 2rem',
            margin: '0 0 2rem 0',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            fontWeight: '500',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <p style={{ margin: 0 }}>{error}</p>
            <button 
              onClick={() => setError(null)}
              style={{
                background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}
            >
              ✕ Cerrar
            </button>
          </div>
        )}

        {renderContent()}
      </main>

      {/* Loading overlay */}
      {loading && products.length > 0 && (
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
          
          @media (max-width: 1024px) {
            .nav-text {
              display: none !important;
            }
          }
          
          @media (max-width: 768px) {
            nav {
              display: none !important;
            }
            .mobile-menu-btn {
              display: flex !important;
            }
          }
          
          @media (max-width: 480px) {
            main {
              padding: 1rem !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default AdminPanel;