const express = require("express");
const app = express();
const port = 3000;
const mongoose = require("mongoose");
const { MONGOURI } = require("./keys");

const User = require("./models/user");
const router = require("./routes/auth");
app.use(express.json());
app.use(router);

// const connection = async () => {
//   try {
//     await mongoose.connect(MONGOURI);
//     console.log("connected");
//   } catch (error) {
//     console.log("failed to connect");
//   }
// };

// connection();

mongoose.connect(MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on("connected", (err) => {
  console.log("connected");
});
mongoose.connection.on("error", (err) => {
  console.log(err);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
