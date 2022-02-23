const express = require("express");
const postRouter = express.Router();
const mongoose = require("mongoose");
const { sendNotification } = require("../handlers/sockethandler");
const requireLogin = require("../middleware/requireLogin");
const Notification = require("../models/notification");
const Post = require("../models/post");
const User = require("../models/user");
const { ObjectId } = mongoose.Types;

postRouter.get("/allpost", requireLogin, async (req, res) => {
  const posts = await Post.find()
    .populate("postedBy", "userName _id photo")
    .populate("likes", "userName _id photo")
    .populate({
      path: "comments",
      // Get friends of friends - populate the 'friends' array for every friend
      populate: { path: "postedBy", select: "userName _id photo" },
    });
  const myInfo = await User.findById(req.user._id);
  const followedUsers = new Set();
  myInfo.following.forEach((user) => {
    followedUsers.add(user.valueOf());
  });

  let clonedPosts = JSON.parse(JSON.stringify(posts));
  clonedPosts.forEach((post) => {
    // console.log(post);
    post.likes.forEach((user) => {
      // console.log(user);
      if (followedUsers.has(user._id.valueOf())) {
        user.isFollowing = true;
      } else {
        user.isFollowing = false;
      }
    });
    post.likes.forEach((user) => {
      // console.log(user);
      if (user._id.valueOf() === req.user._id.valueOf()) {
        post.pressedLiked = true;
        return false;
      }
      post.pressedLiked = false;
    });
  });
  res.status(200).json({ posts: clonedPosts });
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
  const { body, photo } = req.body;
  if (!photo) {
    return res.status(422).json({ error: "photo is required" });
  }
  req.user.password = undefined;

  const postToUpload = new Post({
    body,
    photo,
    postedBy: req.user._id,
  });
  postToUpload
    .save()
    .then((posted) => {
      //console.log("posted", posted);
      return res.status(201).json({ post: posted });

      //next();
    })
    .catch((err) => {
      console.log({ err });
    });
});
postRouter.delete("/delete-post/:id", requireLogin, async (req, res) => {
  try {
    await Post.deleteOne({ _id: req.params.id });
    return res.status(201).send({ success: true });
  } catch (error) {
    return res.status(500).send({ error, success: false });
  }
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

  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $push: { likes: req.user._id } },
    { new: true }
  ).populate({ path: "likes", select: "userName photo" });

  const clonedPost = JSON.parse(JSON.stringify(post));
  const notification = new Notification({
    sender: req.user._id,
    receiver: post.postedBy._id,
    notificationType: "like",
    date: Date.now(),
    notificationData: {
      postId: req.params.id,
      photo: post.photo,
    },
  });

  await notification.save();
  sendNotification(req, {
    ...notification.toObject(),
    sender: {
      _id: req.user._id,
      userName: req.user.userName,
      photo: req.user.photo,
    },
  });
  if (!post) {
    return res.status(422).send({ error });
  }
  return res.status(201).send({ result: clonedPost });
});
postRouter.put("/unlike/:id", requireLogin, async (req, res) => {
  console.log(req.params.id);

  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $pull: { likes: req.user._id } },
    { new: true }
  ).populate({ path: "likes", select: "userName photo" });
  const clonedPost = JSON.parse(JSON.stringify(post));

  if (!post) {
    return res.status(422).send({ error });
  }
  return res.status(201).send({ result: clonedPost });
});

postRouter.get("/usersposts/:userName", requireLogin, async (req, res) => {
  const user = await User.findOne({ userName: req.params.userName });
  const posts = await Post.find({ postedBy: user._id }).populate(
    "postedBy",
    "userName _id"
  );

  if (posts) {
    res.status(201).json({ posts, success: true });
  } else {
    res.status(201).json({ posts, success: false });
  }
});
postRouter.put("/comment/:id", requireLogin, async (req, res) => {
  const comment = { text: req.body.text, postedBy: req.user._id };
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id, // post id
      { $push: { comments: comment } },
      { new: true }
    ).populate({
      path: "comments",
      // Get friends of friends - populate the 'friends' array for every friend
      populate: { path: "postedBy", select: "userName _id photo" },
    });

    const notification = new Notification({
      sender: req.user._id,
      receiver: post.postedBy,
      notificationType: "comment",
      date: Date.now(),
      notificationData: {
        postId: post._id,
        photo: post.photo,
        comment: req.body.text,
      },
    });

    await notification.save();
    sendNotification(req, {
      ...notification.toObject(),
      sender: {
        _id: req.user._id,
        userName: req.user.userName,
        photo: req.user.photo,
      },
    });
    return res.status(201).json({ comment: post, success: true });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false });
  }
});

module.exports = postRouter;
