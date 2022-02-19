const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../keys");
const mongoose = require("mongoose");
const User = require("../models/user");

module.exports = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).send({ error: "please type token" });
  }

  const token = authorization.replace("Bearer ", "");
  // console.log("JWT_SECRET", JWT_SECRET);
  // console.log("token", token);
  // console.log("authorization", authorization);

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(401).json({ error: "invalid token" });
    }

    const { _id } = payload;
    User.findById(_id)
      .then((userData) => {
        if (!userData) {
          return res.status(401).json({ error: "no user matched with token" });
        }
        req.user = userData;
        next();
      })
      .catch((err) => console.log(err));
  });
};
