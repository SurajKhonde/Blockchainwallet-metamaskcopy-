const jwt = require("jsonwebtoken");
require("dotenv")
exports.isAuth = async (req, res, next) => {
  var token = req.headers['authorization'] || req.headers['x-access-token']
  if (!token) {
    return res.status(401).send({message:"Invalid token!",status:false,auth:false}); 
  }
  const jwtToken = token.split("Bearer ")[1];
  if (!jwtToken) {
    return res.send({message:res.__('validJsonToken'), status:false,auth:false});
  };
  try {
    const decode = jwt.verify(jwtToken, process.env.JWT_SECRET);
    req.user = decode;
    next(); 
    } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).send({message:res.__("Loginexpired"),status:false,auth:false});
    }
    return res.status(401).send({message:"Auth failed",status:false,auth:false});
  }
};