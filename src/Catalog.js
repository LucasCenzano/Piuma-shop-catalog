import React, { useState, useEffect, useMemo } from 'react';
import './Catalog.css';

// Componente para imagen con precarga mejorada
const SafeProductImage = ({ src, alt, className, style, onClick, onError, ...props }) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(!!src);

  useEffect(() => {
    if (src) {
      setImageError(false);
      setLoading(true);
    } else {
      setLoading(false);
      setImageError(true);
    }
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
        <div style={{ position: 'relative', textAlign: 'center', zIndex: 1 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', opacity: 0.6 }}>📷</div>
          <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#6c757d', letterSpacing: '0.5px' }}>Sin imagen</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
        src={src}
        alt={alt}
        className={className}
        style={{ ...style, opacity: loading ? 0 : 1, transition: 'opacity 0.2s ease', objectFit: 'contain' }}
        onClick={onClick}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="eager"
        decoding="async"
        {...props}
      />
    </div>
  );
};

// Hook personalizado para precargar todas las imágenes
const useImagePreloader = (bags) => {
  const [preloadProgress, setPreloadProgress] = useState(0);

  useEffect(() => {
    const preloadAllImages = async () => {
      const allImageUrls = new Set();
      bags.forEach(bag => {
        if (bag.images && Array.isArray(bag.images)) {
          bag.images.forEach(url => {
            if (url && url.trim().length > 0) {
              allImageUrls.add(url.trim());
            }
          });
        }
      });

      const urlsArray = Array.from(allImageUrls);
      if (urlsArray.length === 0) {
          setPreloadProgress(100);
          return;
      }

      let loadedCount = 0;
      setPreloadProgress(0);
      const promises = urlsArray.map((url) => {
        return new Promise((resolve) => {
          const img = new Image();
          const handleComplete = () => {
            loadedCount++;
            setPreloadProgress((loadedCount / urlsArray.length) * 100);
            resolve();
          };
          img.onload = handleComplete;
          img.onerror = handleComplete;
          img.src = url;
        });
      });

      await Promise.all(promises);
    };

    if (bags && bags.length > 0) {
      preloadAllImages();
    }
  }, [bags]);

  return { preloadProgress };
};


// --- Componente Catalog ---
function Catalog({ bags, openModal, selectedCategory }) {
    const [currentImageIndexes, setCurrentImageIndexes] = useState({});
    const { preloadProgress } = useImagePreloader(bags);
    const [sortOrder, setSortOrder] = useState('default');

    const sortedAndFilteredBags = useMemo(() => {
        const filtered = bags.filter(bag => selectedCategory === 'Todos' || bag.category === selectedCategory);

        const sorted = [...filtered].sort((a, b) => {
            const parsePrice = (priceStr) => {
                if (!priceStr || typeof priceStr !== 'string') return 0;
                return parseFloat(priceStr.replace(/[^0-9,.-]+/g, "").replace(",", "."));
            };

            switch (sortOrder) {
                case 'price-desc': return parsePrice(b.price) - parsePrice(a.price);
                case 'price-asc': return parsePrice(a.price) - parsePrice(b.price);
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                default: return 0;
            }
        });
        return sorted;
    }, [bags, selectedCategory, sortOrder]);
    
    const getCurrentImageIndex = (productId) => currentImageIndexes[productId] || 0;
    const handleNextImage = (e, productId, totalImages) => { e.stopPropagation(); setCurrentImageIndexes(prev => ({ ...prev, [productId]: ((prev[productId] || 0) + 1) % totalImages })); };
    const handlePrevImage = (e, productId, totalImages) => { e.stopPropagation(); setCurrentImageIndexes(prev => ({ ...prev, [productId]: ((prev[productId] || 0) - 1 + totalImages) % totalImages })); };
    const getProductImage = (bag) => { const currentIndex = getCurrentImageIndex(bag.id); return bag.images?.[currentIndex] || bag.images?.[0] || null; };
    const getAllImages = (bag) => bag.images?.filter(img => img && img.trim().length > 0) || [];

    return (
        <div className="catalog-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 className="catalog-title" style={{ margin: 0, textAlign: 'left' }}>
                    {selectedCategory === 'Todos' ? `Colección Piuma` : `${selectedCategory}`}
                </h2>

                <div style={{ minWidth: '180px' }}>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: '0.9rem',
                            borderRadius: '20px',
                            border: '1px solid rgba(0, 0, 0, 0.1)', // Borde más sutil
                            backgroundColor: 'rgba(255, 255, 255, 0.8)', // Fondo semitransparente
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', // Sombra para dar profundidad
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            transition: 'all 0.2s ease', // Transición para suavidad
                            appearance: 'none' // Quita la flecha por defecto para un look más limpio
                        }}
                         onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.3)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                        }}
                    >
                        <option value="default">Filtrar por</option>
                        <option value="price-desc">Mayor precio</option>
                        <option value="price-asc">Menor precio</option>
                        <option value="name-asc">A-Z</option>
                        <option value="name-desc">Z-A</option>
                    </select>
                </div>
            </div>

            {preloadProgress < 100 && preloadProgress > 0 && (
                 <div style={{ margin: '0 auto 2rem', maxWidth: '400px' }}>
                     <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem', textAlign: 'center' }}>
                        📸 Cargando imágenes... {Math.round(preloadProgress)}%
                    </p>
                    <div style={{ width: '100%', height: '4px', backgroundColor: '#e0e0e0', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${preloadProgress}%`, height: '100%', backgroundColor: '#007bff', transition: 'width 0.3s ease' }} />
                    </div>
                </div>
            )}

            {sortedAndFilteredBags.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#666', fontSize: '1.2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🛍️</div>
                    <p>No hay productos disponibles para esta selección.</p>
                </div>
            ) : (
                <div className="catalog-grid">
                    {sortedAndFilteredBags.map((bag) => {
                        const allImages = getAllImages(bag);
                        const currentImage = getProductImage(bag);
                        const currentIndex = getCurrentImageIndex(bag.id);
                        const isInStock = bag.inStock === true;

                        return (
                            <div key={bag.id} className="product-card">
                                <div className="product-image-container">
                                    <SafeProductImage
                                        src={currentImage}
                                        alt={bag.name}
                                        className="product-image"
                                        onClick={() => currentImage && openModal(currentImage, bag.name)}
                                    />
                                    {allImages.length > 1 && (
                                        <>
                                            <button className="image-nav-btn prev-btn" onClick={(e) => handlePrevImage(e, bag.id, allImages.length)}>‹</button>
                                            <button className="image-nav-btn next-btn" onClick={(e) => handleNextImage(e, bag.id, allImages.length)}>›</button>
                                            <div className="image-counter">{currentIndex + 1} / {allImages.length}</div>
                                        </>
                                    )}
                                </div>
                                <div className="product-info">
                                    <h3 className="product-name">{bag.name}</h3>
                                    <p className="product-description">{bag.description || 'Sin descripción'}</p>
                                    <div className="product-details">
                                        {bag.price && <p className="product-price">{bag.price}</p>}
                                        <span className={`stock-status ${isInStock ? 'in-stock' : 'out-of-stock'}`}>
                                            {isInStock ? '✓ En Stock' : '✗ Sin Stock'}
                                        </span>
                                    </div>
                                    <p className="product-category">{bag.category}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
             <style>{`
                @keyframes loading-shimmer {
                    0% { background-position: -200px 0; }
                    100% { background-position: calc(200px + 100%) 0; }
                }
            `}</style>
        </div>
    );
}

export default Catalog;