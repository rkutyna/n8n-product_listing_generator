import React, { useState } from 'react';
import { processImageFile } from '../utils/imageConversion';

const WorkflowForm = ({ onSubmit, isLoading }) => {
    const [formData, setFormData] = useState({
        Title: '',
        Description: '',
        Branding_Direction: '',
        Product_Image: null
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Use our utility to convert HEIC or other formats to JPEG
                const processedFile = await processImageFile(file);

                // Create object URL for preview
                setFormData(prev => ({
                    ...prev,
                    Product_Image: URL.createObjectURL(processedFile),
                    _rawFile: processedFile // Store the actual file object for submission
                }));
            } catch (error) {
                console.error("Image processing failed:", error);
                alert("Failed to process image. Please try another file.");
            }
        } else {
            setFormData(prev => ({
                ...prev,
                Product_Image: null,
                _rawFile: null
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Create FormData object for file upload
        const data = new FormData();
        data.append('Title', formData.Title);
        data.append('Description', formData.Description);
        data.append('Branding_Direction', formData.Branding_Direction);

        // Only append file if selected
        if (formData._rawFile) {
            data.append('Product_Image', formData._rawFile);
        }

        onSubmit(data);
    };

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit} className="workflow-form">

                <div className="form-group">
                    <label htmlFor="Title">Title</label>
                    <input
                        type="text"
                        id="Title"
                        name="Title"
                        value={formData.Title}
                        onChange={handleChange}
                        placeholder="e.g., Summer Campaign Launch"
                        required
                        disabled={isLoading}
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="Description">Description</label>
                    <textarea
                        id="Description"
                        name="Description"
                        value={formData.Description}
                        onChange={handleChange}
                        placeholder="Describe the content..."
                        rows={3}
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="Branding_Direction">Branding Direction</label>
                    <textarea
                        id="Branding_Direction"
                        name="Branding_Direction"
                        value={formData.Branding_Direction}
                        onChange={handleChange}
                        placeholder="e.g., Minimalist, Vibrant, Professional..."
                        rows={2}
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="Product_Image">Product Image</label>
                    <div className="file-upload-wrapper">
                        <input
                            type="file"
                            id="Product_Image"
                            name="Product_Image"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={isLoading}
                            className="file-input"
                        />
                        <div className="file-upload-preview">
                            {formData.Product_Image ? (
                                <img src={formData.Product_Image} alt="Preview" className="preview-img" />
                            ) : (
                                <span className="upload-placeholder">Click to upload an image</span>
                            )}
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={isLoading || !formData.Title} className="submit-btn">
                    {isLoading ? (
                        <span className="loading-text">Generating...</span>
                    ) : (
                        <span>Generate Magic</span>
                    )}
                </button>
            </form>
        </div>
    );
};

export default WorkflowForm;
