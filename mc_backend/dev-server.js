const { app, init } = require("./src/server");

const PORT = 5000;

async function start() {
  try {
    await init();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Dev server running on all interfaces at port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start dev server:", err);
    process.exit(1);
  }
}

start();