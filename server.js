const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. DATABASE CONNECTION
// Pulls the URI from Render Environment variables to satisfy GitHub security
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(() => console.log("Aero Music Cloud Server Active: Permanent DB Connected!"))
    .catch(err => console.error("Database connection error:", err));

// 2. DATA SCHEMAS
const User = mongoose.model('User', new mongoose.Schema({
    nickname: String,
    email: { type: String, unique: true },
    password: String,
    theme: { type: String, default: 'iOS 6 Classic' },
    quality: { type: String, default: 'High' }
}));

const Post = mongoose.model('Post', new mongoose.Schema({
    author: String,
    content: String,
    date: { type: Date, default: Date.now },
    comments: [{ author: String, text: String }]
}));

// 3. MIDDLEWARE
app.use(session({
    secret: 'aero-skeuomorphic-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } 
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// 4. AUTHENTICATION (Fixes Signup/Login crashes)
app.post('/signup', async (req, res) => {
    try {
        const newUser = new User({
            nickname: req.body.nickname,
            email: req.body.email.toLowerCase().trim(),
            password: req.body.password
        });
        await newUser.save();
        res.send('<h2>Account Secured!</h2><a href="/login.html">Login to Aero Music</a>');
    } catch (e) {
        res.send('Error: Account could not be created. <a href="/signup.html">Try again</a>');
    }
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
    } else {
        res.send('Invalid login. <a href="/login.html">Try again</a>');
    }
});

// 5. SOCIAL WALL LOGIC (Fixes "Cannot POST /api/post")
app.get('/api/posts', async (req, res) => {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
});

app.post('/api/post', async (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login.html');
    const newPost = new Post({ 
        author: req.session.nickname, 
        content: req.body.content 
    });
    await newPost.save();
    res.redirect('/social.html');
});

app.post('/api/comment', async (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login.html');
    const { postId, text } = req.body;
    await Post.findByIdAndUpdate(postId, {
        $push: { comments: { author: req.session.nickname, text: text } }
    });
    res.redirect('/social.html');
});

// 6. ACCOUNT UPDATES
app.post('/update-account', async (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login.html');
    await User.findOneAndUpdate(
        { email: req.session.email },
        { theme: req.body.theme, quality: req.body.quality }
    );
    res.redirect('/account.html?saved=true');
});

// 7. PAGE ROUTES & PROTECTION
const protect = (req, res, next) => {
    if (req.session.isLoggedIn) next();
    else res.redirect('/login.html');
};

app.get('/', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/social.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'social.html')));
app.get('/account.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'account.html')));

app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));
