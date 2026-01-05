const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(session({
    secret: 'aero-social-2010',
    resave: false,
    saveUninitialized: false
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// --- DATABASE LOGIC ---
let posts = []; // Stores Wall Posts

const getUsers = () => {
    if (!fs.existsSync('users.json')) return [];
    const data = fs.readFileSync('users.json', 'utf8');
    return data.trim().split('\n').filter(l => l).map(l => JSON.parse(l));
};

// --- AUTH SYSTEM (FIXED) ---
app.post('/login', (req, res) => {
    const emailInput = req.body.email.toLowerCase().trim();
    const passwordInput = req.body.password;
    
    const users = getUsers();
    // Improved matching logic
    const user = users.find(u => u.email.toLowerCase().trim() === emailInput && u.password === passwordInput);

    if (user) {
        req.session.isLoggedIn = true;
        req.session.nickname = user.nickname;
        res.redirect('/index.html');
    } else {
        res.send('User not found. Remember: On Render Free, accounts reset after updates! <a href="/signup.html">Sign up again</a>');
    }
});

// --- FACEBOOK PROTOCOL (Posts & Comments) ---
app.post('/api/post', (req, res) => {
    const newPost = {
        id: Date.now(),
        author: req.session.nickname || "Anonymous",
        content: req.body.content,
        comments: [],
        date: new Date().toLocaleString()
    };
    posts.unshift(newPost);
    res.redirect('/social.html');
});

app.post('/api/comment', (req, res) => {
    const { postId, text } = req.body;
    const post = posts.find(p => p.id == postId);
    if (post) {
        post.comments.push({
            author: req.session.nickname || "Anonymous",
            text: text
        });
    }
    res.redirect('/social.html');
});

app.get('/api/posts', (req, res) => res.json(posts));

app.listen(PORT, () => console.log('Aero Social Live'));
