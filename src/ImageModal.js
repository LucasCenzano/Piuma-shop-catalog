import React from 'react';
import './styles.css';

function ImageModal({ src, alt, closeModal }) {
    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={closeModal}>×</button>
                <img src={src} alt={alt} className="modal-image" />
            </div>
        </div>
    );
}

export default ImageModal;