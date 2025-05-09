

const { validationResult, check } = require('express-validator');
exports. validateRegistrationFields=[    
    check('password')
      .trim()
      .not()
      .isEmpty()
      .withMessage('Password is missing!')
      .isLength({ min: 6, max: 12 })
      .withMessage('Password must be 6 to 12 characters long!'),

    check('fname')
      .trim()
      .not()
      .isEmpty()
      .withMessage('First name is missing!'),

    check('lname')
      .trim()
      .not()
      .isEmpty()
      .withMessage('Last name is missing!'),
  ];
  exports.signInValidator = [
  
    check("password").trim().not().isEmpty().withMessage('password_missing'),
  ];
  exports.validatePassword = [
    check("newPassword")
      .trim()
      .not()
      .isEmpty()
      .withMessage("Password is missing!")
      .isLength({ min: 6, max: 12 })
      .withMessage("New password must be 6 to 12 characters long!"),
  ];
  exports.validate = (req, res, next) => {
    const error = validationResult(req).array();
    if (error.length) {
      return res.json({ error: res.__(error[0].msg)});
    }
  
    next();
  };
