const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
// This line allows Render to set the port automatically
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// --- ROUTES ---

// Signup Logic
app.post('/signup', (req, res) => {
    const newUser = {
        nickname: req.body.nickname,
        email: req.body.email,
        password: req.body.password
    };
    fs.appendFile('users.json', JSON.stringify(newUser) + '\n', (err) => {
        if (err) return res.send("Error saving account.");
        res.send('<h1>Account Created!</h1><a href="/login.html">Go to Login</a>');
    });
});

// Login Logic
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    fs.readFile('users.json', 'utf8', (err, data) => {
        if (err) return res.send("No users found.");
        const lines = data.trim().split('\n');
        let user = null;
        for (let line of lines) {
            try {
                let u = JSON.parse(line);
                if (u.email === email && u.password === password) { 
                    user = u; 
                    break; 
                }
            } catch (e) { continue; }
        }
        if (user) {
            res.redirect('/index.html');
        } else {
            res.send('<h1>Login Failed</h1><a href="/login.html">Try Again</a>');
        }
    });
});

// Account Update Logic
app.post('/update-account', (req, res) => {
    res.send('<h1>Profile Updated!</h1><a href="/index.html">Back to Home</a>');
});

// Start Server
app.listen(PORT, () => {
    console.log('Server is live on port ' + PORT);
});
