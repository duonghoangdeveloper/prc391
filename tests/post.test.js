const request = require('supertest')
const app = require('../src/app')
const Post = require('../src/models/post')
const {
  userOne,
  userTwo,
  postOne,
  postTwo,
  postThree,
  setupDatabase
} = require('./fixtures/db')

beforeEach(setupDatabase)

test('Should not create post without image for user', async () => {
  const response = await request(app)
    .post('/posts')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      tag: 'Jess',
    })
    .expect(400)
})

test('Should create post for user', async () => {
  const response = await request(app)
    .post('/posts')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .field({
      tag: 'Jess',
    })
    .attach('image', 'tests/fixtures/profile-pic.jpg')
    .expect(201)
  const post = await Post.findById(response.body._id)
  expect(post).not.toBeNull()
  expect(post.image).not.toBeNull()
  expect(post.image.url).not.toBeNull()
})

test('Should fetch user posts', async () => {
  const response = await request(app)
    .get('/posts')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
  expect(response.body.length).toEqual(2)
})

test('Should not delete other users posts', async () => {
  const response = await request(app)
    .delete(`/posts/${postOne._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404)
  const post = await Post.findById(postOne._id)
  expect(post).not.toBeNull()
})
