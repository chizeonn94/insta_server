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
  res.status(201).json({ message: "successfully loged in", token });
});
authRouter.post("/signup", async (req, res) => {
  console.log(req.body);
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(422).json({ error: "Please add all the fields" });
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    return res.status(422).json({ error: "There was a existed User already" });
  }
  const newUser = new User({ ...req.body, password: hashedPassword });
  await newUser
    .save()
    .then(() => {
      res.json({ message: "successfully posted" });
    })
    .catch((e) => {
      console.log(e);
      return res.status(422).json({ error: e });
    });
  //   User.findOne({ email }).then((existedUser) => {
  //     if (existedUser) {
  //       return res
  //         .status(422)
  //         .json({ error: "There was a existed User already" });
  //     }
  //     const newUser = new User({ ...req.body });
  //     newUser
  //       .save()
  //       .then(() => {
  //         res.json({ message: "successfully posted" });
  //       })
  //       .catch((e) => {
  //         console.log(e);
  //         return res.status(422).json({ error: e });
  //       });
  //   });
});

module.exports = authRouter;
