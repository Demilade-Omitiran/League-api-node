const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send("league-api");
});

app.listen(8000)