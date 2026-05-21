# n8n Product Listing Generator

A Dockerized frontend for generating AI-powered product listings using a self-hosted n8n workflow.

## 🏗️ Architecture

* **Frontend**: React (Vite)
* **Backend**: Node.js (Express) — proxies requests to n8n and handles file uploads
* **Automation**: n8n (self-hosted, runs alongside the frontend in the same Compose project)
* **Storage**: A shared bind mount (`./n8n_files`) that both containers see at `/files`

```
.
├── docker-compose.yml      # both services + shared network + shared volume
├── frontend/               # React app + Express backend (single container)
├── n8n_files/              # runtime upload volume (contents gitignored)
├── n8n_workflow.json       # importable n8n workflow definition
└── README.md
```

## 🚀 Features

* Glassmorphism UI with dark mode
* Automatic HEIC → JPEG conversion (client-side via `heic2any`, server-side fallback via `heif-convert`)
* Direct file uploads to a shared volume (avoids n8n's binary-data limits)
* One-click download of all generated media

## 🛠️ Setup

### Prerequisites
* Docker & Docker Compose

### 1. Clone
```bash
git clone https://github.com/rkutyna/n8n-product_listing_generator.git
cd n8n-product_listing_generator
```

### 2. Start everything
```bash
docker compose up -d --build
```

Services:
* Frontend → http://localhost:3002
* n8n editor → http://localhost:5678

### 3. First-time n8n setup
1. Open http://localhost:5678 and create the owner account.
2. Import `n8n_workflow.json` (Workflows → Import from File).
3. Add credentials for **OpenAI** and **Google Gemini** in n8n's Credentials section.
4. **Activate** the workflow (toggle in the top-right of the editor). The Webhook node listens at `POST /webhook/form-submit`.

### 4. Use it
1. Open http://localhost:3002.
2. Fill in Title, Description, Branding Direction, upload a product image.
3. Click **Generate Magic** and wait for the workflow to complete.

## 🤖 Workflow notes

The Webhook node uses path `form-submit`. Inside the n8n container, uploaded files are at `/files/{{ $json.body.Image_Filename }}` (the bind mount maps `./n8n_files` on the host to `/files` in both containers).

The **Respond to Webhook** node should return:

```javascript
{{
  JSON.stringify({
    "description": $json.Description,
    "title":       $('Webhook').item.json.body.Title,
    "image1":      $('Read/Write Files from Disk').item.json.fileName,
    "image2":      $('Read/Write Files from Disk1').item.json.fileName,
    "image3":      $('Read/Write Files from Disk2').item.json.fileName,
    "video":       $('Read/Write Files from Disk3').item.json.fileName
  })
}}
```

## ⚙️ Configuration

Override defaults via environment variables on the `frontend` service in `docker-compose.yml`:

| Variable           | Default                                       | Description                                  |
| ------------------ | --------------------------------------------- | -------------------------------------------- |
| `PORT`             | `3002`                                        | Port the Express server listens on           |
| `UPLOAD_DIR`       | `/files`                                      | Where uploads are written inside the container |
| `N8N_WEBHOOK_URL`  | `http://n8n:5678/webhook/form-submit`         | n8n production webhook endpoint              |

## 📄 License
MIT
