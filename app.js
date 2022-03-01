const express = require("express");
const { createServer } = require("http");
const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 5000;
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const { MONGOURI, JWT_SECRET } = require("./keys");

const User = require("./models/user");
const Post = require("./models/post");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { instrument } = require("@socket.io/admin-ui");

mongoose.connect(MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on("connected", (err) => {
  console.log("connected");
});
mongoose.connection.on("error", (err) => {
  console.log(err);
});

const authRouter = require("./routes/auth");
const postRouter = require("./routes/post");
const notificationRouter = require("./routes/notification");

app.use(cors());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,HEAD,OPTIONS,POST,PUT,DELETE"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});
app.use(express.json());
app.use(authRouter);
app.use(postRouter);
app.use(notificationRouter);

app.get("/", (req, res) => {
  res.send("Hello World!!xx");
});

const expressServer = app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
const io = new Server(expressServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://3.34.181.253", // insta-client ec2 server
      "https://admin.socket.io",
      "http://ec2-3-34-181-253.ap-northeast-2.compute.amazonaws.com",
    ],
  },
  credentials: true,
});

app.set("socketio", io);
console.log("Socket.io listening for connections");
io.use(function (socket, next) {
  if (socket.handshake.query && socket.handshake.query.token) {
    try {
      jwt.verify(
        socket.handshake.query.token,
        JWT_SECRET,
        function (err, decoded) {
          if (err) {
            console.log("fail");
            return next(new Error("Authentication error"));
          }

          socket.decoded = decoded;
          next();
        }
      );
    } catch (e) {
      console.log("error", e);
    }
  } else {
    console.log("none");
    next(new Error("Authentication error"));
  }
}).on("connection", (socket) => {
  socket.join(socket.decoded._id);
  console.log("socket id is", socket.id);
});
instrument(io, { auth: false });
