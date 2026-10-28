const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, minlength: 3, maxlength: 24, match: /^[a-z0-9_.]+$/ },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  bio: { type: String, default: "", maxlength: 180 },
  location: { type: String, default: "", maxlength: 80 },
  website: { type: String, default: "", maxlength: 200 },
  avatar: { type: String, default: "" },
  coverImage: { type: String, default: "" },
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });
userSchema.index({ username: 1 });
userSchema.index({ name: "text", username: "text" });
module.exports = mongoose.model("User", userSchema);
