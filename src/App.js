import React, { useState } from 'react';
import Catalog from './Catalog';
import ImageModal from './ImageModal';
import './styles.css';
import bagsData from './data';
import Footer from './Footer';

function App() {
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [modalImage, setModalImage] = useState(null);
    
    // CORRECCIÓN: 'Riñoneras' sin espacio al final para que coincida con 'data.js'
    const categories = ['Todos', 'Bandoleras', 'Carteras', 'Billeteras', 'Riñoneras', 'Mochillas', 'Porta Celulares'];

    const filteredBags = selectedCategory === 'Todos'
        ? bagsData
        : bagsData.filter(bag => bag.category === selectedCategory);

    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
        setIsMenuOpen(false);
    };

    const openModal = (imageSrc, altText) => {
        setModalImage({ src: imageSrc, alt: altText });
    };

    const closeModal = () => {
        setModalImage(null);
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Piuma</h1>
            </header>
            
            <nav className="main-nav">
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
            </nav>

            <main>
                    <Catalog bags={filteredBags} openModal={openModal} selectedCategory={selectedCategory} />
            </main>
            
            {/* El modal siempre debe estar en la capa superior, por lo que es mejor dejarlo al final */}
            {modalImage && <ImageModal src={modalImage.src} alt={modalImage.alt} closeModal={closeModal} />}
            
            {/* El footer al final del contenido principal */}
            <Footer />
        </div>
    );
}

export default App;