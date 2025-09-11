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
}

export default MainApp;
