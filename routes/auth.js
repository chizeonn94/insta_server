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
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(422).json({ error: "Please add all the fields" });
  }
  const user = await User.findOne({ email });
  console.log("user >>", user);
  if (!user) {
    console.log("no user");
    return res.status(404).json({ error: "there is no user" });
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    console.log("not match");
    return res.status(404).json({ error: "invalid password" });
  }
  const token = jwt.sign({ _id: user._id }, JWT_SECRET);
  console.log("token", token);
  user.password = undefined;
  return res.status(201).json({
    message: "successfully loged in",
    user: JSON.stringify(user),
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
  console.log("get my profile");
  const userData = await User.findOne({ _id: req.user._id });
  if (userData) {
    res.status(201).send({ userData });
  } else {
    res.status(404).send({ error: "cant find user" });
  }
});
authRouter.get("/profile/:userName", requireLogin, getUserInfo);
authRouter.put("/profile", requireLogin, async (req, res) => {
  console.log(req.body);
  console.log(req.user);
  try {
    await User.findByIdAndUpdate(req.user._id, req.body);
    res.status(201).json({ message: "successfully updated" });
  } catch (e) {
    res.status(500).json({ error: e });
  }
});
authRouter.put("/follow/:id", requireLogin, async (req, res) => {
  // try {
  //   const userToFollow = await User.findByIdAndUpdate(
  //     req.params.id,
  //     {
  //       $push: { followers: req.user._id },
  //     },
  //     { new: true }
  //   );
  //   const myData = await User.findByIdAndUpdate(
  //     req.user._id,
  //     {
  //       $push: { following: req.params.id },
  //     },
  //     { new: true }
  //   );
  //   res.status(201).send({ result: { userIFollowed: userToFollow, myData } });
  // } catch (error) {
  //   res.status(500).send({ error });
  // }

  const userToFollow = await User.findByIdAndUpdate(
    req.params.id,
    { $push: { followers: req.params.id } },
    { new: true }
  ).populate({
    path: "following",
    select: "userName photo",
  });
  const myData = await User.findByIdAndUpdate(
    req.user._id,
    { $push: { following: req.params.id } },
    { new: true }
  );
  if (!userToFollow || !myData) {
    return res.status(500).send({ error });
  }

  let cloned = JSON.parse(JSON.stringify(myData));

  cloned.following.forEach((followingUser) => {
    followingUser["isFollowing"] = true;
  });
  return res.status(201).json(cloned);
});
authRouter.put("/unfollow/:id", requireLogin, async (req, res) => {
  try {
    const userToFollow = await User.findByIdAndUpdate(
      req.params.id,
      {
        $pull: { followers: req.user._id },
      },
      { new: true }
    );
    const myData = await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: { following: req.params.id },
      },
      { new: true }
    ).populate({
      path: "following",
      select: "userName photo",
    });
    res.status(201).send({ result: { userIFollowed: userToFollow, myData } });
  } catch (error) {
    res.status(500).send({ error });
  }
});
// authRouter.get("/followers/:id", async (req, res) => {
//   try {
//     const userData = await User.findById(req.params.id)
//       .select("followers")
//       .populate("followers", "_id userName photo");
//     res.status(201).send({ result: userData });
//   } catch (error) {
//     res.status(500).send({ error });
//   }
// });
authRouter.get("/followers/:userName", requireLogin, async (req, res) => {
  try {
    const userData = await User.findOne({ userName: req.params.userName })
      .select("followers")
      .populate("followers", "_id userName fullName photo");
    res.status(201).send({ result: userData });
  } catch (error) {
    res.status(500).send({ error });
  }
});
authRouter.get("/following/:userName", async (req, res) => {
  try {
    const userData = await User.findOne({ userName: req.params.userName })
      .select("following")
      .populate("following", "_id userName fullName photo");
    res.status(201).send({ result: userData });
  } catch (error) {
    res.status(500).send({ error });
  }
});
authRouter.get("/search-users", requireLogin, async (req, res) => {
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
