const { body, validationResult } = require('express-validator');
const validateCryptocurrency = [
  body('coin_name').notEmpty().withMessage('Coin name is required'),
  body('coin_symbol').notEmpty().withMessage('Coin symbol is required'),
  body('coin_symbol').isLength({ max: 10 }).withMessage('Coin symbol cannot be more than 10 characters'),
  body('decimal_places').isInt({ min: 0, max: 255 }).withMessage('Decimal places must be an integer between 0 and 255'),
  body('blockchain').optional().isString().withMessage('Blockchain must be a string'),
  body('total_supply').optional().isDecimal({ decimal_digits: '1,8' }).withMessage('Total supply must be a decimal with up to 8 decimal places'),
  body('website_url').optional().isURL().withMessage('Website URL must be a valid URL'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('logo_url').optional().isURL().withMessage('Logo URL must be a valid URL'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateCryptocurrency
};
