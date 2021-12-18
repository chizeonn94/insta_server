const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  photo: { type: String, required: true },
  likes: [{ type: ObjectId, ref: "User" }],
  postedBy: { type: ObjectId, ref: "User" },
});

const post = mongoose.model("Post", postSchema);
module.exports = post;
