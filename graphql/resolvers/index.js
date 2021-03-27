const usersResolvers = require("./users")
const messagesResolvers = require("./messages")

module.exports = {
  Message: {
    cursor: (parent, { cursor }) => {
      if (!cursor) {
        console.log(parent.messages)
      }
    },
  },

  Query: {
    ...usersResolvers.Query,
    ...messagesResolvers.Query,
  },

  Mutation: {
    ...usersResolvers.Mutation,
    ...messagesResolvers.Mutation,
  },

  Subscription: {
    ...messagesResolvers.Subscription,
  },
}
