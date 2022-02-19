const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const postSchema = new mongoose.Schema({
  body: { type: String },
  photo: { type: String, required: true },
  likes: [{ type: ObjectId, ref: "User" }],
  postedBy: { type: ObjectId, ref: "User" },
  createdAt: { type: Number },
  comments: [{ text: String, postedBy: { type: ObjectId, ref: "User" } }],
});

postSchema.pre("save", function (next) {
  this.createdAt = Date.now();
  next();
});
const Post = mongoose.model("Post", postSchema);
module.exports = Post;
