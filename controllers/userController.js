const User = require("../models/user");

module.exports.getUserInfo = async (req, res) => {
  const userData = await User.findOne({
    userName: req.params.userName,
  });

  if (userData) {
    loginedUser = await User.findById(req.user._id);
    // console.log("now", userData._id); //지금 조회하고 있는 계정 854 dave
    // console.log("loginedUser", loginedUser);
    let array = [];
    loginedUser.following.forEach((user) => {
      array.push(user.valueOf());
    });

    followingUser = new Set(array); //내가 팔로우하고 있는 사람들
    let cloned = JSON.parse(JSON.stringify(userData));
    if (followingUser.has(userData._id.valueOf())) {
      cloned.isFollowing = true;
    } else {
      cloned.isFollowing = false;
    }
    res.status(201).send({ userInfo: cloned });
  } else {
    res.status(404).send({ error: "cant find user" });
  }
};

module.exports.getUsersLiked = async (req, res) => {};
