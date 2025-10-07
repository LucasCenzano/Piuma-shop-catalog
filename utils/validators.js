const { body, param, query } = require('express-validator');

const loginValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Usuario debe tener 3-50 caracteres')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Usuario solo puede contener letras, números, guiones'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Contraseña debe tener mínimo 8 caracteres')
];

const productValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Nombre es requerido')
    .isLength({ max: 255 })
    .withMessage('Nombre muy largo'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Categoría es requerida'),
  body('price')
    .optional()
    .trim(),
  body('inStock')
    .optional()
    .isBoolean()
    .withMessage('inStock debe ser booleano')
];

const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID inválido')
];

module.exports = {
  loginValidation,
  productValidation,
  idValidation
};