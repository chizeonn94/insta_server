const express = require("express");
const notificationRouter = express.Router();
const mongoose = require("mongoose");
const { sendNotification } = require("../handlers/sockethandler");
const requireLogin = require("../middleware/requireLogin");
const Notification = require("../models/notification");
const Post = require("../models/post");
const User = require("../models/user");
const { ObjectId } = mongoose.Types;

notificationRouter.get("/notification", requireLogin, async (req, res) => {
  const notifications = await Notification.find({
    receiver: req.user._id,
  })
    .sort({ date: -1 })
    .populate("sender", "userName _id photo");
  let cloned = JSON.parse(JSON.stringify(notifications));
  const myData = await User.findById(req.user._id);
  let array = [];
  myData.following.forEach((user) => {
    array.push(user.valueOf());
  });
  const followingUsers = new Set(array);

  cloned.forEach((noti) => {
    if (followingUsers.has(noti.sender._id)) {
      noti.isFollowing = true;
    } else {
      noti.isFollowing = false;
    }
  });

  if (notifications) {
    return res.status(201).send({ notifications: cloned, success: true });
  }
  return res.status(401).send({ success: false });
});
notificationRouter.put("/read-notification", requireLogin, async (req, res) => {
  try {
    await Notification.updateMany({ receiver: req.user._id }, { read: true });
    return res.status(201).send({ success: true });
  } catch (error) {
    return res.status(500).send({ success: false, error });
  }
});
module.exports = notificationRouter;
