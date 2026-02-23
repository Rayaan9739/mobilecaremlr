const bcryptjs = require("bcryptjs");
const { promisify } = require("node:util");

// Promisified wrappers so existing async/await calls keep working
const hash = promisify(bcryptjs.hash);
const compare = promisify(bcryptjs.compare);

module.exports = { hash, compare };
