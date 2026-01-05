const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup session (The "Login Memory")
app.use(session({
    secret: 'aero-secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use(bodyParser.urlencoded({ extended: true }));

// ONLY make the login and signup pages public
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));

// SECURITY MIDDLEWARE: Checks if user is logged in
const protect = (req, res, next) => {
    if (req.session.isLoggedIn) {
        next(); // Let them through
    } else {
        res.redirect('/login.html'); // Send them back to login
    }
};

// PROTECT ALL OTHER PAGES
app.get('/', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/account.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'account.html')));
app.get('/library.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'library.html')));

// LOGIN LOGIC
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    fs.readFile('users.json', 'utf8', (err, data) => {
        if (err) return res.send("No users found.");
        const lines = data.trim().split('\n');
        const user = lines.map(l => JSON.parse(l)).find(u => u.email === email && u.password === password);
        
        if (user) {
            req.session.isLoggedIn = true; // LOCK THE SESSION
            req.session.username = user.nickname;
            res.redirect('/index.html');
        } else {
            res.send('<h1>Login Failed</h1><a href="/login.html">Try Again</a>');
        }
    });
});

app.listen(PORT, () => console.log('Secure Server live on ' + PORT));;
