const User = require('../models/User');
const pick = require('lodash.pick');

const UsersController = {
  async signUp(req, res) {
    try{
      let user = new User(pick(req.body, ['username', 'email', 'password', 'isAdmin']));
      const savedUser = await user.save();
      res.status(201).json({message: "User created successfully", data: savedUser.toJSON()});
    }
    catch(err){
      res.status(400).json({message: err});
    }
  },
};

module.exports = UsersController;