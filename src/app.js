const express = require('express');
const cors = require('cors');
require('./db/mongoose');
const userRouter = require('./router/user');
const postRouter = require('./router/post');

const app = express();

app.use(express.json());
app.use(cors());
app.use(userRouter);
app.use(postRouter);
app.get('/', (req, res) => res.send('PRC391 group project!'));

module.exports = app;
