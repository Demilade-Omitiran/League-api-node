const redis = require('redis');
require('dotenv/config');

module.exports = {
  client () {
    return redis.createClient(process.env.REDIS_URL);
  },
};
