require("dotenv").config();
const bcrypt = require("bcrypt");
const saltRounds = Number(process.env.SALT);

async function hashPassword(password) {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (err) {
    throw err;
  }
}

async function verifyPassword(providedPassword, storedHash) {
  try {
    const match = await bcrypt.compare(providedPassword, storedHash);
    return match;
  } catch (err) {
    throw err;
  }
}

module.exports = { hashPassword, verifyPassword };
