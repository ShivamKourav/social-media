require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = Number(process.env.PORT) || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Vibely is running at http://localhost:${PORT}`);
      console.log("Press Ctrl+C to stop the server.");
    });
  })
  .catch((error) => {
    console.error("Could not start Vibely:", error.message);
    process.exit(1);
  });
