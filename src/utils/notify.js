const Notification = require("../models/Notification");
module.exports = async function notify({ recipient, actor, type, post = null }) {
  if (!recipient || !actor || String(recipient) === String(actor)) return;
  await Notification.create({ recipient, actor, type, post });
};
