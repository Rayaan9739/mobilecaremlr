const { app, init } = require("./src/server");

const PORT = 5000;

async function start() {
  try {
    await init();
    app.listen(PORT, () => {
      console.log(`✅ Dev server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start dev server:", err);
    process.exit(1);
  }
}

start();