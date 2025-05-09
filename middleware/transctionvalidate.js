const { body, validationResult } = require('express-validator');
const CoinShortNames = ['BTC','ETH','BNB', 'TRON','SOL'];
exports.validateTransaction = [
    body('coin_shortName').isIn(CoinShortNames).withMessage('coin_shortName must belong to the enum values'),
    body('from_address').notEmpty().withMessage('from_address must not be empty'),
    body('to_address').notEmpty().withMessage('to_address must not be empty'),
    body('amount').notEmpty().withMessage('amount must not be empty'),
    body('from_address').custom((value, { req }) => {
        if (value === req.body.to_address) {
            throw new Error('from_address and to_address must be different');
        }
        return true;
    }),
    (req, res, next) => {   
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors:errors.array() });
        }
        next();
    }   
];