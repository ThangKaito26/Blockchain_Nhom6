const express = require('express');
const router = express.Router();
const passport = require('passport');
const { poolPromise, sql } = require('../models/db');

// Middleware to check if user is logged in
const isAuth = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Note: Login GET route is now unified in homeController.js as /login

// Auth via Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google Callback
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/user/dashboard');
  }
);

// Logout handled in homeController

// User Dashboard
router.get('/dashboard', isAuth, async (req, res) => {
    try {
        const pool = await poolPromise;
        
        // Fetch saved certificates
        const result = await pool.request()
            .input('UserId', sql.Int, req.user.UserId)
            .query(`
                SELECT c.*, uc.AddedDate 
                FROM Certificates c
                JOIN UserCertificates uc ON c.CertCode = uc.CertCode
                WHERE uc.UserId = @UserId
                ORDER BY uc.AddedDate DESC
            `);
            
        res.render('user/dashboard', {
            user: req.user,
            myCertificates: result.recordset
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi server');
    }
});

// Add a certificate to user wallet
router.post('/add-certificate', isAuth, async (req, res) => {
    try {
        const { certCode } = req.body;
        const pool = await poolPromise;
        
        // Check if certificate exists
        const certCheck = await pool.request()
            .input('CertCode', sql.NVarChar, certCode)
            .query('SELECT CertId, RecipientName FROM Certificates WHERE CertCode = @CertCode');
            
        if (certCheck.recordset.length === 0) {
            return res.status(400).json({ success: false, message: 'Mã chứng chỉ không tồn tại!' });
        }
        
        // Check if user already added it
        const existCheck = await pool.request()
            .input('UserId', sql.Int, req.user.UserId)
            .input('CertCode', sql.NVarChar, certCode)
            .query('SELECT Id FROM UserCertificates WHERE UserId = @UserId AND CertCode = @CertCode');
            
        if (existCheck.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Bạn đã thêm chứng chỉ này vào ví rồi!' });
        }
        
        // Insert into UserCertificates
        await pool.request()
            .input('UserId', sql.Int, req.user.UserId)
            .input('CertCode', sql.NVarChar, certCode)
            .query('INSERT INTO UserCertificates (UserId, CertCode) VALUES (@UserId, @CertCode)');
            
        res.json({ success: true, message: 'Đã thêm thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;
