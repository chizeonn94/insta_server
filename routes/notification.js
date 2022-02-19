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
    read: false,
  }).populate("sender", "userName _id photo");

  if (notifications) {
    res.status(201).send({ notifications, success: true });
  }
  res.status(401).send({ success: false });
});

module.exports = notificationRouter;
