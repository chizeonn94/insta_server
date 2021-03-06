module.exports.sendNotification = (req, notification) => {
  console.log("sendNotification...");
  const io = req.app.get("socketio");
  console.log("notification.receiver", notification.receiver.valueOf());
  io.sockets
    .in(notification.receiver.valueOf())
    .emit("newNotification", notification);
};

module.exports.sendPost = (req, post, receiver) => {
  const io = req.app.get("socketio");
  console.log("sendPost receiver", receiver);
  io.sockets.in(receiver).emit("newPost", post);
};

module.exports.deletePost = (req, postId, receiver) => {
  const io = req.app.get("socketio");
  console.log("deletePost receiver", receiver);
  io.sockets.in(receiver).emit("deletePost", postId);
};
