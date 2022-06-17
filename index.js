const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');
const multer = require('multer');
const { createServer, GraphQLYogaError } = require('graphql-yoga');

const schema = require('./graphql/schema');

const app = express();

// configure upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// config mongodb
const db = 'mongodb://localhost:27017/mydb';
mongoose
  .connect(db, {
    useNewUrlParser: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// upload file with multer
app.post('/profile', upload.single('avatar'), (req, res) => {
  const { file } = req;
  if (!file) {
    const error = new Error('Please upload a file');
    error.httpStatusCode = 400;
    return res.json({
      message: 'Please provide your file',
    });
  }
  return res.send(file);
});

// sample rest api
app.get('/api', (req, res) => {
  res.json({
    message: 'Hello from express server to get the Restfull api',
  });
});

// config graphql server
const server = createServer({
  schema,
  context: async ({ req }) => {
    try {
      let auth = {};
      // return a context obj with our token. if any!
      const authen = req.headers.authorization || '';
      // console.log();
      if (authen) {
        const [, token] = authen.split(' ');
        auth = jwt.verify(token, 'shhhhh');
        return { auth };
      }
    } catch (error) {
      console.log(error);
    }
  },
});

const authenMidleware = (req, res, next) => {
  // handler authen here
  const auth = true;
  if (auth) return next();
};

// Bind GraphQL Yoga to `/graphql` endpoint with middleware
app.use('/graphql', authenMidleware, server);

// start the server and explore http://localhost:4000/graphql
app.listen(4000, () => {
  console.log('Running a GraphQL API server at http://localhost:4000/graphql');
});
