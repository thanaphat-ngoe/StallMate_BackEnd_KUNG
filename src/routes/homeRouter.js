const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middleware/authMiddleware');

router.get('/', (req, res) => {
    res.send(`
        <a href="/auth/stallowner/google">Authenticate as Stall Owner with Google </a> <br>
        <a href="/auth/customer/google">Authenticate as Customer with Google </a>`);
});

router.get('/dashboard/stallowner', isLoggedIn, (req, res) => {
    if (req.user) {
        res.json({ userType: req.user.userType, ownerID: req.user._id, ownerName: req.user.username })
    } else {
        res.redirect('/auth/stallowner/google');
    }
});

router.get('/dashboard/customer', isLoggedIn, (req, res) => {
    if (req.user) {
        res.json({ userType: req.user.userType, clientID: req.user._id, clientName: req.user.username });
    } else {
        res.redirect('/auth/customer/google');
    }
});

module.exports = router;