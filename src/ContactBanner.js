import React from 'react';
import './ContactBanner.css'; // Crearemos este archivo a continuación
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faWhatsapp } from '@fortawesome/free-brands-svg-icons';

function ContactBanner() {
  // ✅ ¡IMPORTANTE! Reemplaza este número con el tuyo.
  // Formato: CodPaís + CodArea (sin 0) + Numero (sin 15). Ejemplo: 5493871234567
  const whatsappNumber = '5493874526283';
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=Hola!%20Vengo%20del%20catálogo%20y%20quisiera%20consultar%20por%20un%20producto.`;

  return (
    <div className="contact-banner-container">
      <h2 className="banner-title">¿Te gustó algo? ¡Hablemos!</h2>
      <p className="banner-text">
        Si quieres hacer una consulta o realizar un pedido, puedes contactarnos directamente a través de Instagram o WhatsApp.
      </p>
      <div className="contact-buttons">
        <a
          href="https://www.instagram.com/piuma_carteras/"
          target="_blank"
          rel="noopener noreferrer"
          className="contact-btn instagram"
        >
          <FontAwesomeIcon icon={faInstagram} />
          Ver en Instagram
        </a>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="contact-btn whatsapp"
        >
          <FontAwesomeIcon icon={faWhatsapp} />
          Contactar por WhatsApp
        </a>
      </div>
    </div>
  );
}

export default ContactBanner;