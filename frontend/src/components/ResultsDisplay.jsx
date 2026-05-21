import React from 'react';

const ResultsDisplay = ({ data, onReset }) => {
    if (!data) return null;

    const { title, description, image1, image2, image3, video } = data;

    // Helper to extract filename from full path
    const getFilename = (path) => {
        if (!path) return null;
        // Handle both forward and backward slashes
        return path.split(/[/\\]/).pop();
    };

    const images = [image1, image2, image3]
        .map(getFilename)
        .filter(Boolean);

    const videoFile = getFilename(video);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        // Optional: Show a toast or temporary "Copied!" state
    };

    const handleDownloadAll = async () => {
        const filesToDownload = [...images, videoFile].filter(Boolean);

        for (const filename of filesToDownload) {
            try {
                const response = await fetch(`/files/${filename}`);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                // Small delay to prevent browser blocking
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
                console.error(`Failed to download ${filename}`, err);
            }
        }
    };

    return (
        <div className="results-container">
            <div className="results-header">
                <div className="text-group">
                    <h1>{title || 'Generated Content'}</h1>
                    <button onClick={() => handleCopy(title)} className="copy-btn" title="Copy Title">
                        📋
                    </button>
                </div>
                <div className="text-group">
                    <p>{description}</p>
                    <button onClick={() => handleCopy(description)} className="copy-btn" title="Copy Description">
                        📋
                    </button>
                </div>
            </div>

            <div className="actions-bar">
                <button onClick={handleDownloadAll} className="download-all-btn">
                    Download All Media 📥
                </button>
            </div>

            {videoFile && (
                <div className="video-section">
                    <div className="video-wrapper">
                        <video controls className="result-video">
                            <source src={`/files/${videoFile}`} />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </div>
            )}

            {images.length > 0 && (
                <div className="image-grid">
                    {images.map((img, index) => (
                        <div key={index} className="image-card">
                            <img src={`/files/${img}`} alt={`Generated ${index + 1}`} />
                        </div>
                    ))}
                </div>
            )}

            <button onClick={onReset} className="reset-btn">
                Create Another
            </button>
        </div>
    );
};

export default ResultsDisplay;
