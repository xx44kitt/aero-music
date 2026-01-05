const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Aero Cloud Server: Permanent DB Connected!"))
    .catch(err => console.error("Database connection error:", err));

// 2. SCHEMAS
const User = mongoose.model('User', new mongoose.Schema({
    nickname: { type: String, unique: true },
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
app.use(session({ secret: 'aero-skeuo-secret', resave: false, saveUninitialized: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// 4. AUTHENTICATION
app.post('/signup', async (req, res) => {
    try {
        const user = new User({ nickname: req.body.nickname, email: req.body.email.toLowerCase().trim(), password: req.body.password });
        await user.save();
        res.send('<h2>Account Created!</h2><a href="/login.html">Login</a>');
    } catch (e) { res.send("Error: User exists or DB error."); }
});

app.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email.toLowerCase().trim(), password: req.body.password });
    if (user) {
        req.session.isLoggedIn = true;
        req.session.nickname = user.nickname;
        res.redirect('/index.html');
    } else { res.send("Invalid Login."); }
});

// 5. FRIENDS & SEARCH ENGINE
app.get('/api/search-users', async (req, res) => {
    const users = await User.find({ nickname: { $regex: req.query.name, $options: 'i' } }).select('nickname');
    res.json(users);
});

app.post('/api/add-friend', async (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login.html');
    await User.findOneAndUpdate({ nickname: req.session.nickname }, { $addToSet: { friends: req.body.friendName } });
    await User.findOneAndUpdate({ nickname: req.body.friendName }, { $addToSet: { friends: req.session.nickname } });
    res.redirect(`/profile.html?user=${req.body.friendName}`);
});

// 6. PAGE ROUTES
const protect = (req, res, next) => req.session.isLoggedIn ? next() : res.redirect('/login.html');
app.get('/', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/social.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'social.html')));
app.get('/profile.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'profile.html')));
app.get('/library.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'library.html')));
app.get('/api/posts', async (req, res) => res.json(await Post.find().sort({ date: -1 })));
app.post('/api/post', async (req, res) => {
    const p = new Post({ author: req.session.nickname, content: req.body.content });
    await p.save(); res.redirect('/social.html');
});

app.listen(PORT, () => console.log('Aero Server Online'));
