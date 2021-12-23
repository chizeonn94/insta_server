const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const mongoose = require("mongoose");
const { MONGOURI } = require("./keys");

const User = require("./models/user");
const Post = require("./models/post");
const cors = require("cors");

mongoose.connect(MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on("connected", (err) => {
  console.log("connected");
});
mongoose.connection.on("error", (err) => {
  console.log(err);
});

const authRouter = require("./routes/auth");
const postRouter = require("./routes/post");

app.use(cors());
app.use(express.json());
app.use(authRouter);
app.use(postRouter);

app.get("/", (req, res) => {
  res.send("Hello World!!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
