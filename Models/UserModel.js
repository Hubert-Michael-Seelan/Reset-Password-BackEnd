const mongoose = require("mongoose");

const User = new mongoose.Schema({
    firstName: String,
    email:{ type:String,unique:true},
    password:String
})

mongoose.model("User",User)