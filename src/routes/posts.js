const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const { requireAuth } = require("../middleware/auth");
const notify = require("../utils/notify");

const uploadDir = path.join(__dirname, "..", "..", "public", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(5).toString("hex")}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    cb(allowed.includes(file.mimetype) ? null : new Error("Upload a JPG, PNG, WEBP, or GIF image."), allowed.includes(file.mimetype));
  }
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(20, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const following = req.user.following;
    const filter = req.query.feed === "following" ? { author: { $in: [...following, req.user._id] } } : {};
    const posts = await Post.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate("author", "name username avatar")
      .populate("likes", "_id")
      .lean();
    const ids = posts.map(p => p._id);
    const commentCounts = await Comment.aggregate([{ $match: { post: { $in: ids } } }, { $group: { _id: "$post", count: { $sum: 1 } } }]);
    const countMap = new Map(commentCounts.map(x => [String(x._id), x.count]));
    res.json({ posts: posts.map(p => ({
      ...p,
      likesCount: p.likes.length,
      isLiked: p.likes.some(u => String(u._id) === String(req.user._id)),
      commentsCount: countMap.get(String(p._id)) || 0
    })), page, hasMore: posts.length === limit });
  } catch (error) { next(error); }
});

router.post("/", requireAuth, upload.single("image"), async (req, res, next) => {
  try {
    const text = String(req.body.text || "").trim();
    if (!text && !req.file) return res.status(400).json({ message: "Write something or attach an image." });
    if (text.length > 1800) return res.status(400).json({ message: "Posts must be 1,800 characters or fewer." });
    const post = await Post.create({ author: req.user._id, text, imageUrl: req.file ? `/uploads/${req.file.filename}` : "" });
    const populated = await post.populate("author", "name username avatar");
    res.status(201).json({ post: { ...populated.toObject(), likesCount: 0, commentsCount: 0, isLiked: false } });
  } catch (error) { next(error); }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate("author", "name username avatar").populate("likes", "_id").lean();
    if (!post) return res.status(404).json({ message: "Post not found." });
    const comments = await Comment.find({ post: post._id }).sort({ createdAt: 1 }).populate("author", "name username avatar").lean();
    res.json({ post: { ...post, likesCount: post.likes.length, isLiked: post.likes.some(u => String(u._id) === String(req.user._id)), commentsCount: comments.length }, comments });
  } catch (error) { next(error); }
});

router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });
    if (String(post.author) !== String(req.user._id)) return res.status(403).json({ message: "You can only edit your own posts." });
    const text = String(req.body.text || "").trim();
    if (!text && !post.imageUrl) return res.status(400).json({ message: "A post cannot be empty." });
    if (text.length > 1800) return res.status(400).json({ message: "Posts must be 1,800 characters or fewer." });
    post.text = text;
    await post.save();
    res.json({ post });
  } catch (error) { next(error); }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });
    if (String(post.author) !== String(req.user._id)) return res.status(403).json({ message: "You can only delete your own posts." });
    await Promise.all([post.deleteOne(), Comment.deleteMany({ post: post._id })]);
    res.json({ message: "Post deleted." });
  } catch (error) { next(error); }
});

router.post("/:id/like", requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });
    const wasLiked = post.likes.some(id => String(id) === String(req.user._id));
    if (!wasLiked) {
      post.likes.addToSet(req.user._id);
      await post.save();
      await notify({ recipient: post.author, actor: req.user._id, type: "like", post: post._id });
    }
    res.json({ isLiked: true, likesCount: post.likes.length });
  } catch (error) { next(error); }
});
router.delete("/:id/like", requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });
    post.likes.pull(req.user._id);
    await post.save();
    res.json({ isLiked: false, likesCount: post.likes.length });
  } catch (error) { next(error); }
});

router.get("/:id/comments", requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });
    const comments = await Comment.find({ post: post._id }).sort({ createdAt: 1 }).populate("author", "name username avatar");
    res.json({ comments });
  } catch (error) { next(error); }
});
router.post("/:id/comments", requireAuth, async (req, res, next) => {
  try {
    const text = String(req.body.text || "").trim();
    if (!text) return res.status(400).json({ message: "Comment cannot be empty." });
    if (text.length > 500) return res.status(400).json({ message: "Comments must be 500 characters or fewer." });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });
    const comment = await Comment.create({ post: post._id, author: req.user._id, text });
    const populated = await comment.populate("author", "name username avatar");
    await notify({ recipient: post.author, actor: req.user._id, type: "comment", post: post._id });
    res.status(201).json({ comment: populated });
  } catch (error) { next(error); }
});
router.delete("/comments/:commentId", requireAuth, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found." });
    if (String(comment.author) !== String(req.user._id)) return res.status(403).json({ message: "You can only delete your own comments." });
    await comment.deleteOne();
    res.json({ message: "Comment deleted." });
  } catch (error) { next(error); }
});
module.exports = router;
