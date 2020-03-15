const mongoose = require('mongoose');
const validator = require('validator');
const bcript = require('bcryptjs');
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Email is invalid');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 6,
      validate(value) {
        if (value.toLowerCase().includes('password')) {
          throw new Error('Password cannot contain "password"!');
        }
      },
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    avatar: {
      key: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

userSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'user'
})

// Hash the plain text password before saving
userSchema.pre('save', async function(next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcript.hash(user.password, 8);
  }
  next();
});

userSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, secret);

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

userSchema.methods.toJSON = function() {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;

  return userObject;
};

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Unable to login');
  }
  const isMatch = await bcript.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Unable to login');
  }
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
