const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(session({
    secret: 'ios6-secret',
    resave: false,
    saveUninitialized: false
}));

app.use(bodyParser.urlencoded({ extended: true }));

// Security Guard
const protect = (req, res, next) => {
    if (req.session.isLoggedIn) { next(); } 
    else { res.redirect('/login.html'); }
};

// Public Routes
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));

// Protected Routes
app.get('/', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/account.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'account.html')));
app.get('/library.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'library.html')));

// Signup Logic
app.post('/signup', (req, res) => {
    const newUser = { nickname: req.body.nickname, email: req.body.email, password: req.body.password };
    fs.appendFile('users.json', JSON.stringify(newUser) + '\n', (err) => {
        if (err) return res.send("Error");
        res.send('<body style="background:#444;color:white;text-align:center"><h2>Success</h2><a href="/login.html" style="color:white">Login</a></body>');
    });
});

// Login Logic
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!fs.existsSync('users.json')) return res.send("No users found.");
    fs.readFile('users.json', 'utf8', (err, data) => {
        const user = data.trim().split('\n').map(l => JSON.parse(l)).find(u => u.email === email && u.password === password);
        if (user) {
            req.session.isLoggedIn = true;
            req.session.nickname = user.nickname;
            res.redirect('/index.html');
        } else { res.send("Invalid Login"); }
    });
});

app.listen(PORT, () => console.log('iOS 6 Server Live'));
