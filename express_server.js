const bodyParser = require("body-parser"); // body-parser makes data sent as a buffer to be readable
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xk": "http://www.google.com",
};

const generateRandomString = function() {
  let newString = Math.random().toString(36).substring(2, 8);  // the 36 represents base 36; includes all letters and numbers 0123456789
  return newString;
};

app.get("/urls", (req, res) => {
  const templateVars = {urls: urlDatabase};
  res.render("urls_index", templateVars);  // render will respond to requests by sending back a template
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {  // the ":" indicates that shortURL is a route parameter
  const templateVars = {shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
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