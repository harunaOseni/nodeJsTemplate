const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModal");
const nodemailer = require("nodemailer");
const emailValidator = require("deep-email-validator");

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    let userExists = await User.findOne({ email: email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "A user already exists with this email!" });
    }

    userExists = await User.findOne({ username: username });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "A user already exists with this username!" });
    }

    const isValid = await emailValidator.validate(email);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const user = new User({
      name,
      username,
      email,
      password,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    res.json({
      message: "User created!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Email or password does not match" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Email or password does not match" });
    }

    const token = jwt.sign(user.id, process.env.SECRET);
    res.json({
      token,
      username: user.username,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
});

// FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "User does not exist!" });
    }
    const token = await jwt.sign(user.id, process.env.SECRET);
    const link = `http://<domain>/setnewpassword/${token}`;
    const mailOptions = {
      from: "name@gmail.com",
      to: email,
      subject: "Reset Password",
      html: `<h1>Reset Password</h1>
        <p>Click on the link below to reset your password</p>
        <a href=${link}>${link}</a>`,
    };
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "name@gmail.com",
        pass: "password",
      },
    });
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    res.json({ message: "Check your email to reset password!" });
  } catch (error) {
    console.log(error);
  }
});

// RESET PASSWORD
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    const token = req.params.token;
    const id = await jwt.verify(token, process.env.SECRET);
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.json({ message: "User does not exist!" });
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    user.password = hashedPassword;
    await user.save();
    res.json({ message: "Password reset successfully!" });
  } catch (error) {
    console.log(error);
  }
});

// GET VERIFICATION STATUS
router.get("/verification-status/:username", async (req, res) => {
  try {
    const { username } = req.params;
    console.log(username);
    const user = await User.findOne({
      username: username,
    });
    res.json({ verified: user.verified });
  } catch (error) {
    res.status(500).send({ message: "Server error" });
  }
});

// SEND VERIFICATION EMAIL
router.post("/sendverification", async (req, res) => {
  try {
    const { email } = req.body;
    // const email = "name@gmail.com";
    const user = User.findOne({
      email,
    });
    if (!user) {
      return res.json({ message: "User does not exist!" });
    }
    const token = await jwt.sign({ payload: user.id }, process.env.SECRET);
    const link = `http://<Domain>.com/verify-email/${token}`;
    const mailOptions = {
      from: "name@gmail.com",
      to: email,
      subject: "Verify Email",
      html: `<h1>Verify Email</h1>
        <p>Click on the link below to verify your email</p>
        <a href=${link}>${link}</a>`,
    };
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "name@gmail.com",
        pass: "password",
      },
    });

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    res.json({ message: "verify email link succesfully sent!" });
  } catch (error) {
    console.log(error);
  }
});

// const circularReplacer = () => {
//   const seen = new WeakSet();
//   return (key, value) => {
//     if (typeof value === "object" && value !== null) {
//       if (seen.has(value)) {
//         return;
//       }
//       seen.add(value);
//     }
//     return value;
//   };
// };

// VERIFY EMAIL
router.post("/verify-email/:token/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({
      email,
    });
    if (!user) {
      return res.json({ message: "User does not exist!" });
    }
    user.verified = true;
    await user.save();
    res.json({ message: "Email verified successfully!" });
  } catch (error) {
    console.log(error);
  }
});
