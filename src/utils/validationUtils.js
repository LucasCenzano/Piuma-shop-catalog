// src/utils/validationUtils.js - Utilidades de validación para productos (corregidas)
import { useState } from 'react';

// Categorías válidas
export const VALID_CATEGORIES = [
  'Bandoleras', 
  'Carteras', 
  'Billeteras', 
  'Mochilas', 
  'Riñoneras', 
  'Porta Celulares'
];

// Validaciones de productos
export const productValidation = {
  // Validar todos los campos del producto
  validateProduct: (product) => {
    const errors = {};

    // Validar nombre
    if (!product.name || product.name.trim().length === 0) {
      errors.name = 'El nombre es requerido';
    } else if (product.name.length > 100) {
      errors.name = 'El nombre no puede exceder 100 caracteres';
    } else if (product.name.length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validar categoría
    if (!product.category || !VALID_CATEGORIES.includes(product.category)) {
      errors.category = 'Debe seleccionar una categoría válida';
    }

    // Validar precio (opcional pero si está presente debe ser válido)
    if (product.price && product.price.trim().length > 0) {
      // Permitir formato con $ y puntos/comas para separadores de miles
      const pricePattern = /^\$?[\d.,]+$/;
      if (!pricePattern.test(product.price.trim())) {
        errors.price = 'Formato de precio inválido (ej: $25.000 o 25000)';
      }
    }

    // Validar descripción
    if (product.description) {
      if (product.description.length > 500) {
        errors.description = 'La descripción no puede exceder 500 caracteres';
      } else if (product.description.length < 10 && product.description.length > 0) {
        errors.description = 'La descripción debe tener al menos 10 caracteres';
      }
    }

    // Validar URLs de imágenes
    if (product.imagesUrl && Array.isArray(product.imagesUrl)) {
      const urlErrors = [];
      product.imagesUrl.forEach((url, index) => {
        const urlValidation = validateImageUrl(url);
        if (!urlValidation.isValid) {
          urlErrors.push(`Imagen ${index + 1}: ${urlValidation.error}`);
        }
      });
      if (urlErrors.length > 0) {
        errors.images = urlErrors;
      }
      
      // Límite de imágenes
      if (product.imagesUrl.length > 10) {
        errors.images = [...(errors.images || []), 'Máximo 10 imágenes por producto'];
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Validar solo un campo específico
  validateField: (fieldName, value, allData = {}) => {
    const tempProduct = { ...allData, [fieldName]: value };
    const fullValidation = productValidation.validateProduct(tempProduct);
    
    return {
      isValid: !fullValidation.errors[fieldName],
      error: fullValidation.errors[fieldName] || null
    };
  }
};

// Validar URL de imagen específicamente
export function validateImageUrl(url) {
  if (!url || url.trim().length === 0) {
    return { isValid: false, error: 'URL vacía' };
  }

  // Limpiar URL
  const cleanUrl = url.trim();

  // Verificar formato básico de URL
  try {
    const urlObj = new URL(cleanUrl);
    
    // Verificar protocolo
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'Debe usar http:// o https://' };
    }

    // Verificar extensiones de imagen comunes
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const pathname = urlObj.pathname.toLowerCase();
    
    // Permitir URLs de assets locales o servicios conocidos
    const isLocalAsset = pathname.includes('/assets/');
    const isKnownImageService = [
      'imgur.com',
      'cloudinary.com',
      'amazonaws.com',
      'googleusercontent.com',
      'unsplash.com',
      'pexels.com',
      'imgbb.com',
      'ibb.co'
    ].some(service => urlObj.hostname.includes(service));
    
    const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));
    
    if (!hasImageExtension && !isLocalAsset && !isKnownImageService) {
      return { 
        isValid: false, 
        error: 'URL debe ser de una imagen (.jpg, .png, etc.) o de un servicio conocido' 
      };
    }

    return { isValid: true };
    
  } catch {
    return { isValid: false, error: 'Formato de URL inválido' };
  }
}

// Utilidades de formato
export const formatUtils = {
  // Capitalizar primera letra
  capitalize: (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Formatear precio SOLO cuando se guarda, no durante la edición
  formatPrice: (price) => {
    if (!price) return '';
    
    // Si ya tiene formato correcto, mantenerlo
    if (typeof price === 'string' && (price.includes('$') || price.includes('.'))) {
      return price.trim();
    }
    
    // Solo formatear si es un número puro
    const cleanPrice = price.toString().replace(/[^\d]/g, '');
    if (cleanPrice && !isNaN(cleanPrice)) {
      const number = parseInt(cleanPrice);
      // Formatear con separadores de miles usando punto
      const formatted = number.toLocaleString('es-AR').replace(/,/g, '.');
      return `$${formatted}`;
    }
    
    return price;
  },

  // Nueva función para normalizar precio sin formatear automáticamente
  normalizePrice: (price) => {
    if (!price) return '';
    return price.toString().trim();
  },

  // Truncar texto
  truncateText: (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  },

  // Limpiar nombre para slug
  createSlug: (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remover caracteres especiales
      .replace(/[\s_-]+/g, '-') // Reemplazar espacios y guiones con un solo guión
      .replace(/^-+|-+$/g, ''); // Remover guiones al inicio y final
  }
};

// Hook personalizado para validación en tiempo real
export const useProductValidation = () => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (fieldName, value, productData = {}) => {
    const tempProduct = { ...productData, [fieldName]: value };
    const validation = productValidation.validateProduct(tempProduct);
    
    setErrors(prev => ({
      ...prev,
      [fieldName]: validation.errors[fieldName] || null
    }));

    return !validation.errors[fieldName];
  };

  const validateAll = (productData) => {
    const validation = productValidation.validateProduct(productData);
    setErrors(validation.errors);
    
    // Marcar todos los campos como tocados
    const allFields = ['name', 'category', 'price', 'description', 'images'];
    const touchedFields = {};
    allFields.forEach(field => touchedFields[field] = true);
    setTouched(touchedFields);
    
    return validation.isValid;
  };

  const markFieldTouched = (fieldName) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));
  };

  const clearErrors = () => {
    setErrors({});
    setTouched({});
  };

  const getFieldError = (fieldName) => {
    return touched[fieldName] ? errors[fieldName] : null;
  };

  return {
    errors,
    touched,
    validateField,
    validateAll,
    clearErrors,
    markFieldTouched,
    getFieldError,
    hasErrors: Object.keys(errors).length > 0,
    hasFieldError: (fieldName) => !!(touched[fieldName] && errors[fieldName])
  };
};

// Utilidades para mostrar mensajes de error
export const errorUtils = {
  // Formatear errores para mostrar
  formatErrorMessage: (error) => {
    if (Array.isArray(error)) {
      return error.join(', ');
    }
    return error || '';
  },

  // Obtener clase CSS para campo con error
  getFieldClassName: (baseClass, hasError) => {
    return hasError ? `${baseClass} error` : baseClass;
  }
};

// Constantes útiles
export const VALIDATION_CONSTANTS = {
  MAX_NAME_LENGTH: 100,
  MIN_NAME_LENGTH: 2,
  MAX_DESCRIPTION_LENGTH: 500,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_IMAGES: 10,
  PRICE_REGEX: /^\$?[\d,]+\.?\d*$/
};