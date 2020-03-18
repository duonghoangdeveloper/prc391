const express = require('express');
const sharp = require('sharp');
const { uploadFileS3, deleteFileS3, getFileS3 } = require('../utils/s3');
const upload = require('../utils/upload');
const Post = require('../models/post');
const auth = require('../middleware/auth');

const router = new express.Router();

router.post('/posts', auth, upload.single('image'), async (req, res) => {
  const post = new Post({
    ...req.body,
    user: req.user._id,
  });

  try {
    if (!req.file || !req.file.buffer) {
      throw new Error('Missing image');
    }

    const buffer = await sharp(req.file.buffer)
      .png()
      .toBuffer();

    // Delete old image from S3
    if (post.image && post.image.key) {
      await deleteFileS3(`${post.image.key}`);

      let success = false;

      // Make sure file has been already deleted
      try {
        await getFileS3(`${post.image.key}`);
      } catch (err) {
        if (err.statusCode === 404) {
          success = true;
        }
      }

      if (success) {
        post.image = null;
      } else {
        throw new Error(`Delete old avatar failed`);
      }
    }

    const data = await uploadFileS3({
      body: buffer,
      folder: 'image',
      filename: post._id.toString(),
    });

    post.image = {
      url: data.Location,
      key: data.Key || data.key,
    };

    await post.save();
    return res.status(201).send(post);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// GET /posts?completed=true
// GET /posts?limit=10&skip=20
// GET /posts?sortBy=createdAt:desc
router.get('/posts', auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === 'true';
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(':');
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: 'posts',
        match,
        options: {
          limit: parseInt(req.query.limit || 10),
          skip: parseInt(req.query.skip || 0),
          sort,
        },
      })
      .execPopulate();
    res.send(req.user.posts);
  } catch (e) {
    res.status(500).send();
  }
});

router.get('/posts/:id', auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const post = await Post.findOne({ _id, user: req.user._id });

    if (!post) {
      return res.status(404).send();
    }

    res.send(post);
  } catch (e) {
    res.status(500).send();
  }
});

router.patch('/posts/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.user._id });

    if (!post) {
      return res.status(404).send();
    }

    updates.forEach(update => (post[update] = req.body[update]));
    await post.save();
    res.send(post);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete('/posts/:id', auth, async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!post) {
      res.status(404).send();
    }

    res.send(post);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
