const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. DATABASE CONNECTION 
// Uses your environment variable for security
const mongoURI = process.env.MONGO_URI; 

mongoose.connect(mongoURI)
    .then(() => console.log("Aero Music Database Connected Successfully!"))
    .catch(err => console.error("Database Connection Error:", err));

// 2. SCHEMAS
const User = mongoose.model('User', new mongoose.Schema({
    nickname: String,
    email: { type: String, unique: true },
    password: String,
    friends: [{ type: String }]
}));

const Post = mongoose.model('Post', new mongoose.Schema({
    author: String,
    content: String,
    date: { type: Date, default: Date.now }
}));

const WallPost = mongoose.model('WallPost', new mongoose.Schema({
    to: String,
    from: String,
    content: String,
    date: { type: Date, default: Date.now }
}));

// 3. MIDDLEWARE
app.use(session({
    secret: 'aero-skeuo-secret',
    resave: false,
    saveUninitialized: false
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname)); // Serves your CSS/Images automatically

// 4. AUTHENTICATION ROUTES
app.post('/signup', async (req, res) => {
    try {
        const user = new User({
            nickname: req.body.nickname,
            email: req.body.email.toLowerCase().trim(),
            password: req.body.password
        });
        await user.save();
        res.send('<h2>Account Created!</h2><a href="/login.html">Login</a>');
    } catch (e) { res.send("Error: Account exists or DB error."); }
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
    } else { res.send("Invalid Login."); }
});

// 5. SOCIAL & SEARCH API (Fixes)
app.get('/api/posts', async (req, res) => {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
});

app.post('/api/post', async (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login.html');
    const newPost = new Post({ author: req.session.nickname, content: req.body.content });
    await newPost.save();
    res.redirect('/social.html');
});

app.get('/api/search-users', async (req, res) => {
    const users = await User.find({ nickname: { $regex: req.query.name, $options: 'i' } }).select('nickname');
    res.json(users);
});

// 6. PAGE ROUTES (Fixes)
const protect = (req, res, next) => {
    if (req.session.isLoggedIn) next();
    else res.redirect('/login.html');
};

app.get('/', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/social.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'social.html')));
app.get('/profile.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'profile.html')));
app.get('/library.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'library.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

app.listen(PORT, () => console.log('Aero Server Online on Port ' + PORT));
