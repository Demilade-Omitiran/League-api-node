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

      const { email, username } = req.body;
      
      let foundUser = await User.findOne({email});

      if (foundUser) {
        return res.status(403).json({error: "This email is already in use"});
      }

      foundUser = await User.findOne({username});

      if (foundUser) {
        return res.status(403).json({error: "This username is already in use"});
      }

      let user = new User(pick(req.body, ['username', 'email', 'password', 'isAdmin']));
      const savedUser = await user.save();
      const token = savedUser.generateAuthToken();
      res.status(201).json(
        {
          message: "User created successfully",
          data: savedUser.toJSON(),
          token
        }
      );
    }
    catch(err){
      console.log(err);
      res.status(400).json({message: err});
    }
  },

  async login(req, res) {
    const user = await User.findOne({username: req.body.username});

    if (!user) {
      return res.status(401).json({message: "Invalid username or password"});
    }

    match = await user.validPassword(req.body.password);

    if (!match) {
      return res.status(401).json({message: "Invalid username or password"});
    }

    const token = user.generateAuthToken();
    const message = "Login successful";
    const data = user.toJSON();

    res.status(200).json({message, data, token});
  },

  async logout(req, res) {
    res.status(200).send("Logged out");
  }
};

module.exports = UsersController;