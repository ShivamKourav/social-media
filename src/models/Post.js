const mongoose = require("mongoose");
const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  text: { type: String, default: "", trim: true, maxlength: 1800 },
  imageUrl: { type: String, default: "" },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });
postSchema.index({ createdAt: -1 });
module.exports = mongoose.model("Post", postSchema);
