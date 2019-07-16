const request = require('supertest');
const app = require('../../app');
const UserFactory = require('../../factories/users');

afterAll(async () => {
  await app.close();
})

const signup = async () => {
  const user = UserFactory.create();

  const res = await request(app)
    .post('/users/signup')
    .send(user)

  user.token = res.body.token;
  return user;
};

const login = async (user) => {
  const res = await request(app)
    .post('/users/login')
    .send({ username: user.username, password: user.password });

  if (res.status == '200'){
    user.token = res.body.token;
  }
  return user;
}

describe('Signup', () => {
  it('succeeds with valid details', async (done) => {
    const demoUser = UserFactory.create();

    request(app)
      .post('/users/signup')
      .send(demoUser)
      .set('Accept', 'application/json')
      .expect(201)
      .expect((res) => {
        res.body.message = "User created successfully";
        res.body.data.username = demoUser.username;
        res.body.data.email = demoUser.email;
        res.body.data.isAdmin = demoUser.isAdmin;
      })
      .end(done);
   });

   it('fails with invalid details', async (done) => {
    const demoUser = UserFactory.create({email: "a"});

    request(app)
      .post('/users/signup')
      .send(demoUser)
      .set('Accept', 'application/json')
      .expect(400)
      .end(done);
   });
});

describe('Login', () => {
  it('succeeds with valid credentials', async (done) => {
    let user = await signup();
    
    request(app)
      .post('/users/login')
      .send({ username: user.username, password: user.password })
      .set('Accept', 'application/json')
      .expect(200)
      .expect((res) => {
        res.body.message = "Login successful";
        res.body.data.username = user.username;
        res.body.data.email = user.email;
        res.body.data.isAdmin = user.isAdmin;
      })
      .end(done);
  });

  it('fails with invalid credentials', async (done) => {
    let user = await signup();
    
    request(app)
      .post('/users/login')
      .send({ username: user.username, password: "pass" })
      .set('Accept', 'application/json')
      .expect(401)
      .expect((res) => {
        res.body.message = 'Invalid username or password';
      })
      .end(done);
  });
});

describe('Logout', () => {
  it('succeeds with a valid token', async (done) => {
    let user = await signup();
    user = await login(user);
    
    request(app)
      .post('/users/logout')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200)
      .expect((res) => {
        res.body.message = "Logged out successfully";
      })
      .end(done);
  });

  it('fails with an invalid token', async (done) => {
    let user = await signup();
    user = await login(user);
    
    request(app)
      .post('/users/logout')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer something`)
      .expect(401)
      .expect((res) => {
        res.body.error = 'Invalid token';
      })
      .end(done);
  });
});