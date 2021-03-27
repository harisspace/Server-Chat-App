const {
  UserInputError,
  ApolloError,
  AuthenticationError,
  withFilter,
} = require("apollo-server")
const checkAuth = require("../../utils/checkAuth")
const Message = require("../../models/Message")
const User = require("../../models/User")

module.exports = {
  Query: {
    getMessages: async (parent, { userId, to, offset }, context) => {
      const { decodedToken } = checkAuth(context)

      if (decodedToken && decodedToken.id === userId) {
        try {
          let messages = await Message.find({
            $and: [
              { $or: [{ from: userId }, { from: to }] },
              { $or: [{ to: userId }, { to: to }] },
            ],
          })
            .limit(35)
            .skip(offset)
            .sort({ createdAt: -1 })
          return messages
        } catch (err) {
          throw new ApolloError(err)
        }
      } else {
        throw new AuthenticationError(
          "Sorry cannot get the message, please try to login"
        )
      }
    },
  },

  Mutation: {
    sendMessage: async (parent, { body, from, to }, context) => {
      const { decodedToken } = checkAuth(context)

      if (body.trim() === "") {
        throw new UserInputError("Message cannot be empty")
      }

      // if username === from
      if (decodedToken.id === from) {
        // handle message send to user to/self
        if (to === from) {
          throw new ApolloError('Sorry can"t send message to your self')
        }
        // check if username destination exist or not
        try {
          const toUser = await User.findById(to)
          if (!toUser) {
            throw new AuthenticationError(
              "Sorry the user destination not exist"
            )
          }
        } catch (err) {
          throw new ApolloError("Bad Request", 500, {
            errors: err.message,
          })
        }
        const newMessage = new Message({
          from,
          to,
          body,
          createdAt: new Date().toISOString(),
          user: to,
        })
        const message = await newMessage.save()

        context.pubsub.publish("NEW_MESSAGE", {
          newMessage,
        })

        return message
      } else {
        throw new AuthenticationError(
          "Sorry your not allowed to send a message"
        )
      }
    },
  },

  Subscription: {
    newMessage: {
      subscribe: withFilter(
        (_, __, context) => {
          const { decodedToken, pubsub } = checkAuth(context)
          if (!decodedToken) throw new AuthenticationError("Unauthenticated")
          return pubsub.asyncIterator(["NEW_MESSAGE"])
        },
        ({ newMessage }, args, { decodedToken }) => {
          if (
            newMessage.from === decodedToken.id ||
            newMessage.to === decodedToken.id
          ) {
            return true
          }
          return false
        }
      ),
    },
  },
}
