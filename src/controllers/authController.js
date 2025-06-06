const UserModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const asyncHandle = require("express-async-handler");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.USERNAME_EMAIL,
    pass: process.env.PASSWORD,
  },
});

const getJsonWebToken = async (email, id) => {
  const payload = {
    email,
    id,
  };

  const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "1d" });

  return token;
};

const register = asyncHandle(async (req, res) => {
  const { fullname, email, password } = req.body;

  const existingUser = await UserModel.findOne({ email });

  if (existingUser) {
    res.status(401);
    throw new Error("User has already exist!");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new UserModel({
    email,
    fullname,
    password: hashedPassword,
  });

  await newUser.save();

  res.status(200).json({
    message: "Register new user is successfully",
    data: {
      email: newUser.email,
      id: newUser.id,
      accesstoken: await getJsonWebToken(email, newUser.id),
    },
  });
});

const handleSendEmail = async (val, email) => {
  try {
    await transporter.sendMail({
      from: `Support Eventhub Application <${process.env.USERNAME_EMAIL}>`,
      to: email,
      subject: "Verification Email Code",
      text: "Your verification code has been sent to your email.",
      html: `
      <div style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 30px;">
        <div style="max-width: 400px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 24px;">
        <h2 style="color: #2d7ff9; text-align: center; margin-bottom: 16px;">Eventhub Verification</h2>
        <p style="font-size: 16px; color: #333; text-align: center;">
          Hello,<br>
          Please use the following verification code to complete your registration:
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; background: #2d7ff9; color: #fff; font-size: 28px; letter-spacing: 4px; padding: 12px 32px; border-radius: 6px; font-weight: bold;">
          ${val}
          </span>
        </div>
        <p style="font-size: 14px; color: #888; text-align: center;">
          If you did not request this, please ignore this email.
        </p>
        <div style="text-align: center; margin-top: 24px;">
          <img src="https://img.icons8.com/color/48/000000/checked--v1.png" alt="Eventhub" style="width: 48px;"/>
        </div>
        </div>
      </div>
      `,
    });

    return "OK";
  } catch (error) {
    return error;
  }
};

const verification = asyncHandle(async (req, res) => {
  const { email } = req.body;

  const verificationCode = Math.round(1000 + Math.random() * 9000);

  try {
    await handleSendEmail(verificationCode, email);
    res.status(200).json({
      message: "Send verification code successfully!",
      data: {
        code: verificationCode,
      },
    });
  } catch (error) {
    res.status(401);
    throw new Error("Can not send email");
  }
});

const login = asyncHandle(async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await UserModel.findOne({ email });

  if (!existingUser) {
    res.status(403);
    throw new Error("User not found");
  }

  const isMathPassword = await bcrypt.compare(password, existingUser.password);

  if (!isMathPassword) {
    res.status(401);
    throw new Error("Email or password not correct");
  }

  res.status(200).json({
    message: "Login is sucessfully",
    data: {
      id: existingUser.id,
      email: existingUser.email,
      accesstoken: await getJsonWebToken(email, existingUser.id),
    },
  });
});

module.exports = { register, login, verification };
