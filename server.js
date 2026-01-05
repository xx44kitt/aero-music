const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Aero Server: DB Connected!"))
    .catch(err => console.error("Database Connection Error:", err));

// 2. SCHEMAS
const UserSchema = new mongoose.Schema({
    nickname: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String,
    bio: { type: String, default: "Aero User" },
    theme: { type: String, default: "Classic Blue" },
    friends: [String]
});
const User = mongoose.model('User', UserSchema);

const PostSchema = new mongoose.Schema({
    author: String,
    content: String,
    date: { type: Date, default: Date.now },
    comments: [{ author: String, text: String, date: { type: Date, default: Date.now } }]
});
const Post = mongoose.model('Post', PostSchema);

// 3. MIDDLEWARE
app.use(session({ secret: 'aero-vibe-2026', resave: false, saveUninitialized: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

// 4. AUTHENTICATION PROTECTION
const protect = (req, res, next) => {
    if (req.session.isLoggedIn) next();
    else res.redirect('/login.html');
};

// 5. PAGE ROUTES
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/library.html', (req, res) => res.sendFile(path.join(__dirname, 'library.html')));
app.get('/social.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'social.html')));
app.get('/profile.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'profile.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));

// 6. API ENDPOINTS
app.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email.toLowerCase().trim(), password: req.body.password });
    if (user) {
        req.session.isLoggedIn = true;
        req.session.nickname = user.nickname;
        res.redirect('/index.html');
    } else { res.send("Invalid Login. <a href='/login.html'>Try again</a>"); }
});

app.get('/api/posts', async (req, res) => res.json(await Post.find().sort({ date: -1 })));

app.post('/api/post', protect, async (req, res) => {
    const newPost = new Post({ author: req.session.nickname, content: req.body.content });
    await newPost.save();
    res.redirect('/social.html');
});

app.post('/api/delete-post', protect, async (req, res) => {
    await Post.findOneAndDelete({ _id: req.body.postId, author: req.session.nickname });
    res.redirect('/social.html');
});

app.post('/api/comment', protect, async (req, res) => {
    await Post.findByIdAndUpdate(req.body.postId, {
        $push: { comments: { author: req.session.nickname, text: req.body.text } }
    });
    res.redirect('/social.html');
});

app.get('/api/search-users', async (req, res) => {
    const users = await User.find({ nickname: { $regex: req.query.name, $options: 'i' } }).select('nickname');
    res.json(users);
});

app.get('/api/profile/:name', protect, async (req, res) => {
    const user = await User.findOne({ nickname: req.params.name });
    const posts = await Post.find({ author: req.params.name }).sort({ date: -1 });
    res.json({ user, posts, isMe: req.session.nickname === req.params.name });
});

app.post('/api/update-profile', protect, async (req, res) => {
    await User.findOneAndUpdate({ nickname: req.session.nickname }, { bio: req.body.bio, theme: req.body.theme });
    res.redirect('/profile.html?user=' + req.session.nickname);
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/index.html'); });

app.listen(PORT, () => console.log('Aero Server Online'));
