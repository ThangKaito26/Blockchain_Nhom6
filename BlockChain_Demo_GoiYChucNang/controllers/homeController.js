const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../models/db');
const crypto = require('crypto');
const multer = require('multer');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

// Middleware to require login for all users (Admin or Normal User)
const requireLogin = (req, res, next) => {
    if (req.user || req.session.admin) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Unified Login Page
router.get('/login', (req, res) => {
    if (req.user) return res.redirect('/user/dashboard');
    if (req.session.admin) return res.redirect('/admin/dashboard');
    res.render('login', { title: 'Đăng Nhập' });
});

// Admin Login POST route moved here for unification
const bcrypt = require('bcryptjs');
router.post('/login-admin', async (req, res) => {
    try {
        const { username, password } = req.body;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Username', sql.NVarChar, username)
            .query('SELECT * FROM Users WHERE Username = @Username AND Role = \'Admin\'');

        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            const isMatch = await bcrypt.compare(password, user.PasswordHash);
            if (isMatch) {
                req.session.admin = user;
                return res.redirect('/admin/dashboard');
            }
        }
        res.render('login', { error: 'Sai tài khoản hoặc mật khẩu' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi server');
    }
});

// Unified Logout
router.get('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy();
    }
    if (req.logout) {
        req.logout(() => {});
    }
    res.redirect('/login');
});

// Home page - Now requires login
router.get('/', requireLogin, (req, res) => {
    res.render('index', { title: 'Tra Cứu Chứng Chỉ' });
});

// Verify by Code
router.post('/verify-code', requireLogin, async (req, res) => {
    try {
        const { certCode } = req.body;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('CertCode', sql.NVarChar, certCode)
            .query('SELECT * FROM Certificates WHERE CertCode = @CertCode');

        let isSuccess = 0;
        let certData = null;

        if (result.recordset.length > 0) {
            certData = result.recordset[0];
            // Blockchain logic to verify the status will be handled in frontend 
            // but we can pass DB status
            if (certData.Status === 'Valid') {
                isSuccess = 1;
            }
        }

        // Save history
        await pool.request()
            .input('CertCode', sql.NVarChar, certCode)
            .input('IPAddress', sql.NVarChar, req.ip)
            .input('IsSuccess', sql.Bit, isSuccess)
            .query('INSERT INTO VerificationHistory (CertCode, IPAddress, IsSuccess) VALUES (@CertCode, @IPAddress, @IsSuccess)');

        res.json({ success: true, cert: certData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Verify by PDF Upload
router.post('/verify-file', requireLogin, upload.single('certFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        const fileBuffer = fs.readFileSync(req.file.path);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        const hexHash = hashSum.digest('hex');

        fs.unlinkSync(req.file.path); // Delete temp file

        const pool = await poolPromise;
        const result = await pool.request()
            .input('FileHash', sql.NVarChar, hexHash)
            .query('SELECT * FROM Certificates WHERE FileHash = @FileHash');

        let isSuccess = 0;
        let certData = null;

        if (result.recordset.length > 0) {
            certData = result.recordset[0];
            if (certData.Status === 'Valid') {
                isSuccess = 1;
            }
        }

        // Save history (using hash as temp code if no cert found)
        const codeForHistory = certData ? certData.CertCode : 'Unknown';
        await pool.request()
            .input('CertCode', sql.NVarChar, codeForHistory)
            .input('IPAddress', sql.NVarChar, req.ip)
            .input('IsSuccess', sql.Bit, isSuccess)
            .query('INSERT INTO VerificationHistory (CertCode, IPAddress, IsSuccess) VALUES (@CertCode, @IPAddress, @IsSuccess)');

        res.json({ success: true, cert: certData, hash: hexHash });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// View certificate details route
router.get('/certificate/:code', requireLogin, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('CertCode', sql.NVarChar, req.params.code)
            .query('SELECT * FROM Certificates WHERE CertCode = @CertCode');

        if (result.recordset.length > 0) {
            res.render('certificate', { cert: result.recordset[0] });
        } else {
            res.status(404).send('Không tìm thấy chứng chỉ');
        }
    } catch (err) {
        res.status(500).send('Lỗi server');
    }
});

module.exports = router;
