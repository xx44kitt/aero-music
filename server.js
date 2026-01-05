const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// DATABASE CONNECTION
// Uses the Environment Variable you set on Render
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(() => console.log("Permanent Cloud Database Connected!"))
    .catch(err => console.error("DB Connection Error:", err));

// SCHEMAS
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

// MIDDLEWARE
app.use(session({ secret: 'aero-secret', resave: false, saveUninitialized: false }));
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
        req.session.email = user.email;
        res.redirect('/index.html');
    } else { res.send("Invalid Login."); }
});

// SOCIAL ROUTES (Fixes image_b99ebc.png)
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

app.post('/api/comment', async (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login.html');
    await Post.findByIdAndUpdate(req.body.postId, {
        $push: { comments: { author: req.session.nickname, text: req.body.text } }
    });
    res.redirect('/social.html');
});

// ACCOUNT UPDATE
app.post('/update-account', async (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login.html');
    await User.findOneAndUpdate({ email: req.session.email }, { theme: req.body.theme });
    res.redirect('/account.html');
});

// PAGE ROUTES (Includes Library)
const protect = (req, res, next) => {
    if (req.session.isLoggedIn) next();
    else res.redirect('/login.html');
};

app.get('/', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/social.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'social.html')));
app.get('/account.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'account.html')));
app.get('/library.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'library.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));

app.listen(PORT, () => console.log('Aero Server Running...'));
