const mongoose = require("mongoose")


//const mongoDBString = "mongodb://localhost:27017/myblog"
const mongoDBString = "mongodb://127.0.0.1:27017/myblog"
async function connect() {
    try {
      let c = await mongoose.connect(mongoDBString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected to MongoDB!');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
  }
  
  module.exports = connect;