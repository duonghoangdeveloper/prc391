const express = require('express');
const sharp = require('sharp');
const multer = require('multer');

const { uploadFileS3, deleteFileS3, getFileS3 } = require('../utils/s3');
const User = require('../models/user');
const auth = require('../middleware/auth');

const router = new express.Router();

router.get('/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).send(users);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post('/users', async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    // sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (error) {
    res.status(400).send();
  }
});

router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      token => token.token !== req.token
    );
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
});

router.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdate = ['name', 'email', 'password'];
  const isValidOperation = updates.every(update =>
    allowedUpdate.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }
  try {
    const { user } = req;
    updates.forEach(update => (user[update] = req.body[update]));
    await user.save();
    res.send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (error) {
    res.status(500).send();
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload a image'));
    }
    cb(undefined, true);
  },
});

router.post(
  '/users/me/avatar',
  auth,
  upload.single('avatar'),
  async (req, res) => {
    try {
      const buffer = await sharp(req.file.buffer)
        .resize({ width: 250, height: 250 })
        .png()
        .toBuffer();
      // req.user.avatar = buffer;

      // Delete old avatar from S3
      if (req.user.avatar && req.user.avatar.key) {
        await deleteFileS3(`${req.user.avatar.key}`);

        let success = false;

        // Make sure file has been already deleted
        try {
          await getFileS3(`${req.user.avatar.key}`);
        } catch (err) {
          if (err.statusCode === 404) {
            success = true;
          }
        }

        if (success) {
          req.user.avatar = null;
        } else {
          throw new Error(`Delete old avatar failed`);
        }
      }

      const data = await uploadFileS3({
        body: buffer,
      });

      req.user.avatar = {
        url: data.Location,
        key: data.Key || data.key,
      };

      await req.user.save();
      res.send(data.Location);
    } catch (error) {
      res.status(400).send({ error: error.message });
    }
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.delete('/users/me/avatar', auth, async (req, res) => {
  try {
    // Delete old avatar from S3
    if (req.user.avatar && req.user.avatar.key) {
      await deleteFileS3(`${req.user.avatar.key}`);

      let success = false;

      // Make sure file has been already deleted
      try {
        await getFileS3(`${req.user.avatar.key}`);
      } catch (err) {
        if (err.statusCode === 404) {
          success = true;
        }
      }

      if (success) {
        req.user.avatar = null;
      } else {
        throw new Error(`Delete old avatar failed`);
      }
    }

    req.user.avatar = undefined;
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (error) {
    res.status(400).send();
  }
});

module.exports = router;
