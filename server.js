const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Required for Render

// 1. DATABASE CONNECTION (Using your provided credentials)
const mongoURI = "mongodb+srv://pashaaero:braraPASSWORD@aeromusic.5k8bp04.mongodb.net/?retryWrites=true&w=majority&appName=aeromusic";

mongoose.connect(mongoURI)
    .then(() => console.log("Permanent Cloud Database Connected!"))
    .catch(err => console.log("Connection Error: ", err));

// 2. DATA SCHEMAS (Models for Users and Posts)
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
    secret: 'aero-music-secret-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // Session lasts 1 hour
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// 4. AUTHENTICATION LOGIC (Fixes image_b76840.png)
app.post('/signup', async (req, res) => {
    try {
        const newUser = new User({
            nickname: req.body.nickname,
            email: req.body.email.toLowerCase().trim(),
            password: req.body.password
        });
        await newUser.save();
        res.send('<h2>Account Created!</h2><a href="/login.html">Login to Aero</a>');
    } catch (e) {
        res.send('Error: User already exists. <a href="/signup.html">Try a different email</a>');
    }
});

app.post('/login', async (req, res) => {
    const emailInput = req.body.email.toLowerCase().trim();
    const user = await User.findOne({ email: emailInput, password: req.body.password });

    if (user) {
        req.session.isLoggedIn = true;
        req.session.nickname = user.nickname;
        req.session.email = user.email;
        res.redirect('/index.html');
    } else {
        res.send('Invalid login. <a href="/login.html">Try again</a>');
    }
});

// 5. SOCIAL WALL LOGIC (Facebook-style Feed)
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

// 6. ACCOUNT UPDATES (Fixes image_b76bc0.png)
app.post('/update-account', async (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login.html');
    await User.findOneAndUpdate(
        { email: req.session.email },
        { theme: req.body.theme, quality: req.body.quality }
    );
    res.redirect('/account.html?saved=true');
});

// 7. ROUTE PROTECTION & PAGE SERVING
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

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

// 8. START THE ENGINE
app.listen(PORT, () => console.log('Aero Music Cloud Server Active on ' + PORT));
