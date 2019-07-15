const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const joi = require('@hapi/joi');

const schema = {
  homeTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  awayTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
    validate: {
      validator: function(value) {
        return this.homeTeam != value
      },
      message: props => "away_team_id must be different from home_team_id"
    }
  },
  homeTeamGoals: {
    type: Number,
    required: function() {
      return this.status == "completed"
    },
    validate: {
      validator: function(value) {
        return value >= 0;
      },
      message: props => "home_team_goals must be greater than 0"
    }
  },
  awayTeamGoals: {
    type: Number,
    required: function() {
      return this.status == "completed"
    },
    validate: {
      validator: function(value) {
        return value >= 0;
      },
      message: props => "away_team_goals must be greater than 0"
    }
  },
  status: {
    type: String,
    default: function() {
      // Add 110 minutes to match_date
      estimated_match_end = new Date(this.matchDate.getTime() + (110 * 60 * 1000))

      return estimated_match_end < Date.now() ? "completed" : "pending";
    },
    validate: {
      validator: function(value) {
        estimated_match_end = new Date(this.matchDate.getTime() + (90 * 60 * 1000))

        return !(estimated_match_end < Date.now() && (value == "pending" || value == null))
      },
      message: props => "status for fixtures with a past date must be completed"
    }
  },
  matchDate: Date,
  link: {
    type: String,
    unique: true
  }
}

const FixtureSchema = mongoose.Schema(schema, {timestamps: true});

FixtureSchema.pre("validate", async function(next){
  if (this.matchDate != Date.now()) {
    estimated_match_end = new Date(this.matchDate.getTime() + (110 * 60 * 1000))
    this.status = estimated_match_end < Date.now() ? "completed" : "pending";

    if (this.matchDate > Date.now()) {
      this.homeTeamGoals = null;
      this.awayTeamGoals = null;
    }
  }
  
  next();
})

FixtureSchema.methods.toJSON = function() {
  let fixtureObj = this.toObject();

  home_team = {
    id: fixtureObj.homeTeam._id,
    name: fixtureObj.homeTeam.name
  }
  
  away_team = {
    id: fixtureObj.awayTeam._id,
    name: fixtureObj.awayTeam.name
  }

  return {
    id: fixtureObj._id,
    home_team,
    away_team,
    home_team_goals: fixtureObj.homeTeamGoals,
    away_team_goals: fixtureObj.awayTeamGoals,
    status: fixtureObj.status,
    match_date: fixtureObj.matchDate,
    unique_link: fixtureObj.link,
    created_at: fixtureObj.createdAt,
    updated_at: fixtureObj.updatedAt
  }
}

const Fixture = mongoose.model('Fixture', FixtureSchema);

function validateFixture(data) {
  const schema = joi.object().keys({
    home_team_id: joi.string().required(),
    away_team_id: joi.string().required(),
    home_team_goals: joi.number().integer(),
    away_team_goals: joi.number().integer(),
    status: joi.string().valid("pending", "completed"),
    match_date: joi.date().iso().required()
  });

  return joi.validate(data, schema);
}

module.exports = {
  Fixture,
  validateFixture
};