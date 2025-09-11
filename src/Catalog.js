// Catalog.js - Componente mejorado con carrusel de imágenes y descripción
import React, { useState } from 'react';
import './Catalog.css';

function Catalog({ bags, openModal, selectedCategory }) {

    // Estado para manejar el índice de imagen actual de cada producto
    const [currentImageIndexes, setCurrentImageIndexes] = useState({});

    // Función para obtener el índice actual de imagen de un producto
    const getCurrentImageIndex = (productId) => {
        return currentImageIndexes[productId] || 0;
    };

    // Función para cambiar a la siguiente imagen
    const handleNextImage = (e, productId, totalImages) => {
        e.stopPropagation(); // Evitar que abra el modal
        setCurrentImageIndexes(prev => ({
            ...prev,
            [productId]: (prev[productId] || 0) + 1 >= totalImages ? 0 : (prev[productId] || 0) + 1
        }));
    };

    // Función para cambiar a la imagen anterior
    const handlePrevImage = (e, productId, totalImages) => {
        e.stopPropagation(); // Evitar que abra el modal
        setCurrentImageIndexes(prev => ({
            ...prev,
            [productId]: (prev[productId] || 0) - 1 < 0 ? totalImages - 1 : (prev[productId] || 0) - 1
        }));
    };

    // Función para obtener la imagen actual del producto
    const getProductImage = (bag) => {
        const currentIndex = getCurrentImageIndex(bag.id);
        if (bag.images && bag.images.length > 0) {
            return bag.images[currentIndex] || bag.images[0];
        }
        return '/assets/sin-imagen.png';
    };

    // Función para obtener todas las imágenes
    const getAllImages = (bag) => {
        if (bag.images && bag.images.length > 0) {
            return bag.images;
        }
        return [];
    };

    // Función de error para imágenes
    const handleImageError = (e) => {
        e.target.src = '/assets/sin-imagen.png';
    };

    if (bags.length === 0) {
        return (
            <div className="catalog-container">
                <h2 className="catalog-title">
                    {selectedCategory === 'Todos' ? 'Catálogo Completo' : selectedCategory}
                </h2>
                <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: '#666',
                    fontSize: '1.2rem'
                }}>
                    <p>No hay productos disponibles en esta categoría.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="catalog-container">
            <h2 className="catalog-title">
                {selectedCategory === 'Todos'
                    ? `Catálogo Completo (${bags.length} productos)`
                    : `${selectedCategory} (${bags.length} productos)`}
            </h2>

            <div className="catalog-grid">
                {bags.map((bag) => {
                    const currentImage = getProductImage(bag);
                    const allImages = getAllImages(bag);
                    const hasMultipleImages = allImages.length > 1;
                    const currentIndex = getCurrentImageIndex(bag.id);

                    return (
                        <div key={bag.id} className="product-card">
                            <div className="product-image-container">
                                <img
                                    src={currentImage}
                                    alt={bag.name}
                                    className="product-image"
                                    onClick={() => openModal(currentImage, bag.name)}
                                    onError={handleImageError}
                                    style={{
                                        cursor: 'pointer',
                                        objectFit: 'contain', // Cambiado de 'cover' a 'contain' para evitar recortes
                                    }}
                                />

                                {/* Botones de navegación para múltiples imágenes */}
                                {hasMultipleImages && (
                                    <>
                                        <button
                                            className="image-nav-btn prev-btn"
                                            onClick={(e) => handlePrevImage(e, bag.id, allImages.length)}
                                            aria-label="Imagen anterior"
                                        >
                                            ‹
                                        </button>
                                        <button
                                            className="image-nav-btn next-btn"
                                            onClick={(e) => handleNextImage(e, bag.id, allImages.length)}
                                            aria-label="Siguiente imagen"
                                        >
                                            ›
                                        </button>

                                        {/* Indicadores de imagen actual */}
                                        <div className="image-indicators">
                                            {allImages.map((_, index) => (
                                                <span
                                                    key={index}
                                                    className={`indicator ${index === currentIndex ? 'active' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCurrentImageIndexes(prev => ({
                                                            ...prev,
                                                            [bag.id]: index
                                                        }));
                                                    }}
                                                />
                                            ))}
                                        </div>

                                        {/* Contador de imágenes */}
                                        <div className="image-counter">
                                            {currentIndex + 1} / {allImages.length}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="product-info">
                                <h3 className="product-name">{bag.name}</h3>

                                {/* Descripción del producto */}
                                {bag.description && (
                                    <p className="product-description">
                                        {bag.description}
                                    </p>
                                )}

                                <div className="product-details">
                                    {bag.price && (
                                        <p className="product-price">{bag.price}</p>
                                    )}

                                    <span className={`stock-status ${bag.inStock ? 'in-stock' : 'out-of-stock'}`}>
                                        {bag.inStock ? '✓ En Stock' : '✗ Sin Stock'}
                                    </span>
                                </div>

                                <p className="product-category">{bag.category}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Catalog;
