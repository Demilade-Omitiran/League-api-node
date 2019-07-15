const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
require('dotenv/config');

const app = express();

app.use(bodyParser.json());

const UserRouter = require("./api/routes/users");
const TeamRouter = require("./api/routes/teams");
const FixtureRouter = require("./api/routes/fixtures");

app.use("/users", UserRouter);
app.use("/teams", TeamRouter);
app.use("/fixtures", FixtureRouter);

app.get('/', (req, res) => {
  res.send("league-api");
});

app.use((req, res, next) => {
  res.status(404).send();
})

app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).send("Something went wrong");
})

mongoose.connect(
  process.env.DB_CONNECTION_STRING, 
  { useNewUrlParser: true }, 
  () => console.log("Connected to db!")
);

app.listen(process.env.PORT || 8000)