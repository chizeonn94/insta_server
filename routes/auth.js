const express = require("express");
const authRouter = express.Router();
const mongoose = require("mongoose");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { JWT_SECRET } = require("../keys");
const requireLogin = require("../middleware/requireLogin");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const { getUserInfo } = require("../controllers/userController");
const Notification = require("../models/notification");
const { sendNotification } = require("../handlers/sockethandler");
const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);

authRouter.get("/protected", requireLogin, (req, res) => {
  res.send("hello");
});

authRouter.post("/signin", async (req, res) => {
  const { authorization } = req.headers;
  //console.log("authorization", authorization);
  const { email, password } = req.body;
  if (authorization) {
    //console.log("we have authorization", authorization);

    //const id = jwtsimple.decode(authorization, JWT_SECRET).id;
    const id = jwt.verify(authorization, JWT_SECRET)?._id;

    const user = await User.findOne({ _id: id });
    if (user) {
      return res.status(201).send({
        user: { ...user.toObject(), token: authorization },
        token: authorization,
        success: true,
      });
    } else {
      return res.status(401).send({
        error: "not authorized",
        success: false,
      });
    }
  }
  if (!email || !password) {
    return res.status(500).send({
      error: "please add all the fields",
      success: false,
    });
  }
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ error: "there is no user" });
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(404).json({ error: "invalid password" });
  }
  const token = jwt.sign({ _id: user._id }, JWT_SECRET);

  user.password = undefined;
  return res.status(201).send({
    success: true,
    message: "successfully loged in",
    user: { ...user.toObject(), token },
    token,
  });
});
authRouter.post("/signup", async (req, res) => {
  console.log(req.body);

  const { fullName, userName, email, password } = req.body;
  if (!fullName || !userName || !email || !password) {
    console.log("didnt fill all the field");
    return res.status(422).json({ error: "Please add all the fields" });
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    console.log("existedUser");
    return res.status(422).json({ error: "There was a existed User already" });
  }
  const newUser = new User({ ...req.body, password: hashedPassword });
  await newUser
    .save()
    .then((newuser) => {
      return res.status(201).json({ message: "successfully posted" });
    })
    .catch((e) => {
      console.log(e);
      return res.status(422).json({ error: e });
    });
});
authRouter.get("/myprofile", requireLogin, async (req, res) => {
  //console.log("get my profile");
  const userData = await User.findOne({ _id: req.user._id });
  if (userData) {
    res.status(201).send({ userData });
  } else {
    res.status(404).send({ error: "cant find user" });
  }
});
authRouter.get("/profile/:userName", requireLogin, getUserInfo);
authRouter.put("/profile", requireLogin, async (req, res) => {
  // console.log(req.body);
  // console.log(req.user);
  try {
    const newUser = await User.findByIdAndUpdate(req.user._id, req.body);

    res.status(201).send({ message: "successfully updated", newUser });
  } catch (e) {
    console.log(e);

    res.status(500).send({ error: e });
  }
});
authRouter.put("/follow/:id", requireLogin, async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.params.id,
      { $push: { followers: req.user._id } },
      { new: true }
    );
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { following: req.params.id } },
      { new: true }
    );
    const notification = new Notification({
      sender: req.user._id,
      receiver: req.params.id,
      notificationType: "follow",
      date: Date.now(),
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
    return res.status(201).send({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ success: false, error });
  }
});
authRouter.put("/unfollow/:id", requireLogin, async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.params.id,
      { $pull: { followers: req.user._id } },
      { new: true }
    );
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { following: req.params.id } },
      { new: true }
    );
    return res.status(201).send({ success: true });
  } catch (error) {
    return res.status(500).send({ success: false, error });
  }
});

authRouter.get("/followers/:userName", requireLogin, async (req, res) => {
  try {
    const userData = await User.findOne({ userName: req.params.userName })
      .select("followers")
      .populate("followers", "_id userName fullName photo");
    console.log("userData", userData);
    let cloned = JSON.parse(JSON.stringify(userData));
    const myData = await User.findById(req.user._id);
    let array = [];
    myData.following.forEach((user) => {
      array.push(user.valueOf());
    });
    const followingUsers = new Set(array);
    cloned.followers.forEach((user) => {
      if (followingUsers.has(user._id.valueOf())) {
        user.isFollowing = true;
      } else {
        user.isFollowing = false;
      }
    });
    res.status(201).send({ result: cloned });
  } catch (error) {
    res.status(500).send({ error });
  }
});

authRouter.get("/following/:userName", requireLogin, async (req, res) => {
  try {
    const userData = await User.findOne({ userName: req.params.userName })
      .select("following")
      .populate("following", "_id userName fullName photo");
    let cloned = JSON.parse(JSON.stringify(userData));
    const myData = await User.findById(req.user._id);
    let array = [];
    myData.following.forEach((user) => {
      array.push(user.valueOf());
    });
    const followingUsers = new Set(array);
    cloned.following.forEach((user) => {
      if (followingUsers.has(user._id.valueOf())) {
        user.isFollowing = true;
      } else {
        user.isFollowing = false;
      }
    });

    res.status(201).send({ result: cloned });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
});
authRouter.get(
  "/FollowersAndFollowing/:userName",
  requireLogin,
  async (req, res) => {
    try {
      const userData = await User.findOne({ userName: req.params.userName })
        .select("followers following")
        .populate("followers", "_id userName fullName photo")
        .populate("following", "_id userName fullName photo");

      console.log("userData", userData);
      let cloned = JSON.parse(JSON.stringify(userData));
      const myData = await User.findById(req.user._id);
      let array = [];
      myData.following.forEach((user) => {
        array.push(user.valueOf());
      });
      const followingUsers = new Set(array);
      cloned.followers.forEach((user) => {
        if (followingUsers.has(user._id.valueOf())) {
          user.isFollowing = true;
        } else {
          user.isFollowing = false;
        }
      });
      cloned.following.forEach((user) => {
        if (followingUsers.has(user._id.valueOf())) {
          user.isFollowing = true;
        } else {
          user.isFollowing = false;
        }
      });
      res.status(201).send({ result: cloned });
    } catch (error) {
      res.status(500).send({ error });
    }
  }
);
authRouter.put("/changepassword", requireLogin, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  let currentPassword = undefined;
  console.log("oldPassword", oldPassword);
  console.log("newPassword", newPassword);

  try {
    const userDocument = await User.findById(req.user._id);
    currentPassword = userDocument.password;
    const isMatch = await bcrypt.compare(oldPassword, currentPassword);
    if (!isMatch) {
      console.log("not match");
      return res.status(401).send({
        message: "Your old password was entered incorrectly, please try again.",
      });
    }
    userDocument.password = newPassword;
    await userDocument.save();
    res.status(201).send({ message: "successfully changed password" });
  } catch (e) {
    console.log(e);
    console.log("fuck");
    res.status(500).send({ error: e });
  }
});
authRouter.post("/search-users", requireLogin, async (req, res) => {
  let re = new RegExp("^" + req.body.query);
  try {
    const users = await User.find({
      $or: [{ userName: { $regex: re } }, { fullName: { $regex: re } }],
    }).select("userName fullName photo");
    res.status(201).send({ result: users });
  } catch (error) {
    res.status(500).send({ error });
  }
});

authRouter.post("/send-email", requireLogin, (req, res) => {
  transporter
    .sendMail({
      to: "5959_jis@naver.com",
      from: "chizeonn94@gmail.com",
      subject: "test",
      html: "<h1>test mail<h1>",
    })
    .then((res) => console.log("sucess"));
});
module.exports = authRouter;
