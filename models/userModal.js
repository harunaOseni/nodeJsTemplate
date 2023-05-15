const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: "First name is required",
  },
  username: {
    type: String,
    require: "Last name is required",
  },
  email: {
    type: String,
    require: "Email is required!",
  },
  password: {
    type: Number,
    require: "Pin is required!",
  },
  verified: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("User", userSchema);
