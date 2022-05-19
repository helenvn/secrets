//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended:true
}));

//Very important that session code goes in this spot before connecting to database
app.use(session({
  secret: "Our little secret.", //will move to .env
  resave: false,
  saveUninitialized: false
}));

//passport must come after session
//passort gets used to setup session
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});



//Use plugin to salt and hash passwords and to save users to database
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const secret = process.env.SECRET;







app.get("/", function(req, res){
  res.render("home");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/secrets", function(req, res){
  // if user is already logged in then we must just render the secrets page
  if (req.isAuthenticated()){
    res.render("secrets");
  }
  else {
    res.redirect("/login");
  }
});

app.post("/register", function(req, res){

  //Use function from passport-local-mongoose
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err){
      console.log(err);
      res.redirect("/register");
    }
    else{
      // function part only gets triggered if auth is successful
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });


});


app.get("/login", function(req, res){
  res.render("login");
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
})

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err){
    if (err){
      console.log(err);
    }
    else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  })
});

app.listen(3000, function(){
  console.log("Server started on port 3000.");
});
