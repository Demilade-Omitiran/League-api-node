const { Fixture, validateFixture } = require('../models/Fixture');
const { Team } = require("../models/Team");
const redis = require('redis');
const client = redis.createClient();

// Print redis errors to the console
client.on('error', (err) => {
  console.log("Error " + err);
});

const UpdateCache = async () => {
  const results = await Fixture.find().limit(20).sort({ matchDate: "desc" });
  const total = await Fixture.count();
  const page = 1;
  const per_page = 20;
  const page_count = Math.ceil(total / per_page);
  const order = "desc";
  const order_by = "match_date";

  responseObj = {
    message: "Fixtures retrieved successfully",
    data: results,
    meta: {
      total,
      page,
      per_page,
      page_count,
      order,
      order_by,
    }
  };

  await client.setex("cachedFixtures", 3600, JSON.stringify(responseObj));

  return responseObj;
}

const FixturesController = {
  async create(req, res) {
    try {
      const { error } = validateFixture(req.body);

      if (error) {
        let { message } = error.details[0];
        message = message.replace(/"/g, '');
        return res.status(400).json({ message });
      }

      const { 
        home_team_id,
        away_team_id,
        home_team_goals: homeTeamGoals,
        away_team_goals: awayTeamGoals,
        match_date
      } = req.body;

      if (home_team_id == away_team_id) {
        return res.status(403).json({ error: "home and away teams must be different" })
      }

      const homeTeam = await Team.findById(home_team_id);

      if (!homeTeam) {
        return res.status(404).json({ error: "Home team does not exist" });
      }

      const awayTeam = await Team.findById(away_team_id);

      if (!awayTeam) {
        return res.status(404).json({ error: "Away team does not exist" });
      }

      const matchDate = new Date(match_date);

      const homeTeamOtherFixture = await teamFixtureOnMatchDate(homeTeam, matchDate);

      if (homeTeamOtherFixture) {
        return res.status(400).json({
          error: "Home team has another fixture on the day of the provided match_date"
        })
      }

      const awayTeamOtherFixture = await teamFixtureOnMatchDate(awayTeam, matchDate);

      if (awayTeamOtherFixture) {
        return res.status(400).json({
          error: "Away team has another fixture on the day of the provided match_date"
        })
      }

      estimated_match_end = new Date(matchDate.getTime() + (110 * 60 * 1000));
      if (estimated_match_end < Date.now() && (homeTeamGoals == null || awayTeamGoals ==null)){
        return res.status(400).json({
          error: "home_team_goals and away_team_goals must be provided for a fixture with a past match_date"
        });
      }

      let fixture = new Fixture({ homeTeam, awayTeam, homeTeamGoals, awayTeamGoals, matchDate });
      await fixture.save();

      await UpdateCache();

      res.status(201).json(
        {
          message: "Fixture created successfully",
          data: fixture.toJSON()
        }
      );
    }
    catch (err) {
      console.log(err);
      res.status(400).json({message: err.message});
    }
  },

  async show(req, res) {
    try {
      const { id } = req.params;

      const fixture = await Fixture.findById(id).populate('homeTeam').populate('awayTeam');

      if (fixture) {
        return res.status(200).json({
          message: "Fixture retrieved successfully",
          data: fixture.toJSON()
        });
      }
      else {
        return res.status(404).json({error: "Fixture doesn't exist"});
      }
    }
    catch (err) {
      if (err.name == "CastError"){
        return res.status(404).json({error: "Fixture doesn't exist"});
      }

      console.log(err);
      return res.status(400).json({error: err.message});
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;

      const fixture = await Fixture.findById(id);

      if (fixture) {
        await Fixture.deleteOne({ _id: id });

        res.status(200).json({
          message: "Fixture deleted successfully",
          data: fixture.toJSON()
        });
      }
      else {
        return res.status(404).json({error: "Fixture doesn't exist"});
      }
    }
    catch(err) {
      if (err.name == "CastError"){
        return res.status(404).json({error: "Fixture doesn't exist"});
      }

      console.log(err);
      return res.status(400).json({error: err.message});
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { home_team_goals: homeTeamGoals, away_team_goals: awayTeamGoals, match_date: matchDate } = req.body;

      const fixture = await Fixture.findById(id);

      if (!fixture) {
        return res.status(404).json({error: "Fixture doesn't exist"});
      }

      fixture.homeTeamGoals = homeTeamGoals !== undefined ? homeTeamGoals : fixture.homeTeamGoals;
      fixture.awayTeamGoals = awayTeamGoals !== undefined ? awayTeamGoals : fixture.awayTeamGoals;
      fixture.matchDate = matchDate !== undefined ? matchDate : fixture.matchDate;

      const homeTeamOtherFixture = await teamFixtureOnMatchDate(fixture.homeTeam, fixture.matchDate, fixture);

      if (homeTeamOtherFixture) {
        return res.status(400).json({
          error: "Home team has another fixture on the day of the provided match_date"
        })
      }

      const awayTeamOtherFixture = await teamFixtureOnMatchDate(fixture.awayTeam, fixture.matchDate, fixture);

      if (awayTeamOtherFixture) {
        return res.status(400).json({
          error: "Away team has another fixture on the day of the provided match_date"
        })
      }

      estimated_match_end = new Date(fixture.matchDate.getTime() + (110 * 60 * 1000));
      if (estimated_match_end < Date.now() && (homeTeamGoals == null || awayTeamGoals ==null)){
        return res.status(400).json({
          error: "home_team_goals and away_team_goals must be provided for a fixture with a past match_date"
        });
      }

      await fixture.save();

      res.status(200).json({
        message: "Fixture updated successfully",
        data: fixture.toJSON()
      });
    }
    catch(err) {
      if (err.name == "CastError"){
        return res.status(404).json({error: "Fixture doesn't exist"});
      }

      console.log(err);
      return res.status(400).json({error: err.message});
    }
  },

  async index(req, res) {
    try{
      let page = parseInt(req.query.page);
      page = (isNaN(page) || page < 1) ? 1 : page;

      let per_page = parseInt(req.query.per_page);
      per_page = (isNaN(per_page) || per_page < 1) ? 20 : per_page;

      let order_by_param = ["created_at", "match_date"].includes(req.query.order_by) ? req.query.order_by : "match_date";
      let order_by = '';
      
      if (order_by_param == "match_date") {
        order_by = "matchDate";
      }
      else if (order_by_param == "created_at") {
        order_by = "createdAt";
      }

      let order = (req.query.order !== undefined) && (["asc", "desc"].includes(req.query.order.toLowerCase())) ? req.query.order.toLowerCase() : "desc";

      const sortObj = {};
      sortObj[`${order_by}`] = order;

      const offset = (page - 1) * per_page;

      let filters = {};

      const start_date = req.query.start_date;
      const end_date = req.query.end_date;

      if (start_date){
        filters["matchDate"] = filters["matchDate"] || {};
        filters["matchDate"]["$gte"] = new Date(start_date);
      }

      if (end_date){
        filters["matchDate"] = filters["matchDate"] || {};
        filters["matchDate"]["$lt"] = new Date(end_date);
      }

      if (req.query.status) {
        filters["status"] = req.query.status;
      }

      const { query } = req.query;

      const teams = await Team.find({name: new RegExp(query, 'i')});

      if (query) {
        filters["$or"] = [
          { homeTeam: teams },
          { awayTeam: teams }
        ];
      }

      if (page == 1 && per_page == 20 && order_by == "matchDate" && order == "desc" && !query){
        return client.get("cachedFixtures", async (err, results) => {
          if (results){
            fixtures = JSON.parse(results)
          }
          else {
            fixtures = await UpdateCache();
          }

          return res.status(200).json(fixtures);
        });
      }

      const results = await Fixture.
                            find(filters).
                            populate('homeTeam').
                            populate('awayTeam').
                            limit(per_page).
                            skip(offset).
                            sort(sortObj);

      const total = await Fixture.countDocuments(filters);
      
      const page_count = Math.ceil(total / per_page);

      res.status(200).json({
        message: "Fixtures retrieved successfully",
        data: results,
        meta: {
          total,
          page,
          per_page,
          page_count,
          order,
          order_by: order_by_param
        }
      });
    }
    catch(err) {
      console.log(err);
      res.status(400).json({message: err.message});
    }
  },

  async generateLink (req, res) {
    try {
      const { id } = req.params;

      const uuidv1 = require('uuid/v1');

      const link = process.env.URL + "fixtures/link/" + uuidv1();

      const fixture = await Fixture.findById(id);

      if (!fixture) {
        return res.status(404).json({error: "Fixture doesn't exist"});
      }

      if (fixture.link) {
        return res.status(400).json({error: "Fixture already has a unique link"});
      }

      fixture.link = link;

      await fixture.save();

      res.status(200).json({
        message: "Fixture link generated successfully",
        data: fixture.toJSON()
      });
      
    }
    catch(err) {
      if (err.name == "CastError"){
        return res.status(404).json({error: "Fixture doesn't exist"});
      }

      console.log(err);
      return res.status(400).json({error: err.message});
    }
  },

  async getByLink (req, res) {
    try {
      const link = process.env.URL + "fixtures/link/" + req.params.id;

      const fixture = await Fixture.findOne({link});

      if (fixture) {
        return res.status(200).json({
          message: "Fixture retrieved successfully",
          data: fixture.toJSON()
        });
      }
      else {
        return res.status(404).json({error: "Fixture doesn't exist"});
      }

      res.status(200).send
    }
    catch(err) {
      if (err.name == "CastError"){
        return res.status(404).json({error: "Fixture doesn't exist"});
      }

      console.log(err);
      return res.status(400).json({error: err.message});
    }
  }
}

const teamFixtureOnMatchDate = async (team, date, fixture=null) => {
  let query = {
    homeTeam: team,
    matchDate: {
      "$gte": new Date(date.getFullYear(), date.getMonth(), date.getDate()), 
      "$lt": new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
    }
  };

  if (fixture != null){
    query["_id"] = { $ne: `${fixture._id}` };
  }

  const homeFixtures = await Fixture.countDocuments(query);

  if (homeFixtures > 0){
    return true;
  }

  delete query["homeTeam"];

  query["awayTeam"] = team; 

  const awayFixtures = await Fixture.countDocuments(query);

  if (awayFixtures > 0){
    return true;
  }

  return false
}

module.exports = FixturesController;