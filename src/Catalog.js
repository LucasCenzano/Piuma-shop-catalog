import React, { useState, useEffect, useRef } from 'react';
import BagItem from './BagItem';
import './styles.css';

function Catalog({ bags, openModal, selectedCategory }) {
    const [visibleItems, setVisibleItems] = useState([]);
    const itemsRef = useRef([]);

    useEffect(() => {
        // ... tu código de IntersectionObserver ...
    }, [bags, visibleItems]);

    useEffect(() => {
        itemsRef.current = Array(bags.length).fill(null);
        setVisibleItems([]);
    }, [bags]);

    // Lógica para determinar el título
    const title = selectedCategory === 'Todos' ? 'Todos los Productos' : selectedCategory;

    return (
        <div className="catalog-container">
            {/* Usa la variable "title" para el encabezado */}
            <h2>{title}</h2>
            <div className="catalog-list">
                {bags.map((bag, index) => (
                    <div
                        key={bag.id}
                        className={`bag-item ${visibleItems.includes(itemsRef.current?.[index]) ? 'visible' : ''}`}
                        ref={(el) => {
                            if (itemsRef.current) {
                                itemsRef.current[index] = el;
                            }
                        }}
                    >
                        <BagItem bag={bag} openModal={openModal} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Catalog;