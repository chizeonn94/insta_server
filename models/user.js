const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  userName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  pronouns: { type: String },
  website: { type: String },
  bio: { type: String },
  photo: { type: String },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
