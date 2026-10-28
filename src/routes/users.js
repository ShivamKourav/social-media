const router = require("express").Router();
const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const { requireAuth } = require("../middleware/auth");
const notify = require("../utils/notify");

const userView = (u, viewerId) => ({
  id: u._id, name: u.name, username: u.username, bio: u.bio, location: u.location,
  website: u.website, avatar: u.avatar, coverImage: u.coverImage,
  followersCount: u.followers.length, followingCount: u.following.length,
  postsCount: u.postsCount || 0, isFollowing: viewerId ? u.followers.some(id => String(id) === String(viewerId)) : false,
  createdAt: u.createdAt
});

router.get("/search", requireAuth, async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim().slice(0, 60);
    if (!q) return res.json({ users: [] });
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const users = await User.find({ _id: { $ne: req.user._id }, $or: [{ username: new RegExp(safe, "i") }, { name: new RegExp(safe, "i") }] }).limit(15);
    res.json({ users: users.map(u => userView(u, req.user._id)) });
  } catch (error) { next(error); }
});

router.get("/suggested", requireAuth, async (req, res, next) => {
  try {
    const excluded = [req.user._id, ...req.user.following];
    const users = await User.find({ _id: { $nin: excluded } }).sort({ createdAt: -1 }).limit(5);
    res.json({ users: users.map(u => userView(u, req.user._id)) });
  } catch (error) { next(error); }
});

router.get("/:username", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findOne({ username: String(req.params.username).toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found." });
    const posts = await Post.find({ author: user._id }).sort({ createdAt: -1 }).limit(30).populate("author", "name username avatar").lean();
    const counts = await Post.aggregate([{ $match: { author: user._id } }, { $count: "total" }]);
    const profile = userView(user, req.user._id);
    profile.postsCount = counts[0]?.total || 0;
    res.json({ user: profile, posts });
  } catch (error) { next(error); }
});

router.put("/me", requireAuth, async (req, res, next) => {
  try {
    const fields = ["name", "bio", "location", "website", "avatar", "coverImage"];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        const value = String(req.body[field]).trim();
        const limits = { name: 60, bio: 180, location: 80, website: 200, avatar: 500, coverImage: 500 };
        if (value.length > limits[field]) return res.status(400).json({ message: `${field} is too long.` });
        req.user[field] = value;
      }
    }
    await req.user.save();
    res.json({ user: { ...userView(req.user, req.user._id), email: req.user.email } });
  } catch (error) { next(error); }
});

router.get("/:id/followers", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate("followers", "name username avatar");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ users: user.followers.map(u => ({ id: u._id, name: u.name, username: u.username, avatar: u.avatar })) });
  } catch (error) { next(error); }
});
router.get("/:id/following", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate("following", "name username avatar");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ users: user.following.map(u => ({ id: u._id, name: u.name, username: u.username, avatar: u.avatar })) });
  } catch (error) { next(error); }
});
router.post("/:id/follow", requireAuth, async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.user._id)) return res.status(400).json({ message: "You cannot follow yourself." });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found." });
    const already = req.user.following.some(id => String(id) === String(target._id));
    if (!already) {
      req.user.following.addToSet(target._id);
      target.followers.addToSet(req.user._id);
      await Promise.all([req.user.save(), target.save()]);
      await notify({ recipient: target._id, actor: req.user._id, type: "follow" });
    }
    res.json({ isFollowing: true, followersCount: target.followers.length });
  } catch (error) { next(error); }
});
router.delete("/:id/follow", requireAuth, async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found." });
    req.user.following.pull(target._id);
    target.followers.pull(req.user._id);
    await Promise.all([req.user.save(), target.save()]);
    res.json({ isFollowing: false, followersCount: target.followers.length });
  } catch (error) { next(error); }
});
module.exports = router;
