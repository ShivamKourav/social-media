const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const publicUser = (user) => ({
  id: user._id, name: user.name, username: user.username, email: user.email,
  bio: user.bio, location: user.location, website: user.website, avatar: user.avatar,
  coverImage: user.coverImage, followersCount: user.followers.length,
  followingCount: user.following.length, createdAt: user.createdAt
});

router.post("/register", async (req, res, next) => {
  try {
    let { name, username, email, password } = req.body;
    name = String(name || "").trim();
    username = String(username || "").trim().toLowerCase();
    email = String(email || "").trim().toLowerCase();
    if (!name || !username || !email || !password) return res.status(400).json({ message: "Please complete every required field." });
    if (name.length > 60 || !/^[a-z0-9_.]{3,24}$/.test(username)) return res.status(400).json({ message: "Use a name under 60 characters and a username of 3–24 letters, numbers, dots, or underscores." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Enter a valid email address." });
    if (String(password).length < 8 || String(password).length > 72) return res.status(400).json({ message: "Password must be 8–72 characters long." });
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) return res.status(409).json({ message: existing.username === username ? "That username is taken." : "An account with that email already exists." });
    const user = await User.create({ name, username, email, passwordHash: await bcrypt.hash(password, 12) });
    req.session.userId = String(user._id);
    req.session.save((err) => {
      if (err) return next(err);
      res.status(201).json({ user: publicUser(user) });
    });
  } catch (error) { next(error); }
});

router.post("/login", async (req, res, next) => {
  try {
    const login = String(req.body.login || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!login || !password) return res.status(400).json({ message: "Enter your email/username and password." });
    const user = await User.findOne({ $or: [{ email: login }, { username: login }] }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: "Incorrect login details." });
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.userId = String(user._id);
      req.session.save((saveErr) => {
        if (saveErr) return next(saveErr);
        res.json({ user: publicUser(user) });
      });
    });
  } catch (error) { next(error); }
});

router.get("/me", requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));
router.post("/logout", (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("vibely.sid", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    res.json({ message: "Logged out successfully." });
  });
});
module.exports = router;
