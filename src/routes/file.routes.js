const express = require('express');
const multer = require('multer');
const { uploadFile } = require('../controllers/file.controller');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), uploadFile);

module.exports = router;
