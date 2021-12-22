const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  userName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  pronouns: { type: String },
  website: { type: String },
  bio: { type: String },
  photo: { type: String },
  followers: [{ type: ObjectId, ref: "User" }], // 나를 follow하는 user list
  following: [{ type: ObjectId, ref: "User" }], // 내가 follow하는 user list
});

const User = mongoose.model("User", userSchema);
module.exports = User;
