import React from 'react';
import ImageGallery from './ImageGallery';
import './styles.css';

function BagItem({ bag, openModal }) {
  return (
    <div className="bag-item">
      <ImageGallery images={bag.imagesUrl} name={bag.name} openModal={openModal} />
      <div className="bag-details">
        <h3>
          {bag.name}
          {!bag.inStock && <span className="out-of-stock-label">Sin stock</span>}
        </h3>
        <p className="bag-price">{bag.price}</p>
      </div>
    </div>
  );
}

export default BagItem;