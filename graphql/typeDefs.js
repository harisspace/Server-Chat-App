const { gql } = require("apollo-server")

module.exports = gql`
  type User {
    username: String!
    id: ID!
    email: String!
    password: String!
    token: String
    createdAt: String!
    updatedAt: String
    latestMessage: Message
  }

  input RegisterInput {
    username: String!
    password: String!
    confirmPassword: String!
    email: String!
  }

  type Message {
    id: ID!
    from: String!
    to: ID!
    createdAt: String!
    body: String!
  }

  type Subscription {
    newMessage: Message
  }

  type Query {
    "return all of user but not user login"
    getUsers: [User]!
    "get all messages of user and destination"
    getMessages(userId: ID!, to: ID!): [Message]!
    "get all otheruser that user already send message"
    getUsersMessage(userId: ID!): [User]!
  }

  type Mutation {
    register(registerInput: RegisterInput): User!
    login(username: String!, password: String!): User!
    sendMessage(from: ID!, to: ID!, body: String!): Message!
  }
`
