const {authenticateUser, generateRandomString, urlsForUser, findUserByShortURL} = require("./helpers");
const bodyParser = require("body-parser"); // body-parser makes data sent as a buffer to be readable
const cookieSession = require("cookie-session");
const express = require("express");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["anything_randomstring"],
  maxAge: 24 * 60 * 60 * 1000 // represents when will the cookie expire (24 hours here)
}));

// Global variables
const urlDatabase = {
  "b6UTxQ": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
  "i3BoGr": {
    longURL: "http://www.google.com",
    userID: "aJ48lW"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

// GET requests
app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  let templateVars = {userKey: null, urls: null, user_id: null};
  const user = users[user_id];
  if (!user_id) {
    res.render("urls_main_index", templateVars);
  } else {
    const urls = urlsForUser(user_id, urlDatabase);
    templateVars = {urls, userKey: user, user_id}; // no need to have (urls: ---) because the variable is already named urls
    res.render("urls_index", templateVars);  // render will respond to requests by sending back a template
  }
});

app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  if (user_id) {
    const user = users[user_id];
    const templateVars = {urls: urlDatabase, userKey: user};
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => {  // the ":" indicates that shortURL is a route parameter
  const user_id = req.session.user_id;
  const user = users[user_id];
  const shortURL = req.params.shortURL
  const templateVars = {shortURL, longURL: urlDatabase[req.params.shortURL], userKey: user};
  if (findUserByShortURL (shortURL, user_id, urlDatabase)) {
    res.render("urls_show", templateVars);
  } else {
    res.send("Access to others' URL denied!");
  }
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const urlObject = urlDatabase[shortURL];
  if (!urlDatabase[shortURL]) {  // check for proper/existent shortURL
    res.send("Invalid input!");
  } else {
    res.redirect(urlObject.longURL);
  }
});

app.get("/register", (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  const templateVars = {userKey: user};
  res.render("urls_registration", templateVars);
});

app.get("/login", (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  const templateVars = {userKey: user};
  res.render("urls_login", templateVars);
});


// POST requests
app.post("/urls", (req, res) => {  // add a post route to receive the form submissions
  const user_id = req.session.user_id;
  const newShorturl = generateRandomString();
  urlDatabase[newShorturl] = {  // assign new key and key values
    longURL: req.body.longURL,
    userID: user_id
  };
  if (user_id) {
    res.redirect(`/urls/${newShorturl}`);
  } else {
    res.send("You have to login first");
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const user_id = req.session.user_id;
  if (findUserByShortURL (shortURL, user_id, urlDatabase)) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    res.send("Can not delete without logging in!");
  }
});

app.post("/urls/:id", (req, res) => {  // modifies URL
  const id = req.params.id;
  const user_id = req.session.user_id;
  if (findUserByShortURL (id, user_id, urlDatabase)) {
    const newLongURL = req.body.newLongURL;
    const id = req.params.id;
    urlDatabase[id].longURL = newLongURL;
    res.redirect("/urls");
  }
});

app.post("/register", (req, res) => {
  const {email, password} = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (email === "" || password === "") {
    return res.status(400).send("Invalid Credentials");
  }
  const authUser = authenticateUser(email, password, users);
  if (authUser) {
    return res.status(400).send("Invalid Credentials");
  }
  const newUserID = generateRandomString();
  users[newUserID] = {
    id: newUserID,
    email,
    password: hashedPassword
  };
  req.session.user_id = newUserID;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  let user = authenticateUser(email, password, users);
  if (user.email) {
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    res.status(403).send("Email or password is incorrect");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// Listener
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});