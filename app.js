require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const ejs = require('ejs');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const session = require('express-session');

// testing branch

// Database
mongoose.connect(process.env.CONNECTION, () => console.log("Connected To Databse"));
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    loggedIn: Boolean,
})
const User = new mongoose.model("User", UserSchema);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view-engine', 'ejs');

// Cookie Parser, Sessions & Flash
app.use(cookieParser('secretstringforcookies'));
app.use(session({
    secret: "secretstringforsession",
    cookie: { maxAge: 60000 },
    resave: true,
    saveUninitialized: true
}))
app.use(flash());

//  ---- Routes ----

// Frontend
app.get('/', (req, res) =>{
    const userName = req.flash('user');

    res.render('index.ejs', { userName: userName });
})

app.get('/register', (req, res) => {
    res.render('register.ejs');
})

app.get('/login', (req, res) => {
    res.render('login.ejs', {msg: ""});
})



// Backend
// Create User
app.post('/register', async (req, res) => {
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        password: await bcrypt.hash(req.body.password, 10),
        loggedIn: false,
    })
    user.save((err, data) => {
        if(!err) {
            res.send(data);
        } else {
            res.send("ERR");
        }
    });
    res.redirect('/login');
})

// Find All Users
app.get('/users', async (req, res) => {
    let users = await User.find({});
    res.send(users);
})

// Login
app.post('/login', async (req, res) => {
    //email and password
    const email = req.body.email;
    const password = req.body.password;

    //find user exist or not
    User.findOne({ email: email })
        .then(user => {
            //if user not exist than return status 400
            if (!user) return res.render('login.ejs', {msg: "No such user!"})

            //if user exist than compare password
            //password comes from the user
            //user.password comes from the database
            bcrypt.compare(password, user.password, async (err, data) => {
                //if error than throw error
                if (err) throw err

                //if both match than you can do anything
                if (data) {
                    let doc = await User.findOneAndUpdate({email: req.body.email}, {loggedIn: true});
                    req.flash('user', user.name);
                    res.redirect('/');
                } else {
                    res.render('login.ejs', {msg: "Incorrect credentials"});
                }

            })

        })

    
    
})


// Logout
app.post('/logout', async (req, res) => {
    let doc = await User.findOneAndUpdate({email: req.body.email}, {loggedIn: false});
    res.redirect('/login');
})



// Server Listen
let PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server Running on ${PORT}`))