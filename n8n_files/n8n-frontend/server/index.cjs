const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../dist')));

// Serve uploaded files (n8n output)
app.use('/files', express.static('/usr/share/nginx/html/files'));

// Configure Multer for file uploads
// We save to the SAME shared volume so n8n can access it
const uploadDir = '/usr/share/nginx/html/files';

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create a unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const sharp = require('sharp');

// ... imports ...

// API Endpoint
app.post('/api/submit', upload.single('Product_Image'), async (req, res) => {
    try {
        const { Title, Description, Branding_Direction } = req.body;
        let file = req.file;

        console.log('Received submission:', { Title, file: file?.filename });

        if (file) {
            try {
                // Check if we need to convert to JPEG
                // We convert if it's NOT already a jpeg, or just to be safe and standardize everything.
                // Sharp handles HEIC if libvips is compiled with it (standard prebuilt binaries usually do).

                const originalPath = file.path;
                const filenameWithoutExt = path.parse(file.filename).name;
                const newFilename = `${filenameWithoutExt}.jpg`;
                const newPath = path.join(uploadDir, newFilename);

                console.log(`Processing image: ${file.originalname} -> ${newFilename}`);

                // Convert to JPEG
                await sharp(originalPath)
                    .toFormat('jpeg', { quality: 90 })
                    .toFile(newPath);

                // If the filename changed (i.e. it wasn't already .jpg), we might want to delete the original
                // or just keep it. Let's update the file object to point to the new file.
                if (originalPath !== newPath) {
                    // Optional: delete original if you want to save space
                    // fs.unlinkSync(originalPath); 

                    // Update file info for n8n payload
                    file.filename = newFilename;
                    file.path = newPath;
                    file.mimetype = 'image/jpeg';
                }

                console.log('Image conversion successful');

            } catch (conversionError) {
                console.error('Server-side image conversion failed:', conversionError);
                // If conversion fails, we proceed with the original file? 
                // Or fail the request? 
                // If it's HEIC and conversion failed, n8n might not be able to read it either if it relies on standard tools.
                // But let's log it and proceed with original, maybe n8n can handle it.
                console.warn('Proceeding with original file.');
            }
        }

        // Prepare payload for n8n
        // We send the ABSOLUTE PATH to the file so n8n can read it directly
        const n8nPayload = {
            Title,
            Description,
            Branding_Direction,
            // If running in Docker with shared volume, this path must be valid INSIDE n8n container
            // We assume n8n mounts the same volume at /home/rkadmin/n8n_files (or similar)
            // BUT: The user said n8n saves to /home/rkadmin/n8n_files on HOST.
            // We need to know where n8n sees this file.
            // Let's send the filename, and let n8n construct the path.
            Image_Filename: file ? file.filename : null
        };

        // Send to n8n Webhook
        // Using 127.0.0.1 because we are in host networking mode
        const n8nUrl = 'http://127.0.0.1:5678/webhook-test/form-submit';

        const response = await axios.post(n8nUrl, n8nPayload);

        res.json(response.data);

    } catch (error) {
        console.error('Error processing submission:', error.message);
        res.status(500).json({ error: 'Failed to process submission' });
    }
});

// Catch-all handler for React routing (Regex for Express 5)
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
