const User = require("../models/user");

module.exports.getUserInfo = async (req, res) => {
  const userData = await User.findOne({
    userName: req.params.userName,
  });

  if (userData) {
    let array = [];
    userData.followers.forEach((user) => {
      array.push(user.valueOf());
    });

    const followedUser = new Set(array); //팔로워들
    let cloned = JSON.parse(JSON.stringify(userData));
    if (followedUser.has(req.user._id.valueOf())) {
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
