const { ApolloServer } = require('apollo-server')
const mongoose = require('mongoose')

const typeDefs = require('./graphql/typeDefs')
const resolvers = require('./graphql/resolvers/index')
const { DB_URL } = require('./config')

const server = new ApolloServer({ typeDefs, resolvers, context: (ctx) => ctx })

// listen
mongoose.connect(DB_URL, { useCreateIndex: true, useUnifiedTopology: true, useNewUrlParser: true })
    .then(() => {
        console.log('DB CONNECT')
        return server.listen()
    })
    .then(({ url }) => {
        console.log(`Server running on port ${url}`)
    })
    .catch(err => console.error(err))