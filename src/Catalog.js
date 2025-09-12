// Catalog.js - Componente mejorado con carrusel de imágenes y sin parpadeo
import React, { useState } from 'react';
import './Catalog.css';

// Componente para imagen con fallback mejorado (igual que en AdminPanel)
const SafeProductImage = ({ src, alt, className, style, onClick, onError, ...props }) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    setImageSrc(src);
    setImageError(false);
    setLoading(true);
  }, [src]);

  const handleImageLoad = () => {
    setLoading(false);
    setImageError(false);
  };

  const handleImageError = (e) => {
    setLoading(false);
    setImageError(true);
    if (onError) onError(e);
  };

  // Si no hay src o hay error, mostrar placeholder elegante
  if (!src || imageError) {
    return (
      <div 
        className={`${className} product-image-placeholder`}
        style={{
          ...style,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          border: '2px dashed #e9ecef',
          color: '#adb5bd',
          cursor: onClick ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={onClick}
        {...props}
      >
        {/* Patrón de fondo sutil */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e9ecef' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.5
        }} />
        
        {/* Contenido del placeholder */}
        <div style={{ 
          position: 'relative', 
          textAlign: 'center',
          zIndex: 1
        }}>
          <div style={{ 
            fontSize: '2.5rem', 
            marginBottom: '0.5rem',
            opacity: 0.6 
          }}>
            📷
          </div>
          <div style={{ 
            fontSize: '0.9rem', 
            fontWeight: '500',
            color: '#6c757d',
            letterSpacing: '0.5px'
          }}>
            Sin imagen
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Skeleton loader mientras carga */}
      {loading && (
        <div 
          className={className}
          style={{
            ...style,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'loading-shimmer 2s infinite',
            zIndex: 1
          }}
        />
      )}
      
      <img
        src={imageSrc}
        alt={alt}
        className={className}
        style={{
          ...style,
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.4s ease',
          objectFit: 'contain'
        }}
        onClick={onClick}
        onLoad={handleImageLoad}
        onError={handleImageError}
        {...props}
      />
    </div>
  );
};

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
        return null; // Retornamos null en lugar de imagen por defecto
    };

    // Función para obtener todas las imágenes válidas
    const getAllImages = (bag) => {
        if (bag.images && Array.isArray(bag.images)) {
            return bag.images.filter(img => img && img.trim().length > 0);
        }
        return [];
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
                    <div style={{ 
                        fontSize: '3rem', 
                        marginBottom: '1rem',
                        opacity: 0.5 
                    }}>
                        🛍️
                    </div>
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
                    const hasImages = allImages.length > 0;

                    return (
                        <div key={bag.id} className="product-card">
                            <div className="product-image-container">
                                <SafeProductImage
                                    src={currentImage}
                                    alt={bag.name}
                                    className="product-image"
                                    onClick={() => currentImage && openModal(currentImage, bag.name)}
                                    style={{
                                        cursor: currentImage ? 'pointer' : 'default',
                                        width: '100%',
                                        height: '100%'
                                    }}
                                />

                                {/* Botones de navegación solo si hay múltiples imágenes válidas */}
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

                                {/* Indicador de sin imágenes */}
                                {!hasImages && (
                                    <div className="no-image-badge">
                                        Sin imagen
                                    </div>
                                )}
                            </div>

                            <div className="product-info">
                                <h3 className="product-name">{bag.name}</h3>

                                {/* Descripción del producto */}
                                {bag.description ? (
                                    <p className="product-description">
                                        {bag.description}
                                    </p>
                                ) : (
                                    <p className="product-description no-description">
                                        Sin descripción disponible
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

            {/* Agregar estilos CSS inline para la animación de carga */}
            <style jsx>{`
                @keyframes loading-shimmer {
                    0% {
                        background-position: -200px 0;
                    }
                    100% {
                        background-position: calc(200px + 100%) 0;
                    }
                }
            `}</style>
        </div>
    );
}

export default Catalog;