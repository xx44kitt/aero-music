const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. DATABASE CONNECTION
// Ensure MONGO_URI is set in Render Environment Variables
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Aero Server: MongoDB Connected!"))
    .catch(err => console.error("Database Error:", err));

// 2. SCHEMAS
const User = mongoose.model('User', new mongoose.Schema({
    nickname: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String
}));

const Post = mongoose.model('Post', new mongoose.Schema({
    author: String,
    content: String,
    date: { type: Date, default: Date.now }
}));

// 3. MIDDLEWARE
app.use(session({ secret: 'aero-vibe', resave: false, saveUninitialized: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serves your HTML files

// 4. AUTH ROUTES
app.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email.toLowerCase().trim(), password: req.body.password });
    if (user) {
        req.session.isLoggedIn = true;
        req.session.nickname = user.nickname;
        res.redirect('/index.html');
    } else { res.send("Invalid Login."); }
});

// 5. SOCIAL API (Fixes)
app.get('/api/posts', async (req, res) => {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
});

app.post('/api/post', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(401).send("Not Logged In");
    const newPost = new Post({ author: req.session.nickname, content: req.body.content });
    await newPost.save();
    res.redirect('/social.html');
});

// 6. PAGE ROUTING (Fixes)
const protect = (req, res, next) => {
    if (req.session.isLoggedIn) next();
    else res.redirect('/login.html');
};

// This line specifically fixes "Cannot GET /"
app.get('/', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.get('/index.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/library.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'library.html')));
app.get('/social.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'social.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));

app.listen(PORT, () => console.log('Aero Server Online'));
