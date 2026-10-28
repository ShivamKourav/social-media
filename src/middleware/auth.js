const User = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    if (!req.session.userId) return res.status(401).json({ message: "Please log in to continue." });
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "Your session expired. Please log in again." });
    }
    req.user = user;
    next();
  } catch (error) { next(error); }
}
module.exports = { requireAuth };
