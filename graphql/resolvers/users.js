const { UserInputError } = require("apollo-server")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const User = require("../../models/User")
const Message = require("../../models/Message")
const {
  validateRegisterInput,
  validateLoginInput,
} = require("../../utils/validator")
const { SECRET_KEY } = require("../../config")
const checkAuth = require("../../utils/checkAuth")

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    SECRET_KEY,
    { expiresIn: "2h" }
  )
}

module.exports = {
  Query: {
    getUsers: async (_, __, context) => {
      if (context.req && context.req.headers.authorization) {
        const { decodedToken } = checkAuth(context)
        if (decodedToken) {
          try {
            let users = await User.find({ _id: { $ne: decodedToken.id } })
            const messageFromMe = await Message.find({
              from: decodedToken.id,
            }).sort({ createdAt: -1 })

            users = users.map((otherUser) => {
              const latestMessage = messageFromMe.find(
                (m) => m.from === otherUser.id || m.to === otherUser.id
              )
              // console.log(latestMessage)
              otherUser.latestMessage = latestMessage
              return otherUser
            })

            return users
          } catch (err) {
            throw new Error(err)
          }
        }
      }
    },

    getUsersMessage: async (_, { userId }, context) => {
      if (context.req && context.req.headers.authorization) {
        const { decodedToken } = checkAuth(context)
        if (decodedToken) {
          try {
            const allMessageFromMe = await Message.find({
              $or: [{ from: userId }, { to: userId }],
            })
              .populate("user")
              .sort({ createdAt: -1 })
            let users = allMessageFromMe.map((otherUser) => otherUser.user)
            users = users.filter((user) => user.id !== userId)
            let singleUsers = []
            users.forEach((user) => {
              if (singleUsers.length <= 0) {
                singleUsers.unshift(user)
              } else {
                for (let i = 0; i < singleUsers.length; i++) {
                  if (singleUsers[i].username === user.username) {
                    break
                  } else if (
                    singleUsers[i].username !== user.username &&
                    i === singleUsers.length - 1
                  ) {
                    singleUsers.push(user)
                  }
                }
              }
            })

            users = singleUsers.map((otherUser) => {
              const latestMessage = allMessageFromMe.find(
                (m) => m.from === otherUser.id || m.to === otherUser.id
              )
              // console.log(latestMessage)
              otherUser.latestMessage = latestMessage
              return otherUser
            })

            return users
          } catch (err) {
            throw new Error(err)
          }
        }
      }
    },
  },

  Mutation: {
    register: async (
      _,
      { registerInput: { username, password, confirmPassword, email } }
    ) => {
      const { errors, valid } = validateRegisterInput(
        username,
        email,
        password,
        confirmPassword
      )
      if (!valid) {
        throw new UserInputError("Errors", { errors })
      }

      // make sure user doesnt already exist
      const user = await User.findOne({ username })

      if (user) {
        throw new UserInputError("Username is taken", {
          errors: {
            username: "Username already exist",
          },
        })
      }

      // hash password
      const salt = await bcrypt.genSalt(10)
      password = await bcrypt.hash(password, salt)

      const newUser = new User({
        username,
        email,
        password,
        createdAt: new Date().toISOString(),
      })

      try {
        const resUser = await newUser.save()
        const token = generateToken(resUser)
        // console.log(resUser._doc)
        return {
          token,
          id: resUser._id,
          ...resUser._doc,
        }
      } catch (err) {
        if (err.code === 11000) {
          throw new UserInputError("Email is taken", {
            errors: {
              email: "Email already exist",
            },
          })
        }
        console.error(err)
        throw new Error("errors")
      }
    },

    login: async (_, { username, password }) => {
      const { errors, valid } = validateLoginInput(username, password)

      if (!valid) {
        throw new UserInputError("Errors", { errors })
      }

      // TODO: check the username
      const user = await User.findOne({ username })
      if (!user) {
        errors.general = "User not found"
        throw new UserInputError("User not found", { errors })
      }
      // TODO: compare hashing password
      const match = await bcrypt.compare(password, user.password)
      if (!match) {
        errors.general = "Wrong credential"
        throw new UserInputError("Wrong credential", { errors })
      }

      const token = generateToken(user)
      return {
        token,
        id: user._id,
        ...user._doc,
      }
    },
  },
}
