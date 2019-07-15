const { Team, validateTeam } = require('../models/Team');
const redis = require('redis');
const client = redis.createClient();

// Print redis errors to the console
client.on('error', (err) => {
  console.log("Error " + err);
});

const UpdateCache = async () => {
  const results = await Team.find().limit(20).sort({ createdAt: "desc" });
  const total = await Team.count();
  const page = 1;
  const per_page = 20;
  const page_count = Math.ceil(total / per_page);
  const order = "desc";
  const order_by = "created_at";

  responseObj = {
    message: "Teams retrieved successfully",
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

  await client.setex("cachedTeams", 3600, JSON.stringify(responseObj));

  return responseObj;
}

const TeamsController = {
  async create(req, res) {
    try {
      const { error } = validateTeam(req.body);

      if (error) {
        let { message } = error.details[0];
        message = message.replace(/"/g, '');
        return res.status(400).json({ message });
      }

      const { name } = req.body;

      const foundTeam = await Team.findOne({name});

      if (foundTeam) {
        return res.status(403).json({error: "Team name already in use"});
      }

      let team = new Team({ name });
      await team.save();

      await UpdateCache();

      res.status(201).json(
        {
          message: "Team created successfully",
          data: team.toJSON()
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

      const team = await Team.findById(id);

      if (team) {
        return res.status(200).json({
          message: "Team retrieved successfully",
          data: team.toJSON()
        });
      }
      else {
        return res.status(404).json({error: "Team doesn't exist"});
      }
    }
    catch (err) {
      if (err.name == "CastError"){
        return res.status(404).json({error: "Team doesn't exist"});
      }

      console.log(err);
      return res.status(400).json({error: err.message});
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;

      const team = await Team.findById(id);

      if (team) {
        await Team.deleteOne({ _id: id });

        res.status(200).json({
          message: "Team deleted successfully",
          data: team.toJSON()
        });
      }
      else {
        return res.status(404).json({error: "Team not found"});
      }
    }
    catch(err) {
      if (err.name == "CastError"){
        return res.status(404).json({error: "Team doesn't exist"});
      }

      console.log(err);
      return res.status(400).json({error: err.message});
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const update = await Team.update({ _id: id }, { name });

      if (update.n == 0){
        return res.status(404).json({error: "Team not found"});
      }

      const team = await Team.findById(id);

      res.status(200).json({
        message: "Team updated successfully",
        data: team.toJSON()
      });
    }
    catch(err) {
      if (err.name == "CastError"){
        return res.status(404).json({error: "Team doesn't exist"});
      }

      console.log(err);
      return res.status(400).json({error: err.message});
    }
  },

  async index(req, res) {
    try {
      let page = parseInt(req.query.page);
      page = (isNaN(page) || page < 1) ? 1 : page;

      let per_page = parseInt(req.query.per_page);
      per_page = (isNaN(per_page) || per_page < 1) ? 20 : per_page;

      let order_by = ["createdAt", "name"].includes(req.query.order_by) ? req.query.order_by : "createdAt";

      let order = (req.query.order !== undefined) && (["asc", "desc"].includes(req.query.order.toLowerCase())) ? req.query.order.toLowerCase() : "desc";

      const sortObj = {};
      sortObj[`${order_by}`] = order;

      const offset = (page - 1) * per_page;

      const { query } = req.query;

      if (page == 1 && per_page == 20 && order_by == "createdAt" && order == "desc" && !query){
        return client.get("cachedTeams", async (err, results) => {
          if (results){
            teams = JSON.parse(results)
          }
          else {
            teams = await UpdateCache();
          }

          return res.status(200).json(teams);
        });
      }

      const results = await Team.find({name: new RegExp(query, 'i')}).limit(per_page).skip(offset).sort(sortObj);

      const total = await Team.countDocuments({name: new RegExp(query, 'i')});
      
      const page_count = Math.ceil(total / per_page);

      responseObj = {
        message: "Teams retrieved successfully",
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

      res.status(200).json(responseObj);
    }
    catch(err) {
      console.log(err);
      return res.status(400).json({error: err.message});
    }
  }
}

module.exports = TeamsController;