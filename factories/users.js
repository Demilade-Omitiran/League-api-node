const { factory } = require('node-factory');

const UserFactory = factory(fake => ({
  username: fake.internet.userName(),
  email: fake.internet.email(),
  password: fake.internet.password(),
  isAdmin: fake.random.boolean()
}));

module.exports = UserFactory;