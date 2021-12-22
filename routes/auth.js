const express = require("express");
const authRouter = express.Router();
const mongoose = require("mongoose");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../keys");
const requireLogin = require("../middleware/requireLogin");

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
    return res.status(404).json({ error: "there is no user" });
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(404).json({ error: "invalid password" });
  }
  const token = jwt.sign({ _id: user._id }, JWT_SECRET);
  console.log("token", token);
  user.password = undefined;
  res.status(201).json({
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
    .then(() => {
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
authRouter.get("/profile/:id", requireLogin, async (req, res) => {
  console.log("get profile");
  const userData = await User.findOne({ _id: req.params.id });
  if (userData) {
    res.status(201).send({ userData });
  } else {
    res.status(404).send({ error: "cant find user" });
  }
});
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
  try {
    const userToFollow = await User.findByIdAndUpdate(
      req.params.id,
      {
        $push: { followers: req.user._id },
      },
      { new: true }
    );
    const myData = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: { following: req.params.id },
      },
      { new: true }
    );
    res.status(201).send({ result: { userIFollowed: userToFollow, myData } });
  } catch (error) {
    res.status(500).send({ error });
  }
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
    );
    res.status(201).send({ result: { userIFollowed: userToFollow, myData } });
  } catch (error) {
    res.status(500).send({ error });
  }
});
authRouter.get("/followers/:id", requireLogin, async (req, res) => {
  try {
    const userData = await User.findById(req.params.id)
      .select("followers")
      .populate("followers", "_id userName photo");
    res.status(201).send({ result: userData });
  } catch (error) {
    res.status(500).send({ error });
  }
});
authRouter.get("/following/:id", requireLogin, async (req, res) => {
  try {
    const userData = await User.findById(req.params.id)
      .select("following")
      .populate("following", "_id userName photo");
    res.status(201).send({ result: userData });
  } catch (error) {
    res.status(500).send({ error });
  }
});
authRouter.get("/search-user", requireLogin, async (req, res) => {
  let re = new RegExp("^" + req.body.query);
  try {
    const users = await User.find({ userName: { $regex: re } }).select(
      "userName fullName photo"
    );
    res.status(201).send({ result: users });
  } catch (error) {
    res.status(500).send({ error });
  }
});
module.exports = authRouter;
