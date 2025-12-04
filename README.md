# ✨ n8n Product Listing Generator

A powerful, Dockerized frontend for generating AI-powered product listings using n8n workflows.

## How to Use:
1. Clone the repository to a local machine
2. In the n8n directory, run "Docker compose up -d" to start the n8n instance. It should be accessible on http://localhost:5678
3. Within the n8n_files/n8n-frontend/ directory, run "Docker compose up -d" to start the front end. This Should be accessible on http://localhost:3002
4. You will need to sign into n8n and link both openAI and Google Gemini API keys in order to run the n8n workflow.
5. Once signed in, simply go to the frontend page, fill in the information, and wait for the workflow to complete.

## 🚀 Features

*   **Premium UI**: Glassmorphism design with smooth animations and dark mode.
*   **Robust File Handling**:
    *   **Automatic HEIC Conversion**: Automatically converts iPhone photos to JPEG on the client side.
    *   **Direct File Uploads**: Bypasses n8n's binary data limits by uploading directly to a shared volume.
*   **Synchronous Architecture**: Simple and reliable request/response flow.
*   **Results Display**:
    *   Displays generated Title, Description, Images, and Video.
    *   **Download All**: One-click download for all generated media.
    *   **Copy Buttons**: Quick copy for text content.

## 🏗️ Architecture

*   **Frontend**: React (Vite)
*   **Backend**: Node.js (Express) - Proxies requests to n8n and handles file uploads.
*   **Automation**: n8n (Self-hosted)
*   **Storage**: Shared Docker volume for persisting images and videos.

## 🛠️ Setup & Installation

### Prerequisites
*   Docker & Docker Compose
*   n8n running on the same host (port 5678)

### 1. Clone the Repository
```bash
git clone https://github.com/rkutyna/n8n-product_listing_generator.git
cd n8n-product_listing_generator
```

### 2. Configure Docker Compose
Ensure your `docker-compose.yml` mounts the same volume that n8n uses for file storage.
```yaml
volumes:
  - /home/rkadmin/n8n_files:/usr/share/nginx/html/files
```

### 3. Run the Application
```bash
docker-compose up -d --build
```
The app will be available at `http://localhost:3002` (or your mini PC's IP).

## 🤖 n8n Workflow Configuration

Your n8n workflow should be set up as follows:

1.  **Webhook Node**:
    *   Method: `POST`
    *   Path: `submit-form`
2.  **Processing**:
    *   Use the `Image_Filename` from the input to read the file from disk: `/home/rkadmin/n8n_files/{{ $json.Image_Filename }}`.
3.  **Response**:
    *   Use a **Respond to Webhook** node.
    *   **Response Body**: Use an Expression to return the following JSON structure:

```javascript
{{
  JSON.stringify({
    "description": $json.Description,
    "title": $('Webhook').item.json.body.Title,
    "image1": $('Read/Write Files from Disk').item.json.fileName,
    "image2": $('Read/Write Files from Disk1').item.json.fileName,
    "image3": $('Read/Write Files from Disk2').item.json.fileName,
    "video": $('Read/Write Files from Disk3').item.json.fileName
  })
}}
```

## 📝 Usage

1.  Enter a **Title** and **Description**.
2.  Upload a **Product Image** (supports JPG, PNG, HEIC).
3.  Click **Generate Magic**.
4.  Wait for the AI to generate your listing.
5.  View, Copy, or Download the results!

## 📄 License
MIT
