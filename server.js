const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Aero Friends Server Active"))
    .catch(err => console.error(err));

// UPDATED SCHEMAS
const User = mongoose.model('User', new mongoose.Schema({
    nickname: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String,
    friends: [{ type: String }] // Array of nicknames
}));

const WallPost = mongoose.model('WallPost', new mongoose.Schema({
    to: String,      // Whose wall it's on
    from: String,    // Who wrote it
    content: String,
    date: { type: Date, default: Date.now }
}));

app.use(session({ secret: 'aero-friends-secret', resave: false, saveUninitialized: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// --- FRIENDS ENGINE ---

// Add Friend
app.post('/api/add-friend', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(401).send("Login required");
    const friendName = req.body.friendName;
    
    // Add to your list
    await User.findOneAndUpdate({ nickname: req.session.nickname }, { $addToSet: { friends: friendName } });
    // Add you to their list (mutual)
    await User.findOneAndUpdate({ nickname: friendName }, { $addToSet: { friends: req.session.nickname } });
    
    res.redirect(`/profile.html?user=${friendName}`);
});

// Delete Friend
app.post('/api/delete-friend', async (req, res) => {
    const { friendName } = req.body;
    await User.findOneAndUpdate({ nickname: req.session.nickname }, { $pull: { friends: friendName } });
    await User.findOneAndUpdate({ nickname: friendName }, { $pull: { friends: req.session.nickname } });
    res.redirect('/social.html');
});

// Post on a Wall
app.post('/api/wall-post', async (req, res) => {
    const post = new WallPost({
        to: req.body.to,
        from: req.session.nickname,
        content: req.body.content
    });
    await post.save();
    res.redirect(`/profile.html?user=${req.body.to}`);
});

// Get Profile Data
app.get('/api/profile/:name', async (req, res) => {
    const user = await User.findOne({ nickname: req.params.name }).select('nickname friends');
    const posts = await WallPost.find({ to: req.params.name }).sort({ date: -1 });
    res.json({ user, posts, isMe: req.session.nickname === req.params.name });
});

// STANDARD ROUTES
const protect = (req, res, next) => req.session.isLoggedIn ? next() : res.redirect('/login.html');
app.get('/profile.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'profile.html')));
app.get('/social.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'social.html')));
app.get('/index.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log('Server running...'));
