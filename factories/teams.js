const { factory } = require('node-factory');

const TeamFactory = factory(fake => ({
  name: `${fake.name.findName()}${Math.floor(Math.random() * 1000)} FC`
}));

module.exports = TeamFactory;