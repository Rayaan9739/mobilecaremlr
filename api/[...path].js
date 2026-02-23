const { app, init } = require("../mc_backend/src/server");

module.exports = async (req, res) => {
  await init();
  return app(req, res);
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};