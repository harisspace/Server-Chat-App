const { model, Schema } = require('mongoose')

const messageSchema = new Schema({
    body: {
        type: String,
        required: true
    },
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    createdAt: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
})

const message = model('Messages', messageSchema)

module.exports = message