import heic2any from 'heic2any';

/**
 * Converts an image file to JPEG format.
 * - Converts HEIC/HEIF using heic2any.
 * - Converts other non-JPEG/PNG formats (e.g., BMP, WEBP) using Canvas.
 * - Returns original file if it's already JPEG or PNG.
 * 
 * @param {File} file - The input file object.
 * @returns {Promise<File>} - The processed File object (JPEG).
 */
export const processImageFile = async (file) => {
    if (!file) return null;

    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    // 1. Handle HEIC/HEIF
    if (fileType === 'image/heic' || fileType === 'image/heif' || fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
        try {
            console.log('Converting HEIC to JPEG...');
            const convertedBlob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.8
            });

            // heic2any can return an array if multiple images are in the HEIC, take the first one
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

            return new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
                type: 'image/jpeg'
            });
        } catch (error) {
            console.error("Error converting HEIC:", error);
            throw new Error("Failed to convert HEIC image.");
        }
    }

    // 2. Handle other non-standard web formats (e.g., BMP, TIFF if browser supports reading them but we want JPEG)
    // Or if we just want to enforce JPEG/PNG for everything else that isn't already.
    // Let's say we want to convert EVERYTHING that isn't JPEG or PNG to JPEG.
    if (fileType !== 'image/jpeg' && fileType !== 'image/png' && fileType !== 'image/jpg') {
        try {
            console.log(`Converting ${fileType} to JPEG...`);
            return await convertToJpegViaCanvas(file);
        } catch (error) {
            console.warn(`Canvas conversion failed for ${fileType}, using original file.`, error);
            return file;
        }
    }

    // 3. If it's already JPEG or PNG, return as is
    return file;
};

/**
 * Helper to convert an image file to JPEG using HTML Canvas.
 * @param {File} file 
 * @returns {Promise<File>}
 */
const convertToJpegViaCanvas = (file) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            canvas.toBlob((blob) => {
                if (blob) {
                    const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                        type: 'image/jpeg'
                    });
                    resolve(newFile);
                } else {
                    reject(new Error("Canvas toBlob failed"));
                }
            }, 'image/jpeg', 0.9);
        };

        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
        };

        img.src = url;
    });
};
