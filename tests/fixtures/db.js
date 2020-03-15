const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const User = require('../../src/models/user')
const Post = require('../../src/models/post')
const { emptyS3Directory } = require('../../src/utils/s3')

const userOneId = new mongoose.Types.ObjectId()
const userOne = {
  _id: userOneId,
  displayName: 'Mike',
  email: 'mike@example.com',
  password: '56what!!',
  tokens: [{
    token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET)
  }]
}

const userTwoId = new mongoose.Types.ObjectId()
const userTwo = {
  _id: userTwoId,
  displayName: 'Jess',
  email: 'jess@example.com',
  password: 'myhouse099@@',
  tokens: [{
    token: jwt.sign({ _id: userTwoId }, process.env.JWT_SECRET)
  }]
}

const postOne = {
  _id: new mongoose.Types.ObjectId(),
  tag: 'First post',
  user: userOne._id
}

const postTwo = {
  _id: new mongoose.Types.ObjectId(),
  tag: 'Second post',
  user: userOne._id
}

const postThree = {
  _id: new mongoose.Types.ObjectId(),
  tag: 'Third post',
  user: userTwo._id
}

const setupDatabase = async () => {
  await User.deleteMany()
  await Post.deleteMany()
  await new User(userOne).save()
  await new User(userTwo).save()
  await new Post(postOne).save()
  await new Post(postTwo).save()
  await new Post(postThree).save()
  await emptyS3Directory('test/image')
  await emptyS3Directory('test/avatar')
}

module.exports = {
  userOneId,
  userOne,
  userTwoId,
  userTwo,
  postOne,
  postTwo,
  postThree,
  setupDatabase
}