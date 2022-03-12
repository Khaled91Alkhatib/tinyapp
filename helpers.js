const bcrypt = require("bcryptjs");

const findUserByEmail = function(email, users) {
  for (const userID in users) {
    if (users[userID].email === email) {
      return true;
    }
  }
};

const findUserByPassword = function(password, users) {
  for (const userID in users) {
    if (bcrypt.compareSync(password, users[userID].password)) {
      return true;
    }
  }
  return false;
};

const authenticateUser = function(email, password, users) {  // helper function used in POST /login and /register
  for (const user in users) {
    if (users[user].email === email && bcrypt.compareSync(password, users[user].password)) {
      return users[user]; // this is for the POST login
    }
  }
  const userFound = findUserByEmail(email, users);
  const passwordFound = findUserByPassword(password, users);
  if (!userFound && !passwordFound) {
    return false;
  }
  if (userFound || passwordFound) {
    return true;
  }
  return true;
};

const generateRandomString = function() {
  let newString = Math.random().toString(36).substring(2, 8);  // the 36 represents base 36; includes all letters and numbers 0123456789
  return newString;
};

const urlsForUser = function(id, uDb) { // helper function that gives the user access to their created URL's
  const newObj = {};
  for (const k in uDb) {
    if (id === uDb[k].userID) {
      newObj[k] = {
        longURL: uDb[k].longURL,
        userID: uDb[k].userID
      };
    }
  }
  return newObj;
};

const findUserByShortURL = function(shortURL, id, uDb) {
  if (uDb[shortURL].userID === id) {
    return true;
  }
  return false;
};

module.exports = {
  findUserByEmail,
  findUserByPassword,
  authenticateUser,
  generateRandomString,
  urlsForUser,
  findUserByShortURL
};