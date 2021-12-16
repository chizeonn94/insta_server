const express = require("express");
const postRouter = express.Router();
const mongoose = require("mongoose");
const requireLogin = require("../middleware/requireLogin");
const post = require("../models/post");

postRouter.get("/allpost", requireLogin, (req, res) => {
  post
    .find()
    .populate("postedBy", "name _id")
    .then((posts) => res.status(200).json({ posts }))
    .catch((err) => {
      res.status(500).json({ error: err });
    });
});
postRouter.post("/createpost", requireLogin, (req, res, next) => {
  const { title, body, photo } = req.body;
  if (!title || !body || !photo) {
    res.status(422).json({ error: "please add all the fields" });
  }
  req.user.password = undefined;

  const postToUpload = new post({ title, body, photo, postedBy: req.user._id });
  postToUpload
    .save()
    .then((posted) => {
      console.log("posted", posted);
      res.status(201).json({ post: posted });

      next();
    })
    .catch((err) => {
      res.json({ err });
    });
});

postRouter.get("/mypost", requireLogin, (req, res) => {
  post
    .find({ postedBy: req.user._id })
    .populate("postedBy", "name _id")
    .then((myPosts) => {
      res.status(201).json({ myPosts });
    })
    .catch((err) => {
      console.log(err);
    });
});
module.exports = postRouter;
