import React, { useState } from 'react';
import './styles.css';

function ImageGallery({ images, name }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const handleNext = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    const handlePrevious = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    };

    return (
        <div className="image-gallery">
            <img 
                src={images[currentImageIndex]} 
                alt={`${name} - imagen ${currentImageIndex + 1}`} 
                className="bag-image"
            />
            {images.length > 1 && (
                <>
                    <button className="gallery-btn prev-btn" onClick={handlePrevious}>
                        &lt;
                    </button>
                    <button className="gallery-btn next-btn" onClick={handleNext}>
                        &gt;
                    </button>
                </>
            )}
        </div>
    );
}

export default ImageGallery;