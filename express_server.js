const bodyParser = require("body-parser"); // body-parser makes data sent as a buffer to be readable
const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xk": "http://www.google.com",
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

const generateRandomString = function() {
  let newString = Math.random().toString(36).substring(2, 8);  // the 36 represents base 36; includes all letters and numbers 0123456789
  return newString;
};

app.get("/urls/new", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  const templateVars = {urls: urlDatabase, userKey: user};
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {  // the ":" indicates that shortURL is a route parameter
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  const templateVars = {shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], userKey: user};
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {  // add a post route to receive the form submissions
  const newShorturl = generateRandomString();
  urlDatabase[newShorturl] = req.body.longURL; // assign new key and key value
  res.redirect(`/urls/${newShorturl}`);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  if (urlDatabase[shortURL]) {  // check for proper/existent shortURL (edge case)
    res.redirect(longURL);
  } else {
    res.send("Invalid input!");
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {  // modifies URL
  const newLongURL = req.body.newLongURL;
  const id = req.params.id;
  urlDatabase[id] = newLongURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const username = req.body["username"];
  res.cookie("username", username);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  const templateVars = {userKey: user};
  res.render("urls_login", templateVars);
});

app.post("/logout", (req, res) => {
  // const username = req.body["username"];
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  const templateVars = {userKey: user};
  res.render("urls_registration", templateVars);
});

app.post("/register", (req, res) => {
  const newUserID = generateRandomString();
  const newUser = {
    [newUserID]: {
      id: newUserID,
      email: req.body.email,
      password: req.body.password
    }
  };
  for (const key in users) {
    if (users[key].email === newUser[newUserID].email) {
      res.send("400 Bad Request");
    } else if (newUser[newUserID].email === "" || newUser[newUserID].password === "") {
      res.send("400 Bad Request");
    }
  }
  Object.assign(users, newUser);
  res.cookie("user_id", newUserID);
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  const templateVars = {urls: urlDatabase, userKey: user};
  res.render("urls_index", templateVars);  // render will respond to requests by sending back a template
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});