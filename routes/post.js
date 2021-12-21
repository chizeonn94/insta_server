const express = require("express");
const postRouter = express.Router();
const mongoose = require("mongoose");
const requireLogin = require("../middleware/requireLogin");
const Post = require("../models/post");
const { ObjectId } = mongoose.Types;

postRouter.get("/allpost", requireLogin, (req, res) => {
  Post.find()
    .populate("postedBy", "userName _id photo")
    .populate("likes", "userName _id photo")
    .then((posts) => res.status(200).json({ posts }))
    .catch((err) => {
      res.status(500).json({ error: err });
    });
});

postRouter.post("/createpost", requireLogin, (req, res) => {
  console.log("arrived api");
  console.log("req.body >>>", req.body);
  const { title, body, photo } = req.body;
  if (!title || !body || !photo) {
    res.status(422).json({ error: "please add all the fields" });
  }
  req.user.password = undefined;
  //console.log(">>>>", req.user);
  const postToUpload = new Post({
    title,
    body,
    photo,
    postedBy: req.user._id,
    createdAt: new Date().getTime(),
  });
  postToUpload
    .save()
    .then((posted) => {
      console.log("posted", posted);
      res.status(201).json({ post: posted });

      //next();
    })
    .catch((err) => {
      console.log({ err });
    });
});
postRouter.put("/like/:id", requireLogin, async (req, res) => {
  console.log(req.params.id);
  //console.log(ObjectId(req.params.id));
  Post.findByIdAndUpdate(
    req.params.id,
    {
      $push: { likes: req.user._id },
    },
    { new: true },
    (error, result) => {
      if (error) {
        return res.status(422).send({ error });
      }
      res.status(201).send({ result });
    }
  );
});
postRouter.put("/unlike/:id", requireLogin, async (req, res) => {
  console.log(req.params.id);
  //console.log(ObjectId(req.params.id));
  Post.findByIdAndUpdate(
    req.params.id,
    {
      $pull: { likes: req.user._id },
    },
    { new: true }
  ).exec((err, result) => {
    if (err) {
      return res.status(422).send({ error: err });
    }
    res.status(201).send({ result });
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
