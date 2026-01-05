const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(session({
    secret: 'aero-secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use(bodyParser.urlencoded({ extended: true }));

// --- PUBLIC PAGES ---
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));

// --- PROTECTION GUARD ---
const protect = (req, res, next) => {
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.redirect('/login.html'); // Instantly kick them out if not logged in
    }
};

// --- PRIVATE PAGES ---
app.get('/', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/account.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'account.html')));
app.get('/library.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'library.html')));

// --- THE FIX: SIGNUP ROUTE ---
app.post('/signup', (req, res) => {
    const newUser = {
        nickname: req.body.nickname,
        email: req.body.email,
        password: req.body.password
    };
    // Save to users.json
    fs.appendFile('users.json', JSON.stringify(newUser) + '\n', (err) => {
        if (err) return res.send("Error saving user.");
        res.send('<h1>Success!</h1><p>Account created.</p><a href="/login.html">Login Now</a>');
    });
});

// --- LOGIN ROUTE ---
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!fs.existsSync('users.json')) return res.send("No users found.");

    fs.readFile('users.json', 'utf8', (err, data) => {
        const lines = data.trim().split('\n');
        const user = lines.map(l => JSON.parse(l)).find(u => u.email === email && u.password === password);
        
        if (user) {
            req.session.isLoggedIn = true;
            req.session.nickname = user.nickname;
            res.redirect('/index.html');
        } else {
            res.send('<h1>Login Failed</h1><a href="/login.html">Try Again</a>');
        }
    });
});

app.listen(PORT, () => console.log('Secure server live on ' + PORT));
