const bodyParser = require("body-parser"); // body-parser makes data sent as a buffer to be readable
const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");


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


// Global functions
const generateRandomString = function() {
  let newString = Math.random().toString(36).substring(2, 8);  // the 36 represents base 36; includes all letters and numbers 0123456789
  return newString;
};

const findUserByEmail = function(email, users) {  // helper function used in authenticateUser function
  for (const userID in users) {
    if (users[userID].email === email) {
      return true;
    }
  }
  return false;
};

const findUserByPassword = function(password, users) {  // helper function used in authenticateUser function
  for (const userID in users) {
    if (users[userID].password === password) {
      return true;
    }
  }
  return false;
};

const authenticateUser = function(email, password, users) {  // helper function used in POST /login
  for (const user in users) {
    if (users[user].email === email && users[user].password === password) {
      return users[user]; // this is for the POST login
    }
  }
  const userFound = findUserByEmail(email, users);
  const passwordFound = findUserByPassword(password, users);
  if (!userFound && !passwordFound ) {
    return false;
  }
  if (userFound || passwordFound) {
    return true;
  }
  return true;
};

const urlsForUser = function(id, uDb) { // uDb represents the database with the data already in it
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

const findUserByShortUrl = function(id, uDb) {
  for (const k in uDb) {
    if (id === uDb[k].userID) {
      return true;
    }
  }
  return false;
};

// GET requests
app.get("/urls", (req, res) => {
  const user_id = req.cookies["user_id"];
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
  const user_id = req.cookies["user_id"];
  if (user_id) {
    const user = users[user_id];
    const templateVars = {urls: urlDatabase, userKey: user};
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => {  // the ":" indicates that shortURL is a route parameter
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  const templateVars = {shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], userKey: user};
  if (findUserByShortUrl(user_id, urlDatabase)) {
    res.render("urls_show", templateVars);
  } else {
    res.send("Access to others' URL denied!");
  }
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const urlObject = urlDatabase[shortURL];
  if (!urlDatabase[shortURL]) {  // check for proper/existent shortURL (edge case)
    res.send("Invalid input!");
  } else {
    res.redirect(urlObject.longURL);
  }
});

app.get("/register", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  const templateVars = {userKey: user};
  res.render("urls_registration", templateVars);
});

app.get("/login", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  const templateVars = {userKey: user};
  res.render("urls_login", templateVars);
});


// POST requests
app.post("/urls", (req, res) => {  // add a post route to receive the form submissions
  const user_id = req.cookies["user_id"];
  const newShorturl = generateRandomString();
  urlDatabase[newShorturl] = {  // assign new key and key value
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
  const user_id = req.cookies["user_id"];
  if (findUserByShortUrl(user_id, urlDatabase)) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    res.send("Can not delete without logging in!");
  }
});

app.post("/urls/:id", (req, res) => {  // modifies URL
  const user_id = req.cookies["user_id"];
  if (findUserByShortUrl(user_id, urlDatabase)) {
    const newLongURL = req.body.newLongURL;
    const id = req.params.id;
    urlDatabase[id].longURL = newLongURL;
    res.redirect("/urls");
  } else {
    res.send("Can not edit without logging in!");
  }
});

app.post("/register", (req, res) => {
  const {email, password} = req.body;
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
    password
  };
  res.cookie("user_id", newUserID);
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let user = authenticateUser(email, password, users);
  if (user.email) {
    res.cookie("user_id", user.id);
    res.redirect("/urls");
  } else {
    res.status(403).send("Email or password is incorrect");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});


// Initial GET requests used when initiating tinyapp
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


// Listener
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});