const { model, Schema } = require('mongoose')

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    imageUrl: {
        type: String
    }
}, { timestamps: true })

const user = model('User', userSchema)

module.exports = user