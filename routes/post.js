const express = require("express");
const postRouter = express.Router();
const mongoose = require("mongoose");
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
      populate: { path: "postedBy", select: "userName, _id photo" },
    });
  const myInfo = await User.findById(req.user._id);
  const followedUsers = new Set();
  myInfo.following.forEach((user) => {
    followedUsers.add(user.valueOf());
  });
  console.log("followedUsers", followedUsers);
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

  // .then((posts) => res.status(200).json({ posts }))
  // .catch((err) => {
  //   res.status(500).json({ error: err });
  // });
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

  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $push: { likes: req.user._id } },
    { new: true }
  ).populate({ path: "likes", select: "userName photo" });

  const clonedPost = JSON.parse(JSON.stringify(post));

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
        image: post.photo,
      },
    });

    await notification.save();
    return res.status(201).json({ comment: post, success: true });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false });
  }
});

module.exports = postRouter;
