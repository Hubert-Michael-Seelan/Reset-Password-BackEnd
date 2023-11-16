const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require("./Models/UserModel");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const JWT_SECRET = "$2a$10$50HwsL6onlMW3bINAVbmherRxYbnWcdhJvJOH.sbAE9yfnEQJXyVW-???>''/";

const app = express();
app.use(express.json());
app.use(cors());
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

const PORT = 5000;

const User = mongoose.model("User");

app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const encryptPassword = await bcrypt.hash(password, 10);

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.send({ status: "User Exist" });
    } else {
      await User.create({ email, password: encryptPassword });
      res.send({ status: "Registration Done Successfully" });
    }
  } catch (err) {
    res.send({ status: "Error" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    res.send({ status: "User Not Exists Please Create user" });
  } else {
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ email: user.email }, JWT_SECRET);
      res.status(200).send({ status: "Logged in", data: token });
    } else {
      res.send({ status: "Please Check the inputs" });
    }
  }
});

app.post("/user", async (req, res) => {
  const { token } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET);
    const userEmail = user.email;
    User.findOne({ email: userEmail })
      .then((data) => {
        res.send({ status: "Data Fetched", data });
      })
      .catch((err) => {
        res.send({ status: "error", data: err });
      });
  } catch (error) {
    res.send({ Error: "Error" });
  }
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const userExist = await User.findOne({ email });
    if (!userExist) {
      res.send({ status: "Please register" });
    } else {
      const SECRET = JWT_SECRET + userExist.password;
      const token = jwt.sign(
        { email: userExist.email, id: userExist.id },
        SECRET,
        { expiresIn: "5m" }
      );
      const link = `https://passwordreset-gfgs.onrender.com/reset-password/${userExist.id}/${token}`;
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "hubertmichaelseelan@gmail.com",
          pass: "pyaqemobgnputhzk",
        },
      });

      var mailOptions = {
        from: "hubertmichaelseelan@gmail.com",
        to: userExist.email,
        subject: "Reset Password",
        text: link,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
      res.send({ status: "Link Sent to the Registered Mail ID" });
    }
  } catch (error) {
    res.send({ status: "Error", error });
  }
});

app.get("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  console.log(req.params);
  const user = await User.findOne({ _id: id });
  if (!user) {
    res.send({ status: "Please register" });
  } else {
    const SECRET = JWT_SECRET + user.password;
    try {
      const verify = jwt.verify(token, SECRET);
      res.render("index", { email: verify.email, status: "Not Verified" });
    } catch (error) {
      res.send({ status: "Error" });
    }
  }
});

app.post("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;
  const user = await User.findOne({ _id: id });
  if (!user) {
    res.send({ status: "Please register" });
  }
  const SECRET = JWT_SECRET + user.password;
  try {
    const verify = jwt.verify(token, SECRET);
    const encryptPassword = await bcrypt.hash(password, 10);
    await User.updateOne({ _id: id }, { $set: { password: encryptPassword } });
    res.render("index", { email: verify.email, status: "Verified" });
    // res.send({ status: "Password Changed" });
  } catch (error) {
    res.send({ status: "Error" });
  }
});

app.listen(PORT, (err) => {
  if (err) {
    console.log(`${PORT} is Error`);
  } else {
    console.log(`${PORT} is Running`);
  }
});

mongoose
  .connect("mongodb+srv://hubertmichaelseelan:oZYACDmZlKoaNTxN@cluster0.ez66ddl.mongodb.net/?retryWrites=true&w=majority")
  .then(() => {
    console.log("Database Connected");
  })
  .catch(() => {
    console.log("Error");
  });
