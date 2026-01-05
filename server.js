const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Required for Render

app.use(session({
    secret: 'aero-music-2010',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } 
}));

app.use(bodyParser.urlencoded({ extended: true }));

// Global Protection Middleware
const protect = (req, res, next) => {
    if (req.session.isLoggedIn) { next(); } 
    else { res.redirect('/login.html'); }
};

// --- AUTH ROUTES ---
app.post('/signup', (req, res) => {
    const newUser = { 
        nickname: req.body.nickname, 
        email: req.body.email.toLowerCase(), 
        password: req.body.password,
        theme: 'iOS 6 Classic',
        quality: 'High'
    };
    fs.appendFile('users.json', JSON.stringify(newUser) + '\n', (err) => {
        if (err) return res.send("Error saving account.");
        res.send('<body style="background:#444;color:white;text-align:center;padding-top:50px;font-family:sans-serif;"><h2>Welcome to Aero!</h2><a href="/login.html" style="color:#74b0ed">Login to continue</a></body>');
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!fs.existsSync('users.json')) return res.send("No users found.");
    
    const data = fs.readFileSync('users.json', 'utf8');
    const user = data.trim().split('\n').map(l => JSON.parse(l)).find(u => u.email === email.toLowerCase() && u.password === password);

    if (user) {
        req.session.isLoggedIn = true;
        req.session.nickname = user.nickname;
        res.redirect('/index.html');
    } else {
        res.send("Invalid credentials. <a href='/login.html'>Try again</a>");
    }
});

// --- PAGE ROUTES ---
app.get('/', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/account.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'account.html')));
app.get('/library.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'library.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

app.listen(PORT, () => console.log('Aero Music Live'));
