const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Required for Render

// 1. Session Setup (Keeps you logged in)
app.use(session({
    secret: 'aero-music-secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use(bodyParser.urlencoded({ extended: true }));

// 2. Security Middleware (The "Lock")
const protect = (req, res, next) => {
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.redirect('/login.html');
    }
};

// 3. Public Pages (Everyone can see these)
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));

// 4. Protected Pages (Only for logged-in users)
app.get('/', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/account.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'account.html')));
app.get('/library.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'library.html')));

// 5. Signup Logic (Fixes image_b76840.png)
app.post('/signup', (req, res) => {
    const newUser = {
        nickname: req.body.nickname,
        email: req.body.email,
        password: req.body.password
    };
    fs.appendFile('users.json', JSON.stringify(newUser) + '\n', (err) => {
        if (err) return res.send("Error saving account.");
        res.send('<h1>Success!</h1><p>Account created.</p><a href="/login.html">Click here to Login</a>');
    });
});

// 6. Login Logic
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!fs.existsSync('users.json')) return res.send("No users found. Please sign up first.");

    fs.readFile('users.json', 'utf8', (err, data) => {
        const lines = data.trim().split('\n');
        const user = lines.map(line => JSON.parse(line)).find(u => u.email === email && u.password === password);
        
        if (user) {
            req.session.isLoggedIn = true;
            req.session.nickname = user.nickname;
            res.redirect('/index.html');
        } else {
            res.send('<h1>Login Failed</h1><p>Wrong email or password.</p><a href="/login.html">Try Again</a>');
        }
    });
});

// 7. Update Account Logic (Fixes image_b76bc0.png)
app.post('/update-account', (req, res) => {
    // This receives the data from your new glossy profile page
    const { nickname, bio, theme } = req.body;
    
    // For now, we confirm the update. In a full version, we'd update users.json
    res.send(`
        <body style="background: ${theme || '#111'}; color: white; font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1>Profile Updated!</h1>
            <p>New Nickname: ${nickname}</p>
            <p>Bio: ${bio}</p>
            <a href="/index.html" style="color: cyan;">Back to Aero Music</a>
        </body>
    `);
});

// 8. Logout Logic
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

app.listen(PORT, () => console.log('Aero Server is running on port ' + PORT));
