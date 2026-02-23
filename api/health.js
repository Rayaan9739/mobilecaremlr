const { app, init } = require("../mc_backend/src/server");

module.exports = async (req, res) => {
  await init();
  req.url = "/health";
  return app(req, res);
};