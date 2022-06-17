const mongoose = require('mongoose');

const { Schema } = mongoose;

// Create the User Schema.
const PostSchema = new Schema({
  userId: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
  },
  body: {
    type: String,
  },
});

const Post = mongoose.model('Post', PostSchema);

module.exports = Post;
