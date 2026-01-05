const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// This line pulls the password safely from Render's Environment settings
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(() => console.log("Permanent Cloud Database Connected!"))
    .catch(err => console.error("Database Connection Error: ", err));

const User = mongoose.model('User', new mongoose.Schema({
    nickname: String,
    email: { type: String, unique: true },
    password: String,
    theme: { type: String, default: 'iOS 6 Classic' }
}));

const Post = mongoose.model('Post', new mongoose.Schema({
    author: String,
    content: String,
    date: { type: Date, default: Date.now },
    comments: [{ author: String, text: String }]
}));

app.use(session({ secret: 'aero-vault-2026', resave: false, saveUninitialized: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// AUTH ROUTES
app.post('/signup', async (req, res) => {
    try {
        const user = new User({
            nickname: req.body.nickname,
            email: req.body.email.toLowerCase().trim(),
            password: req.body.password
        });
        await user.save();
        res.send('<h2>Account Secured!</h2><a href="/login.html">Login now</a>');
    } catch (e) { res.send("Error: User already exists."); }
});

app.post('/login', async (req, res) => {
    const user = await User.findOne({ 
        email: req.body.email.toLowerCase().trim(), 
        password: req.body.password 
    });
    if (user) {
        req.session.isLoggedIn = true;
        req.session.nickname = user.nickname;
        res.redirect('/index.html');
    } else { res.send("Invalid credentials."); }
});

// PAGE ROUTES
const protect = (req, res, next) => {
    if (req.session.isLoggedIn) { next(); } 
    else { res.redirect('/login.html'); }
};

app.get('/', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/social.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'social.html')));
app.get('/account.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'account.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));

app.listen(PORT, () => console.log('Aero Music Pro is Live'));
