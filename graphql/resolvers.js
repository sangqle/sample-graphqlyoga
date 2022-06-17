const { GraphQLError } = require('graphql');
const { RedisPubSub } = require('graphql-redis-subscriptions');
const { GraphQLYogaError } = require('graphql-yoga');
const jwt = require('jsonwebtoken');
const { default: mongoose } = require('mongoose');

const Post = require('../models/post');
const User = require('../models/user');

const pubsub = new RedisPubSub();
const SOMETHING_CHANGED_TOPIC = 'something_changed';
const POST_CHANGED = 'post_changed';

const resolvers = {
  Query: {
    info: async (_, args, ctx) => {
      const { auth } = ctx;
      const user = await User.findOne({ userId: auth.userId });
      return {
        name: user.name,
        avatarUrl: 'https://image.com/imag.jpg',
      };
    },
    posts: async (_, { userId, start, count }) => {
      const where = {};
      if (userId) where.userId = userId;
      const rs = await Post.find({ ...where })
        .skip(start)
        .limit(count);
      // handler result here
      return rs;
    },
    users: async (_, args, ctx) => {
      const whiteListAdmin = [];
      const { userId } = ctx.auth;
      if (!whiteListAdmin.includes(userId)) {
        throw new GraphQLYogaError('Permission deny');
      }
      let users = await User.find({});
      users = users.map((user) => {
        user.userId *= 3;
        return user;
      });
      return users;
    },
  },
  Mutation: {
    addPost: async (parent, args) => {
      // validate userId
      const user = await User.findOne({ userId: args.userId }).exec();
      if (!user) {
        throw new GraphQLYogaError(`User with id '${args.userId}' not found.`);
      }
      const post = new Post({ ...args });
      // eslint-disable-next-line no-return-await
      return await post.save();
    },
    deletePost: async (_, { postId }) => {
      // find and remove post from db
      const isDeleted = await Post.findOneAndDelete({
        _id: mongoose.Types.ObjectId(postId),
      });
      if (!isDeleted) {
        throw new GraphQLYogaError(`Can not remove post with Id :${postId}`);
      }
      return isDeleted;
    },
    updatePost: async (_, { postId, input }) => {
      let rs = null;
      try {
        const filter = { _id: mongoose.Types.ObjectId(postId) };
        const postUpdated = await Post.findOneAndUpdate(filter, input);
        if (!postUpdated) {
          throw new GraphQLYogaError(`Can not upadate post with Id :${postId}`);
        }
        rs = await Post.findOne(filter);
        // pubsub when new update on post
        console.log(rs);
        pubsub.publish(POST_CHANGED, {
          postChanged: rs,
        });
      } catch (error) {
        throw new GraphQLYogaError(error);
      }
      return rs;
    },
    broadcastRandomNumber: () => {
      pubsub.publish(SOMETHING_CHANGED_TOPIC, {
        somethingChanged: { id: Math.floor(Math.random() * 10) },
      });
      return true;
    },
    login: async (parent, { userId }) => {
      const token = jwt.sign({ userId }, 'shhhhh');
      const user = await User.findOne({ userId });
      if (!user) {
        throw new GraphQLYogaError('No such user found');
      }
      return token;
    },
  },
  Subscription: {
    somethingChanged: {
      subscribe: () => pubsub.asyncIterator(SOMETHING_CHANGED_TOPIC),
    },
    postChanged: {
      subscribe: () => pubsub.asyncIterator(POST_CHANGED),
    },
  },
};

module.exports = resolvers;
