import React, { useState, useEffect, useRef } from 'react';
import Catalog from './Catalog';
import ImageModal from './ImageModal';
import './styles.css';
import dataService from './dataService';
import Footer from './Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import { faSearch } from '@fortawesome/free-solid-svg-icons';

function MainApp() {
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [modalImage, setModalImage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    // Nuevos estados para manejar datos de la DB
    const [bagsData, setBagsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const searchRef = useRef(null);

    const categories = ['Todos', 'Bandoleras', 'Carteras', 'Billeteras', 'Riñoneras', 'Mochilas', 'Porta Celulares'];

    // Cargar datos al montar el componente
    useEffect(() => {
        loadProducts();
    }, []);

    // Función para cargar productos
    const loadProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const products = await dataService.getAllProducts();

            // 1. Mapeamos los productos para adaptar su estructura
            const transformedProducts = products.map(product => ({
                ...product, // Mantenemos todas las propiedades originales (id, name, price, description, etc.)
                images: product.images_url || [], // 2. Creamos la propiedad 'images' a partir de 'images_url'
                inStock: product.in_stock         // 3. Creamos la propiedad 'inStock' a partir de 'in_stock'
            }));

            setBagsData(transformedProducts); // 4. Guardamos los datos ya transformados

        } catch (err) {
            console.error('Error cargando productos:', err);
            setError('Error al cargar productos. Por favor, intenta recargar la página.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearchChange = (event) => {
        const value = event.target.value;
        setSearchTerm(value);

        if (value.length > 0) {
            const lowercasedValue = value.toLowerCase();
            const uniqueResults = new Set();

            // Añadir sugerencias de productos por nombre, categoría o descripción
            bagsData.forEach(bag => {
                const nameMatch = bag.name.toLowerCase().includes(lowercasedValue);
                const categoryMatch = bag.category.toLowerCase().includes(lowercasedValue);
                const descriptionMatch = bag.description && bag.description.toLowerCase().includes(lowercasedValue);
                
                if (nameMatch || categoryMatch || descriptionMatch) {
                    uniqueResults.add(JSON.stringify(bag));
                }
            });

            // Añadir sugerencias de categorías
            categories.forEach(category => {
                if (category !== 'Todos' && category.toLowerCase().includes(lowercasedValue)) {
                    uniqueResults.add(JSON.stringify({ 
                        id: category, 
                        name: category + " (Categoría)", 
                        isCategory: true, 
                        category: category 
                    }));
                }
            });

            const resultsArray = Array.from(uniqueResults).map(item => JSON.parse(item));
            resultsArray.sort((a, b) => a.name.localeCompare(b.name));

            setSearchResults(resultsArray);
            setShowSuggestions(true);
        } else {
            setSearchResults([]);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (item) => {
        if (item.isCategory) {
            setSelectedCategory(item.category);
            setSearchTerm('');
        } else {
            setSearchTerm(item.name);
        }
        setShowSuggestions(false);
        setSearchResults([]);
    };

    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
        setIsMenuOpen(false);
        setSearchTerm('');
        setSearchResults([]);
        setShowSuggestions(false);
    };

    const openModal = (imageSrc, altText) => {
        setModalImage({ src: imageSrc, alt: altText });
    };

    const closeModal = () => {
        setModalImage(null);
    };

    // Lógica de filtrado del catálogo mejorada con descripción
    const displayBags = bagsData.filter(bag => {
        const matchesCategory = selectedCategory === 'Todos' || bag.category === selectedCategory;
        
        if (searchTerm === '') {
            return matchesCategory;
        } 
        
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        const matchesName = bag.name.toLowerCase().includes(lowercasedSearchTerm);
        const matchesDescription = bag.description && bag.description.toLowerCase().includes(lowercasedSearchTerm);
        const matchesSearchTerm = matchesName || matchesDescription;
        
        return matchesSearchTerm;
    });

    // Función para refrescar datos manualmente
    const handleRefresh = () => {
        dataService.invalidateCache();
        loadProducts();
    };

    if (loading) {
        return (
            <div className="App">
                <header className="App-header">
                    <h1>Piuma</h1>
                </header>
                <div style={{ 
                    padding: '3rem', 
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '50vh'
                }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #007bff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: '1rem'
                    }}></div>
                    <p style={{ fontSize: '1.2rem', color: '#666' }}>Cargando productos...</p>
                    <style>
                        {`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}
                    </style>
                </div>
            </div>
        );
    }

    return (
        <div className="App">
            <header className="App-header">
                <h1>Piuma</h1>
            </header>
            
            <nav className="main-nav">
                <div className="nav-content">
                    <button 
                        className="hamburger-menu-btn" 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <div className="bar"></div>
                        <div className="bar"></div>
                        <div className="bar"></div>
                    </button>

                    <ul className={`menu-list ${isMenuOpen ? 'open' : ''}`}>
                        {categories.map(category => (
                            <li key={category} className="menu-item">
                                <button
                                    onClick={() => handleCategoryClick(category)}
                                    className={selectedCategory === category ? 'active' : ''}
                                >
                                    {category}
                                </button>
                            </li>
                        ))}
                    </ul>

                    <div className="search-container" ref={searchRef}>
                        <input
                            type="text"
                            placeholder="Buscar productos"
                            className="search-input"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => searchTerm.length > 0 && setShowSuggestions(true)}
                        />
                        <span className="search-icon">
                            <FontAwesomeIcon icon={faSearch} />
                        </span>
                        
                        {showSuggestions && searchResults.length > 0 && (
                            <ul className="suggestions-list">
                                {searchResults.slice(0, 8).map(item => ( // Limitar a 8 resultados
                                    <li 
                                        key={item.id} 
                                        onClick={() => handleSuggestionClick(item)}
                                        className={`suggestion-item ${item.isCategory ? 'suggestion-category' : ''}`}
                                    >
                                        <div>
                                            <strong>{item.name}</strong>
                                            {item.description && !item.isCategory && (
                                                <div style={{ 
                                                    fontSize: '0.8rem', 
                                                    color: '#666',
                                                    marginTop: '0.25rem',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {item.description.length > 60 
                                                        ? item.description.substring(0, 60) + '...' 
                                                        : item.description}
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </nav>

            {error && (
                <div style={{ 
                    backgroundColor: '#fff3cd', 
                    color: '#856404', 
                    padding: '1rem', 
                    margin: '1rem',
                    border: '1px solid #ffeaa7',
                    borderRadius: '8px',
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <strong>⚠️ {error}</strong>
                    <button 
                        onClick={handleRefresh}
                        style={{ 
                            marginLeft: '1rem', 
                            padding: '0.5rem 1rem', 
                            backgroundColor: '#f39c12',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        🔄 Reintentar
                    </button>
                </div>
            )}

            <main>
                <Catalog 
                    bags={displayBags} 
                    openModal={openModal} 
                    selectedCategory={selectedCategory} 
                />
            </main>
            
            {modalImage && <ImageModal src={modalImage.src} alt={modalImage.alt} closeModal={closeModal} />}
            
            <Footer />
        </div>
    );
    // debug-connection.js - Script para diagnosticar problemas de conexión
// Agregar esto temporalmente en MainApp.js o crear como componente

// Componente de Diagnóstico (agregar temporalmente a MainApp.js)
const ConnectionDebug = () => {
  const [results, setResults] = useState({});
  const [testing, setTesting] = useState(false);

  const testEndpoints = async () => {
    setTesting(true);
    const tests = {};

    // Test 1: Verificar si las APIs están disponibles
    console.log('🔍 Iniciando diagnóstico...');

    // Test API de salud (si existe)
    try {
      const healthResponse = await fetch('/api/health');
      tests.health = {
        status: healthResponse.status,
        ok: healthResponse.ok,
        contentType: healthResponse.headers.get('content-type')
      };
      console.log('🏥 Health check:', tests.health);
    } catch (error) {
      tests.health = { error: error.message };
      console.log('❌ Health check error:', error);
    }

    // Test API de auth
    try {
      const authResponse = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test', password: 'test' })
      });
      
      const contentType = authResponse.headers.get('content-type');
      let responseText = '';
      
      if (contentType && contentType.includes('application/json')) {
        responseText = await authResponse.json();
      } else {
        responseText = await authResponse.text();
      }
      
      tests.auth = {
        status: authResponse.status,
        ok: authResponse.ok,
        contentType,
        response: typeof responseText === 'string' ? responseText.substring(0, 200) : responseText
      };
      console.log('🔐 Auth test:', tests.auth);
    } catch (error) {
      tests.auth = { error: error.message };
      console.log('❌ Auth test error:', error);
    }

    // Test productos públicos
    try {
      const productsResponse = await fetch('/api/products');
      const contentType = productsResponse.headers.get('content-type');
      
      tests.products = {
        status: productsResponse.status,
        ok: productsResponse.ok,
        contentType
      };
      
      if (productsResponse.ok && contentType && contentType.includes('application/json')) {
        const productsData = await productsResponse.json();
        tests.products.count = Array.isArray(productsData) ? productsData.length : 'No es array';
      }
      console.log('📦 Products test:', tests.products);
    } catch (error) {
      tests.products = { error: error.message };
      console.log('❌ Products test error:', error);
    }

    // Test base de datos
    try {
      const dbResponse = await fetch('/api/test-db');
      tests.database = {
        status: dbResponse.status,
        ok: dbResponse.ok,
        contentType: dbResponse.headers.get('content-type')
      };
      console.log('🗄️ Database test:', tests.database);
    } catch (error) {
      tests.database = { error: error.message };
      console.log('❌ Database test error:', error);
    }

    setResults(tests);
    setTesting(false);
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      padding: '20px', 
      border: '2px solid #007bff',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      zIndex: 9999,
      maxWidth: '400px',
      fontSize: '14px'
    }}>
      <h3>🔍 Diagnóstico de Conexión</h3>
      
      <button 
        onClick={testEndpoints} 
        disabled={testing}
        style={{
          padding: '10px 15px',
          backgroundColor: testing ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: testing ? 'not-allowed' : 'pointer',
          marginBottom: '15px'
        }}
      >
        {testing ? 'Probando...' : 'Probar Conexiones'}
      </button>

      {Object.keys(results).length > 0 && (
        <div>
          <h4>Resultados:</h4>
          {Object.entries(results).map(([endpoint, result]) => (
            <div key={endpoint} style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <strong>{endpoint.toUpperCase()}:</strong>
              <br />
              {result.error ? (
                <span style={{ color: 'red' }}>❌ Error: {result.error}</span>
              ) : (
                <div>
                  <span style={{ color: result.ok ? 'green' : 'red' }}>
                    {result.ok ? '✅' : '❌'} Status: {result.status}
                  </span>
                  <br />
                  <small>Tipo: {result.contentType || 'Unknown'}</small>
                  {result.count !== undefined && <><br /><small>Productos: {result.count}</small></>}
                  {result.response && (
                    <>
                      <br />
                      <small>Respuesta: {JSON.stringify(result.response).substring(0, 100)}...</small>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button 
        onClick={() => setResults({})}
        style={{
          padding: '5px 10px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Cerrar
      </button>
    </div>
  );
};
}

export default MainApp;
