const typeDefinitions = `
  type Query {
    info: Info!
    posts(userId: Int, start: Int!, count: Int!): [Post]
    users: [User]
  }

  type Mutation {
    # postLink(url: String!, description: String!): Link!url
    addPost(userId: Int!, title: String, body: String): Post!
    deletePost(postId: String!): Post!
    updatePost(postId: String!, input: PostInput!): Post!
    login(userId: Int!, password: String!): String!
    broadcastRandomNumber: Boolean
  }

  type Subscription {
    somethingChanged: Result
    postChanged: Post
  }

  type AuthPayload {
    token: String
    user: User
  }

  input PostInput {
    title: String
    body: String
  }

  type Post {
    id: ID
    title: String
    body: String
  }

  type User {
    userId: Int!
    email: String
    # password: String!
    name: String
  }

  type Result {
    id: String
  }

  type Info {
    name: String
    avatarUrl: String
  }
`;

module.exports = typeDefinitions;
