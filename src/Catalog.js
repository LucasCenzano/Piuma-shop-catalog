// Catalog.js - Componente actualizado para manejar productos nuevos
import React from 'react';
import './Catalog.css';

function Catalog({ bags, openModal, selectedCategory }) {
    // Función para obtener la imagen a mostrar
    const getProductImage = (bag) => {
        // Si tiene imágenes importadas (productos originales)
        if (bag.images && bag.images.length > 0) {
            return bag.images[0];
        }
        
        // Si tiene URLs de imágenes (productos nuevos o actualizados)
        if (bag.imagesUrl && bag.imagesUrl.length > 0) {
            return bag.imagesUrl[0];
        }
        
        // Imagen por defecto si no hay ninguna
        return 'https://via.placeholder.com/300x300?text=' + encodeURIComponent(bag.name);
    };

    // Función para obtener todas las imágenes para el modal
    const getAllImages = (bag) => {
        const allImages = [];
        
        // Agregar imágenes importadas si existen
        if (bag.images && bag.images.length > 0) {
            allImages.push(...bag.images);
        }
        
        // Agregar URLs si existen y no están duplicadas
        if (bag.imagesUrl && bag.imagesUrl.length > 0) {
            bag.imagesUrl.forEach(url => {
                if (!allImages.includes(url)) {
                    allImages.push(url);
                }
            });
        }
        
        return allImages;
    };

    // Función para manejar error de carga de imagen
    const handleImageError = (e) => {
        e.target.src = 'https://via.placeholder.com/300x300?text=Sin+Imagen';
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
                    <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
                        Los productos nuevos aparecerán aquí automáticamente.
                    </p>
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
                    const mainImage = getProductImage(bag);
                    const allImages = getAllImages(bag);
                    const hasMultipleImages = allImages.length > 1;
                    
                    return (
                        <div key={bag.id} className="product-card">
                            {/* Badge para productos nuevos */}
                            {bag.isNew && (
                                <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    padding: '5px 10px',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    zIndex: 1
                                }}>
                                    NUEVO
                                </div>
                            )}
                            
                            <div className="product-image-container">
                                <img 
                                    src={mainImage} 
                                    alt={bag.name}
                                    className="product-image"
                                    onClick={() => hasMultipleImages && openModal(mainImage, bag.name)}
                                    onError={handleImageError}
                                    style={{ 
                                        cursor: hasMultipleImages ? 'pointer' : 'default',
                                        objectFit: 'cover'
                                    }}
                                />
                                
                                {hasMultipleImages && (
                                    <div className="image-indicators">
                                        {allImages.map((_, index) => (
                                            <span 
                                                key={index} 
                                                className={`indicator ${index === 0 ? 'active' : ''}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="product-info">
                                <h3 className="product-name">{bag.name}</h3>
                                
                                <div className="product-details">
                                    {bag.price && (
                                        <p className="product-price">{bag.price}</p>
                                    )}
                                    
                                    <span className={`stock-status ${bag.inStock ? 'in-stock' : 'out-of-stock'}`}>
                                        {bag.inStock ? '✓ En Stock' : '✗ Sin Stock'}
                                    </span>
                                </div>
                                
                                <p className="product-category">{bag.category}</p>
                                
                                {hasMultipleImages && (
                                    <button 
                                        className="view-more-btn"
                                        onClick={() => openModal(mainImage, bag.name)}
                                    >
                                        Ver más fotos ({allImages.length})
                                    </button>
                                )}
                            </div>
                            
                            {/* Galería oculta para el modal */}
                            {hasMultipleImages && (
                                <div style={{ display: 'none' }}>
                                    {allImages.slice(1).map((image, index) => (
                                        <img
                                            key={index}
                                            src={image}
                                            alt={`${bag.name} - ${index + 2}`}
                                            data-gallery={bag.id}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Catalog;