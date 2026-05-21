const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

const PORT = process.env.PORT || 3002;
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/files';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://n8n:5678/webhook/form-submit';

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../dist')));
app.use('/files', express.static(UPLOAD_DIR));

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
});

app.post('/api/submit', upload.single('Product_Image'), async (req, res) => {
    try {
        const { Title, Description, Branding_Direction } = req.body;
        let file = req.file;

        console.log('Received submission:', { Title, file: file?.filename });

        if (file) {
            try {
                const originalPath = file.path;
                const filenameWithoutExt = path.parse(file.filename).name;
                const newFilename = `${filenameWithoutExt}.jpg`;
                const newPath = path.join(UPLOAD_DIR, newFilename);

                const isHeic = file.filename.toLowerCase().endsWith('.heic');
                const command = isHeic
                    ? `heif-convert -q 90 "${originalPath}" "${newPath}"`
                    : `convert "${originalPath}" -quality 90 "${newPath}"`;

                console.log(`Converting image: ${file.originalname} -> ${newFilename}`);
                await execPromise(command);

                if (originalPath !== newPath) {
                    file.filename = newFilename;
                    file.path = newPath;
                    file.mimetype = 'image/jpeg';
                }
            } catch (conversionError) {
                console.error('Image conversion failed, proceeding with original file:', conversionError);
            }
        }

        const n8nPayload = {
            Title,
            Description,
            Branding_Direction,
            Image_Filename: file ? file.filename : null,
        };

        const response = await axios.post(N8N_WEBHOOK_URL, n8nPayload);
        res.json(response.data);
    } catch (error) {
        console.error('Error processing submission:', error.message);
        res.status(500).json({ error: 'Failed to process submission' });
    }
});

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Upload dir: ${UPLOAD_DIR}`);
    console.log(`n8n webhook: ${N8N_WEBHOOK_URL}`);
});
