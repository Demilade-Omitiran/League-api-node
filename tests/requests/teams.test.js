const request = require('supertest');
const app = require('../../app');
const UserFactory = require('../../factories/users');
const TeamFactory = require('../../factories/teams');

const signup = async (user) => {
  user = user ? user: UserFactory.create();

  const res = await request(app)
    .post('/users/signup')
    .send(user)

  user.token = res.body.token;
  return user;
};

createTeam = async (user, team) => {
  const res = await request(app)
    .post('/teams/')
    .send(team)
    .set("Authorization", `Bearer ${user.oken}`)
}

beforeAll(async () => {
  let user = UserFactory.create({isAdmin: true});
  user = signup(user);

  for (let i = 0; i < 10; i++){
    let team = TeamFactory.create();
    createTeam(user, team);
  }
})

afterAll(async () => {
  await app.close();
})

describe('Get Teams', () => {
  it('retrieves the teams', async (done) => {
    let user = await signup();
    
    request(app)
      .get('/teams/')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200)
      .expect((res) => {
        res.body.message = "Teams retrieved successfully";
        res.body.data.count = 20;
        res.body.meta.page = 1;
        res.body.per_page = 20;
        res.body.order = 'desc';
        res.body.order_by = 'created_at';
      })
      .end(done);
  });
});

describe('Get Team by id', () => {
  it('retrieves the team', async (done) => {
    let user = await signup();
    
    request(app)
      .get('/teams/5d2d21021a3daf680f6d532f')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200)
      .expect((res) => {
        res.body.message = "Team retrieved successfully";
        res.body.data.id = "5d2d21021a3daf680f6d532f";
        res.body.data.name = "Burnley";
      })
      .end(done);
  });

  it('does not retrieve the team', async (done) => {
    let user = await signup();
    
    request(app)
      .get('/teams/a')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${user.token}`)
      .expect(404)
      .expect((res) => {
        res.body.error = "Team doesn't exist";
      })
      .end(done);
  });
});