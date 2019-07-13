const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const schema = {
  username: {
    type: String,
    required: [true, 'User username is required'],
    unique: true
  },
  email: {
    type: String,
    required: [true, 'User email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'User password is required'],
    minlength: 6
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
};

const UserSchema = mongoose.Schema(schema, {timestamps: true});

UserSchema.pre("save", async function(next){
  if (this.isModified("password")){
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  }
  else {
    next();
  }
})

UserSchema.methods.toJSON = function() {
  let userObj = this.toObject();
  return {
    email: userObj.email,
    id: userObj._id,
    username: userObj.username
  }
}

const User = mongoose.model('User', UserSchema);

module.exports = User;