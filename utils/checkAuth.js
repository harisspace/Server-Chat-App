const jwt = require("jsonwebtoken")
const { AuthenticationError, PubSub } = require("apollo-server")

const pubsub = new PubSub()

const { SECRET_KEY } = require("../config")

const checkAuth = (context) => {
  let token
  if (context.req && context.req.headers.authorization) {
    token = context.req.headers.authorization.split("Bearer ")[1]
    console.log("masuk req")
  } else if (context.connection && context.connection.context.Authorization) {
    console.log("masuk connect")
    token = context.connection.context.Authorization.split("Bearer ")[1]
  }
  if (token) {
    jwt.verify(token, SECRET_KEY, (err, decodedToken) => {
      if (err) {
        throw new AuthenticationError("Unaunthecated")
      }
      context.decodedToken = decodedToken
    })
    // console.log(decodedToken)
  }
  context.pubsub = pubsub
  return context
}

module.exports = checkAuth
