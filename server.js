const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. SESSION CONFIGURATION (The "Memory" of the site)
app.use(session({
    secret: 'aero-social-2010-logic',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // Session lasts 1 hour
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// 2. DATABASE HELPERS
const USERS_FILE = 'users.json';

const getUsers = () => {
    if (!fs.existsSync(USERS_FILE)) return [];
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return data.trim().split('\n').filter(line => line).map(line => JSON.parse(line));
    } catch (e) {
        return [];
    }
};

// 3. SECURITY MIDDLEWARE (The "Encryption" lock)
const protect = (req, res, next) => {
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.redirect('/login.html');
    }
};

// 4. AUTHENTICATION ROUTES
app.post('/signup', (req, res) => {
    const { nickname, email, password } = req.body;
    const users = getUsers();
    
    if (users.find(u => u.email === email.toLowerCase())) {
        return res.send('Email already exists. <a href="/signup.html">Try again</a>');
    }

    const newUser = {
        nickname,
        email: email.toLowerCase(),
        password,
        friends: [],
        theme: 'iOS 6 Classic',
        joined: new Date().toLocaleDateString()
    };

    fs.appendFileSync(USERS_FILE, JSON.stringify(newUser) + '\n');
    res.send('<body style="background:#444;color:white;text-align:center;padding-top:50px;font-family:sans-serif;"><h2>Account Created!</h2><a href="/login.html" style="color:#74b0ed">Login to Aero Music</a></body>');
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email.toLowerCase() && u.password === password);

    if (user) {
        req.session.isLoggedIn = true;
        req.session.nickname = user.nickname;
        req.session.email = user.email;
        res.redirect('/index.html');
    } else {
        res.send('Invalid login. <a href="/login.html">Try again</a>');
    }
});

// 5. SOCIAL SYSTEM API
let globalMessages = []; // Temporary message store for this session

app.get('/api/users', protect, (req, res) => {
    const users = getUsers().map(u => ({ nickname: u.nickname, email: u.email }));
    res.json(users);
});

app.get('/api/messages', protect, (req, res) => {
    res.json(globalMessages);
});

app.post('/api/send-message', protect, (req, res) => {
    const newMessage = {
        from: req.session.nickname,
        text: req.body.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    globalMessages.push(newMessage);
    if (globalMessages.length > 50) globalMessages.shift(); // Keep only last 50
    res.redirect('/social.html');
});

// 6. ACCOUNT UPDATE LOGIC
app.post('/update-account', protect, (req, res) => {
    // Logic for updating settings (Quality, Theme, etc.)
    res.redirect('/account.html?saved=true');
});

// 7. PAGE SERVING (Static Protection)
app.get('/', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/library.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'library.html')));
app.get('/account.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'account.html')));
app.get('/social.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'social.html')));

app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

// 8. START SERVER
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
