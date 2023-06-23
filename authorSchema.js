const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const authorSchema = new Schema({
    authorID: {
        type : String,
        required : true,
        unique: true
    },
    authorName: {
        type : String,
        required : true
    },
    authorAge: {
        type : Number,
        required : true
    },
    authorAdd: {
        type : String,
        required : true
    },
    authorBio: {
        type : String,
        required : true
    },
    authorEmail: {
        type : String,
        required : true
    },
    authorPassword: {
        type : String,
        required : true,
        minlength: 6
    }
})

const authorModel = mongoose.model("Author", authorSchema)
module.exports = authorModel;