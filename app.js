const express = require('express');
const mongoose = require('mongoose');
require('dotenv/config');

const app = express();

app.get('/', (req, res) => {
  res.send("league-api");
});

mongoose.connect(
  process.env.DB_CONNECTION_STRING, 
  { useNewUrlParser: true }, 
  () => console.log("Connected to db!")
);

app.listen(8000)