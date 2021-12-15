const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/user");
const bcrypt = require("bcryptjs");

router.get("/", (req, res) => {
  res.send("hello");
});

router.post("/signup", async (req, res) => {
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

module.exports = router;
