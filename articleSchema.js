const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const articleSchema = new Schema({
    articleTitle: {
        type: String,
        unique: true,
        required:true
    },
    authorID: {
        type: Number,
        required:true
    },
    authorName: {
        type: String,
        required: true
    },
    articleCategory: {
        type: String,
        required: true
    },
    articleText: {
        type: String,
        required: true
    }
})

const articleModel = mongoose.model('article', articleSchema);
module.exports = articleModel;