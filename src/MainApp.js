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
            setBagsData(products);
        } catch (err) {
            console.error('Error cargando productos:', err);
            setError('Error al cargar productos. Mostrando datos locales.');
            // En caso de error, bagsData ya tendrá los datos de fallback del servicio
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

            // Añadir sugerencias de productos por nombre
            bagsData.forEach(bag => {
                if (bag.name.toLowerCase().includes(lowercasedValue) || bag.category.toLowerCase().includes(lowercasedValue)) {
                    uniqueResults.add(JSON.stringify(bag));
                }
            });

            // Añadir sugerencias de categorías
            categories.forEach(category => {
                if (category !== 'Todos' && category.toLowerCase().includes(lowercasedValue)) {
                    uniqueResults.add(JSON.stringify({ id: category, name: category + " (Categoría)", isCategory: true, category: category }));
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

    // Lógica de filtrado del catálogo
    const displayBags = bagsData.filter(bag => {
        const matchesCategory = selectedCategory === 'Todos' || bag.category === selectedCategory;
        const matchesSearchTerm = bag.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (searchTerm === '') {
            return matchesCategory;
        } 
        
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
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <p>Cargando productos...</p>
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
                                {searchResults.map(item => (
                                    <li 
                                        key={item.id} 
                                        onClick={() => handleSuggestionClick(item)}
                                        className={`suggestion-item ${item.isCategory ? 'suggestion-category' : ''}`}
                                    >
                                        {item.name}
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
                    borderRadius: '4px',
                    textAlign: 'center'
                }}>
                    {error}
                    <button 
                        onClick={handleRefresh}
                        style={{ 
                            marginLeft: '1rem', 
                            padding: '0.5rem 1rem', 
                            backgroundColor: '#f39c12',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Reintentar
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