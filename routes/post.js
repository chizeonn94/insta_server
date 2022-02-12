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
    .populate({
      path: "comments",
      // Get friends of friends - populate the 'friends' array for every friend
      populate: { path: "postedBy", select: "userName, _id photo" },
    })

    .then((posts) => res.status(200).json({ posts }))
    .catch((err) => {
      res.status(500).json({ error: err });
    });
});

postRouter.get("/getsubpost", requireLogin, (req, res) => {
  Post.find({ postedBy: { $in: [...req.user.following, req.user._id] } })
    .populate("postedBy", "userName _id photo")
    .populate("likes", "userName _id photo")
    .populate({
      path: "comments",
      // Get friends of friends - populate the 'friends' array for every friend
      populate: { path: "postedBy", select: "userName, _id photo" },
    })

    .then((posts) => res.status(200).json({ posts }))
    .catch((err) => {
      res.status(500).json({ error: err });
    });
});

postRouter.post("/createpost", requireLogin, (req, res) => {
  console.log("arrived api");
  console.log("req.body >>>", req.body);
  const { body, photo } = req.body;
  if (!photo) {
    return res.status(422).json({ error: "photo is required" });
  }
  req.user.password = undefined;
  //console.log(">>>>", req.user);
  const postToUpload = new Post({
    body,
    photo,
    postedBy: req.user._id,
    createdAt: new Date().getTime(),
  });
  postToUpload
    .save()
    .then((posted) => {
      console.log("posted", posted);
      return res.status(201).json({ post: posted });

      //next();
    })
    .catch((err) => {
      console.log({ err });
    });
});
postRouter.get("/post/:id", requireLogin, (req, res) => {
  Post.findById(
    req.params.id // post id
  )
    .populate("postedBy", "userName _id photo")
    .populate("likes", "userName _id photo")
    .populate({
      path: "comments",
      // Get friends of friends - populate the 'friends' array for every friend
      populate: { path: "postedBy", select: "userName _id photo" },
    })
    .then((post) => {
      res.status(201).json({ post });
    })
    .catch((err) => {
      console.log(err);
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
    { new: true }
  ).exec((error, result) => {
    if (error) {
      return res.status(422).send({ error });
    }
    return res.status(201).send({ result });
  });
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
    return res.status(201).send({ result });
  });
});
postRouter.get("/mypost", requireLogin, (req, res) => {
  Post.find({ postedBy: req.user._id })
    .populate("postedBy", "userName _id")
    .then((myPosts) => {
      res.status(201).json({ myPosts });
    })
    .catch((err) => {
      console.log(err);
    });
});
postRouter.put("/comment/:id", requireLogin, (req, res) => {
  const comment = { text: req.body.text, postedBy: req.user._id };

  Post.findByIdAndUpdate(
    req.params.id, // post id
    { $push: { comments: comment } },
    { new: true }
  )
    .populate({
      path: "comments",
      // Get friends of friends - populate the 'friends' array for every friend
      populate: { path: "postedBy", select: "userName _id photo" },
    })
    .then((comment) => {
      res.status(201).json({ comment });
    })
    .catch((err) => {
      console.log(err);
    });
});

module.exports = postRouter;
