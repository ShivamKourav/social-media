require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../src/models/User");
const Post = require("../src/models/Post");

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("Set MONGODB_URI in .env first.");
  await mongoose.connect(process.env.MONGODB_URI);
  const demoPassword = await bcrypt.hash("VibelyDemo123!", 12);
  const people = [
    { name: "Maya Chen", username: "mayamakes", email: "maya.demo@example.com", bio: "Designing small things that make life feel bigger ✨", location: "Singapore" },
    { name: "Jordan Lee", username: "jordansays", email: "jordan.demo@example.com", bio: "Coffee, cameras, and long walks.", location: "Toronto" },
    { name: "Ava Morgan", username: "avamorgan", email: "ava.demo@example.com", bio: "Collecting moments, not things.", location: "London" }
  ];
  for (const person of people) {
    await User.updateOne({ username: person.username }, { $setOnInsert: { ...person, passwordHash: demoPassword } }, { upsert: true });
  }
  const users = await User.find({ username: { $in: people.map(p => p.username) } });
  const samples = [
    { author: users[0]._id, text: "A little reminder that you don't have to have it all figured out to begin. 🌱", imageUrl: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=80" },
    { author: users[1]._id, text: "Found a quiet corner of the city today. Saving this feeling for a rainy day. ☁️", imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1200&q=80" },
    { author: users[2]._id, text: "Weekend plans: slow mornings, good playlists, and absolutely no rush. What are you looking forward to?", imageUrl: "" }
  ];
  for (const sample of samples) await Post.updateOne({ author: sample.author, text: sample.text }, { $setOnInsert: sample }, { upsert: true });
  console.log("Seed complete. Demo logins:");
  for (const p of people) console.log(`  ${p.email} / VibelyDemo123!`);
  console.log("Change or delete demo accounts before a public deployment.");
  await mongoose.disconnect();
}
main().catch(async error => { console.error(error.message); await mongoose.disconnect().catch(()=>{}); process.exit(1); });
