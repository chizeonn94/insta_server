const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  photo: { type: String, required: true },
  likes: [{ type: ObjectId, ref: "User" }],
  postedBy: { type: ObjectId, ref: "User" },
  createdAt: { type: Number, required: true },
});

const Post = mongoose.model("Post", postSchema);
module.exports = Post;
