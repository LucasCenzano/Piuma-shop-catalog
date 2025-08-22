// Catalog.js - Componente actualizado para manejar productos nuevos
import React from 'react';
import './Catalog.css';

function Catalog({ bags, openModal, selectedCategory }) {

    // Función para obtener la imagen principal del producto
    const getProductImage = (bag) => {
        // Esta función ya está correcta según la Solución B
        if (bag.images && bag.images.length > 0) {
            return bag.images[0];
        }
        // Devuelve la ruta a tu imagen local como fallback
        return '/assets/sin-imagen.png';
    };

    // Función para obtener todas las imágenes para el modal
    const getAllImages = (bag) => {
        // La transformación en MainApp.js ya debería haber unificado las imágenes.
        // Nos aseguramos de que devuelva el array correcto.
        if (bag.images && bag.images.length > 0) {
            return bag.images;
        }
        return [];
    };

    // CAMBIO 1: La función de error ahora usa el placeholder LOCAL.
    // Esto elimina la última llamada a "via.placeholder.com".
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
                    const mainImage = getProductImage(bag);
                    const allImages = getAllImages(bag);
                    const hasMultipleImages = allImages.length > 1;

                    return (
                        <div key={bag.id} className="product-card">
                            <div className="product-image-container">
                                <img
                                    src={mainImage}
                                    alt={bag.name}
                                    className="product-image"
                                    onClick={() => openModal(mainImage, bag.name)} // Simplificado para abrir siempre el modal
                                    onError={handleImageError} // CAMBIO 2: El onError ahora es 100% seguro
                                    style={{
                                        cursor: 'pointer',
                                        objectFit: 'cover'
                                    }}
                                />

                                {hasMultipleImages && (
                                    <div className="image-indicators">
                                        {/* Esto es solo visual, no funcional para cambiar imagen */}
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
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Catalog;