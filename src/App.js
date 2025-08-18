import React, { useState, useEffect, useRef } from 'react';
import Catalog from './Catalog';
import ImageModal from './ImageModal';
import './styles.css';
import bagsData from './data';
import Footer from './Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import { faSearch } from '@fortawesome/free-solid-svg-icons';

function App() {
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [modalImage, setModalImage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const searchRef = useRef(null);

    const categories = ['Todos', 'Bandoleras', 'Carteras', 'Billeteras', 'Riñoneras', 'Mochillas', 'Porta Celulares'];

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

    // --- NUEVA LÓGICA EN handleSuggestionClick ---
    const handleSuggestionClick = (item) => {
        if (item.isCategory) {
            setSelectedCategory(item.category);
            setSearchTerm('');
        } else {
            // Cuando se selecciona un producto, SOLO actualiza el término de búsqueda
            // y no cambia la categoría. Esto hace que el catálogo se filtre
            // por el nombre del producto en el siguiente render.
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

    // --- LÓGICA DE FILTRADO DEL CATÁLOGO ---
    // El catálogo ahora filtra por categoría Y por el término de búsqueda
    const displayBags = bagsData.filter(bag => {
        const matchesCategory = selectedCategory === 'Todos' || bag.category === selectedCategory;
        const matchesSearchTerm = bag.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Si no hay término de búsqueda, solo filtra por categoría
        if (searchTerm === '') {
            return matchesCategory;
        } 
        
        // Si hay un término de búsqueda, solo filtra por el nombre
        // Esto sobrescribe el filtro de categoría cuando hay un término
        return matchesSearchTerm;
    });

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

            <main>
                <Catalog bags={displayBags} openModal={openModal} selectedCategory={selectedCategory} />
            </main>
            
            {modalImage && <ImageModal src={modalImage.src} alt={modalImage.alt} closeModal={closeModal} />}
            
            <Footer />
        </div>
    );
}

export default App;