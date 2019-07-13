const User = require('../models/User').User;
const validateUser = require('../models/User').validateUser;
const pick = require('lodash.pick');

const UsersController = {
  async signUp(req, res) {
    try{
      const { error } = validateUser(req.body);

      if (error) {
        let { message } = error.details[0];
        message = message.replace(/"/g, '');
        return res.status(400).json({ message });
      }

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