const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const joi = require('@hapi/joi');

const schema = {
  name: {
    type: String,
    required: [true, 'Team name is required'],
    unique: true,
    minlength: 6,
    lowercase: true
  }
}

const TeamSchema = mongoose.Schema(schema, {timestamps: true});

TeamSchema.methods.toJSON = function() {
  let teamObj = this.toObject();
  return {
    id: teamObj._id,
    name: teamObj.name,
    createdAt: teamObj.createdAt,
    updatedAt: teamObj.updatedAt
  }
}

const Team = mongoose.model('Team', TeamSchema);

function validateTeam(data) {
  const schema = joi.object().keys({
    name: joi.string().min(6).max(30).required()
  });

  return joi.validate(data, schema)
}

module.exports = {
  Team,
  validateTeam
};