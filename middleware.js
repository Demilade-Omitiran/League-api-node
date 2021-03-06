const jwt = require("jsonwebtoken");
const { User } = require('./api/models/User');

const authentication = (req, res, next) => {
  try{
    header = req.header('Authorization');

    if (!header) {
      return res.status(401).json({error: "Authorization header not found"});
    }

    wrong_format = header.split(" ").length != 2 || header.split(" ")[0] != "Bearer";

    if (wrong_format){
      return res.status(401).json({error: "Format is Authorization: Bearer {token}"});
    }

    const token = header.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, async function(err, decoded) {
      if (err) {
        return res.status(401).json({error: "Invalid token"});
      }

      user = await User.findById(decoded.sub);

      if (!user) {
        return res.status(401).json({error: "Invalid token"});
      }

      if (token != user.valid_jwt) {
        return res.status(401).json({error: "Invalid token"});
      }

      req.user = user;

      next();
    });
  }
  catch (err) {
    console.log(err);
  }
}

const adminAuthorization = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(401).json({error: "Only Admins can perform this action"});
  }
  next();
}

module.exports = {
  authentication,
  adminAuthorization
};