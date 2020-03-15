const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  tag: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  image: {
    key: {
      type: String,
    },
    url: {
      type: String,
    },
  },
});

const Post = mongoose.model('Post', postSchema)

module.exports = Post