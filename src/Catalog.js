import React, { useState, useEffect, useRef } from 'react';
import BagItem from './BagItem';
import './styles.css';

function Catalog({ bags, openModal }) { // Recibimos la función openModal
    const [visibleItems, setVisibleItems] = useState([]);
    const itemsRef = useRef([]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const item = entry.target;
                        if (!visibleItems.includes(item)) {
                            setVisibleItems(prevVisibleItems => [...prevVisibleItems, item]);
                            observer.unobserve(item);
                        }
                    }
                });
            },
            {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            }
        );

        itemsRef.current.forEach(item => {
            if (item) {
                observer.observe(item);
            }
        });

        return () => {
            observer.disconnect();
        };
    }, [bags, visibleItems]);

    useEffect(() => {
        itemsRef.current = Array(bags.length).fill(null);
        setVisibleItems([]);
    }, [bags]);

    return (
        <div className="catalog-container">
            <h2>Nuestros Productos</h2>
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
                        <BagItem bag={bag} openModal={openModal} /> {/* Pasamos la función a BagItem */}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Catalog;