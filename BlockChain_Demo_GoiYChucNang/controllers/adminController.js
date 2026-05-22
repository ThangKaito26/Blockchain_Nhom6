const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../models/db');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const { pinFileToIPFS } = require('../utils/pinata');

const upload = multer({ dest: 'uploads/' });

// Middleware for Admin check
const isAdmin = (req, res, next) => {
    if (req.session.admin) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Admin login POST route has been moved to homeController.js as /login-admin
// Logout handled in homeController

router.get('/dashboard', isAdmin, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Certificates ORDER BY IssueDate DESC');
        res.render('admin/dashboard', { 
            admin: req.session.admin, 
            certificates: result.recordset 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi server');
    }
});

// API Endpoint to Prepare Certificate (Upload to IPFS & Gen Hash)
router.post('/prepare-issue', isAdmin, upload.single('certFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        // Calculate Hash
        const fileBuffer = fs.readFileSync(req.file.path);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        const hexHash = hashSum.digest('hex');

        // Check if hash already exists in DB
        const pool = await poolPromise;
        const checkResult = await pool.request()
            .input('FileHash', sql.NVarChar, hexHash)
            .query('SELECT CertId FROM Certificates WHERE FileHash = @FileHash');
            
        if (checkResult.recordset.length > 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: 'File (Hash) này đã được cấp chứng chỉ trước đó!' });
        }

        // Upload to IPFS
        let ipfsCID = '';
        if (process.env.PINATA_API_KEY && process.env.PINATA_API_KEY !== 'your_pinata_api_key') {
            ipfsCID = await pinFileToIPFS(req.file.path);
        } else {
            // Mock IPFS CID if Pinata is not configured
            ipfsCID = 'mock_cid_' + Date.now();
        }

        // Cleanup temp file
        fs.unlinkSync(req.file.path);

        res.json({ success: true, hash: hexHash, ipfsCID });
    } catch (err) {
        console.error(err);
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, message: 'Lỗi trong quá trình chuẩn bị file' });
    }
});

// API Endpoint to Save Certificate to SQL after MetaMask success
router.post('/save-certificate', isAdmin, async (req, res) => {
    try {
        const { certCode, recipientName, courseName, issuerName, ipfsCID, fileHash } = req.body;
        
        const pool = await poolPromise;
        await pool.request()
            .input('CertCode', sql.NVarChar, certCode)
            .input('RecipientName', sql.NVarChar, recipientName)
            .input('CourseName', sql.NVarChar, courseName)
            .input('IssuerName', sql.NVarChar, issuerName)
            .input('IpfsCID', sql.NVarChar, ipfsCID)
            .input('FileHash', sql.NVarChar, fileHash)
            .query(`
                INSERT INTO Certificates (CertCode, RecipientName, CourseName, IssuerName, IpfsCID, FileHash, Status)
                VALUES (@CertCode, @RecipientName, @CourseName, @IssuerName, @IpfsCID, @FileHash, 'Valid')
            `);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi khi lưu vào CSDL' });
    }
});

// API Endpoint to Revoke Certificate in SQL after MetaMask success
router.post('/revoke-certificate', isAdmin, async (req, res) => {
    try {
        const { fileHash } = req.body;
        
        const pool = await poolPromise;
        await pool.request()
            .input('FileHash', sql.NVarChar, fileHash)
            .query(`UPDATE Certificates SET Status = 'Revoked' WHERE FileHash = @FileHash`);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật CSDL' });
    }
});

module.exports = router;
