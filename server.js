const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Aero Server: DB Connected!"))
    .catch(err => console.error("DB Error:", err));

// SCHEMAS
const User = mongoose.model('User', new mongoose.Schema({
    nickname: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String,
    friends: [String]
}));

const Post = mongoose.model('Post', new mongoose.Schema({
    author: String,
    content: String,
    date: { type: Date, default: Date.now }
}));

// MIDDLEWARE
app.use(session({ secret: 'aero-vibe-2026', resave: false, saveUninitialized: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

// AUTHENTICATION LOGIC
const protect = (req, res, next) => {
    if (req.session.isLoggedIn) next();
    else res.redirect('/login.html');
};

// PUBLIC ROUTES (No Login Required)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/library.html', (req, res) => res.sendFile(path.join(__dirname, 'library.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));

// PRIVATE ROUTES (Login Required)
app.get('/social.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'social.html')));
app.get('/profile.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'profile.html')));

// API ENDPOINTS
app.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email.toLowerCase().trim(), password: req.body.password });
    if (user) {
        req.session.isLoggedIn = true;
        req.session.nickname = user.nickname;
        res.redirect('/index.html');
    } else { res.send("Invalid Login."); }
});

app.get('/api/posts', async (req, res) => res.json(await Post.find().sort({ date: -1 })));
app.post('/api/post', protect, async (req, res) => {
    const p = new Post({ author: req.session.nickname, content: req.body.content });
    await p.save(); res.redirect('/social.html');
});

app.get('/api/search-users', async (req, res) => {
    const users = await User.find({ nickname: { $regex: req.query.name, $options: 'i' } }).select('nickname');
    res.json(users);
});

app.listen(PORT, () => console.log('Aero Server Online'));
