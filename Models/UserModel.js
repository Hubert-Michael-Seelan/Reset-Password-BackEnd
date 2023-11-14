const mongoose = require("mongoose");

const User = new mongoose.Schema({
    email:{ type:String,unique:true},
    password:String
})

mongoose.model("User",User)