const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const postSchema = new mongoose.Schema({
  title: { type: String },
  body: { type: String },
  photo: { type: String, required: true },
  likes: [{ type: ObjectId, ref: "User" }],
  postedBy: { type: ObjectId, ref: "User" },
  createdAt: { type: Number, required: true },
  comments: [{ text: String, postedBy: { type: ObjectId, ref: "User" } }],
});

const Post = mongoose.model("Post", postSchema);
module.exports = Post;
