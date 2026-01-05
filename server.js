const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Aero Server: Connected"))
    .catch(err => console.error(err));

const User = mongoose.model('User', new mongoose.Schema({
    nickname: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String,
    bio: { type: String, default: "Aero User" }
}));

const Post = mongoose.model('Post', new mongoose.Schema({
    author: String,
    content: String,
    date: { type: Date, default: Date.now },
    comments: [{ author: String, text: String }]
}));

app.use(session({ secret: 'aero-vibe', resave: false, saveUninitialized: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

const protect = (req, res, next) => {
    if (req.session.isLoggedIn) next();
    else res.redirect('/login.html');
};

// Fixed Profile Logic
app.get('/api/me', protect, (req, res) => {
    res.json({ nickname: req.session.nickname });
});

app.get('/api/profile/:name', protect, async (req, res) => {
    const user = await User.findOne({ nickname: req.params.name });
    const posts = await Post.find({ author: req.params.name }).sort({ date: -1 });
    res.json({ user, posts, isMe: req.session.nickname === req.params.name });
});

// Comment Deletion Logic
app.post('/api/delete-comment', protect, async (req, res) => {
    const { postId, commentId } = req.body;
    await Post.findByIdAndUpdate(postId, {
        $pull: { comments: { _id: commentId, author: req.session.nickname } }
    });
    res.redirect('/social.html');
});

// Routing
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/social.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'social.html')));
app.get('/profile.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'profile.html')));

app.listen(PORT, () => console.log('Aero Online'));
