# 🎨 ArtFolio — Digital Art Portfolio & Gallery Backend


A complete, production-ready backend for **ArtFolio** — a digital art portfolio and gallery platform. ArtFolio enables artists to showcase their creations, manage custom commission requests, simulate print sales with earnings analytics, and interact with visitors through comments and likes with real-time Socket.io notifications.

---

## 📌 Features

- **🔐 Dual Authentication & RBAC**: JWT-based authentication with optional Firebase Auth ID token verification. Role-Based Access Control (`artist`, `visitor`, `admin`).
- **🎨 Artwork Management**: Multipart image uploads directly to Firebase Storage with automatic download URL generation, tag filtering, category discovery, and cascade deletion.
- **👤 Artist Profiles**: Public artist portfolios showcasing verified creations, biographies, and tags.
- **💬 Comments & ❤️ Likes**: Interactive social layer with duplicate prevention and live counter updates.
- **🖌️ Custom Commissions**: Client-to-artist commission request pipeline with status updates (`pending`, `accepted`, `declined`, `completed`).
- **💰 Simulated Print Sales & Analytics**: Record print or original artwork sales with artist earnings dashboards (total revenue, this-month revenue, sales volume).
- **🛡️ Admin Moderation**: Curate gallery content with approval workflows (`pending`, `approved`, `rejected`, `featured`).
- **🔔 Real-Time Notifications**: Instant alert dispatch via Socket.io for comments, likes, commissions, and sales.
- **📚 Interactive API Documentation**: Swagger UI documentation at `/api-docs` and ready-to-import Postman collection.

---

## 🏗️ Architecture & Project Structure

```
artfolio-backend/
├── config/
│   ├── db.js                     # MongoDB connection via Mongoose
│   └── firebase.js               # Firebase Admin SDK (Storage bucket & Auth)
├── models/
│   ├── Artist.js                 # Users collection (artists, visitors, admins)
│   ├── Artwork.js                # Artworks with tags, image URLs, and metrics
│   ├── Comment.js                # Artwork comments
│   ├── Like.js                   # Compound unique index on (artwork, user)
│   ├── Commission.js             # Client commission requests
│   ├── Sale.js                   # E-commerce print sales records
│   └── Notification.js           # Persistent alerts
├── controllers/
│   ├── authController.js         # Register, login, profile retrieval
│   ├── artworkController.js      # CRUD operations + Firebase upload
│   ├── artistController.js       # Directory and portfolio view
│   ├── commentController.js      # Comments logic + notifications
│   ├── likeController.js         # Likes logic + notifications
│   ├── commissionController.js   # Commission workflows
│   ├── saleController.js         # Simulated sales and revenue aggregation
│   ├── adminController.js        # Gallery moderation
│   └── notificationController.js # Notification dispatch & history
├── middleware/
│   ├── auth.js                   # JWT & Firebase ID token validation
│   ├── checkRole.js              # Role-based route guard
│   ├── uploadMiddleware.js       # Multer memory storage & 5MB image filter
│   ├── validate.js               # express-validator result handler
│   └── errorHandler.js           # Centralized JSON error response handler
├── routes/
│   ├── authRoutes.js
│   ├── artworkRoutes.js
│   ├── artistRoutes.js
│   ├── commentRoutes.js
│   ├── likeRoutes.js
│   ├── commissionRoutes.js
│   ├── saleRoutes.js
│   ├── adminRoutes.js
│   └── notificationRoutes.js
├── sockets/
│   └── notificationSocket.js     # Socket.io JWT authentication & live push
├── docs/
│   └── postman_collection.json   # Postman collection (v2.1)
├── .env.example
├── .gitignore
├── package.json
├── server.js                     # Main application entry point
└── README.md
```

---

## ⚙️ Installation & Local Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (Local installation or free MongoDB Atlas cluster)
- [Firebase Project](https://console.firebase.google.com/) with Storage enabled

### 2. Clone and Install Dependencies
```bash
cd Desktop/artfolio-backend
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Populate the `.env` values:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/artfolio
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

### 4. Firebase Setup
The backend supports two credential loading modes:
- **Local Development**: Place your Firebase service account JSON key file at the project root as `./serviceAccountKey.json`.
- **Production (Render / Cloud)**: Set the `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable with the raw string contents of your service account key file.

> **Storage Bucket Public Access Note**: ArtFolio calls `file.makePublic()` and returns the public Google Cloud Storage URL `https://storage.googleapis.com/<bucket>/<path>`. If uniform bucket-level access is enabled on GCP, the helper automatically generates a long-lived signed URL fallback.

### 5. Run the Server
- **Development (with hot reload)**:
  ```bash
  npm run dev
  ```
- **Production**:
  ```bash
  npm start
  ```

---

## 📋 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user (`artist` or `visitor`). Returns JWT. |
| `POST` | `/api/auth/login` | Public | Authenticate user credentials and return JWT. |
| `GET` | `/api/auth/me` | Protected | Retrieve the authenticated user's profile. |

### 🎨 Artworks (`/api/artworks`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/artworks` | Public | Browse approved/featured artworks (`?tag=`, `?artist=`, `?category=`, `?status=` [admin]). |
| `GET` | `/api/artworks/:id` | Public | View artwork details with populated artist info and metrics. |
| `POST` | `/api/artworks` | Artist | Upload new artwork with image file (multipart/form-data). Sets status to `pending`. |
| `PUT` | `/api/artworks/:id` | Owner | Update artwork metadata or replace image. |
| `DELETE` | `/api/artworks/:id` | Owner / Admin | Delete artwork and cascade-delete its comments and likes. |

### 👤 Artists (`/api/artists`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/artists` | Public | List all registered artists (`?tag=`, `?search=`). |
| `GET` | `/api/artists/:id` | Public | Artist profile with their approved & featured artworks. |
| `PUT` | `/api/artists/:id` | Owner | Update artist bio, avatar URL, and portfolio tags. |

### 💬 Comments (`/api/comments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/comments` | Protected | Add a comment to an artwork. Increments count and dispatches notification. |
| `GET` | `/api/comments` | Public / Admin | List all platform comments (paginated). |
| `GET` | `/api/comments/artwork/:id` | Public | Get all comments for a specific artwork. |

### ❤️ Likes (`/api/likes`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/likes` | Protected | Like an artwork (prevents duplicate likes; sends real-time alert). |
| `GET` | `/api/likes` | Public | List likes (`?artworkId=`, `?userId=`). |
| `DELETE` | `/api/likes/:id` | Owner | Unlike an artwork and decrement like counter. |

### 🖌️ Commissions (`/api/commissions`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/commissions` | Protected | Send custom commission request (`artistId`, `description`, `budget`). |
| `GET` | `/api/commissions` | Protected | List user's commission requests (or all if admin). |
| `GET` | `/api/commissions/artist/:id` | Artist / Admin | List commissions received by a specific artist. |
| `PUT` | `/api/commissions/:id/status` | Artist / Admin | Update status (`pending`, `accepted`, `declined`, `completed`). |

### 💰 Sales & Earnings (`/api/sales`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/sales` | Artist / Admin | Record print or original sale. Dispatches notification to artist. |
| `GET` | `/api/sales` | Admin | List all sales across the platform. |
| `GET` | `/api/sales/artist/:id` | Artist / Admin | Artist earnings dashboard: total revenue, this-month revenue, sales list. |

### 🛡️ Admin Moderation (`/api/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/artworks` | Admin | List all artworks across all statuses (`?status=pending`). |
| `PUT` | `/api/admin/moderate/:id` | Admin | Approve, reject, or feature an artwork (`status: approved|rejected|featured`). |

### 🔔 Notifications (`/api/notifications`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/notifications/send` | Protected | Create and emit notification manually (testing/admin). |
| `GET` | `/api/notifications/my` | Protected | Retrieve notifications for current user with unread count. |
| `PUT` | `/api/notifications/:id/read` | Protected | Mark a single notification as read. |
| `PUT` | `/api/notifications/mark-all-read` | Protected | Mark all user notifications as read. |

---

## ⚡ Real-Time Socket.io Notification Flow

1. **Client Connection & Identification**:
   - Client connects to Socket.io at server root URL.
   - Client emits `identify` with payload `{ token: "<JWT_TOKEN>" }`.
   - The server verifies the token and maps `socket.id` to `userId`.
2. **Triggering Events**:
   - **New Comment**: Visitors comment on an artwork $\rightarrow$ Server stores `Notification` $\rightarrow$ emits `notification:new` to the artist's socket.
   - **New Like**: Visitors like an artwork $\rightarrow$ Server stores `Notification` $\rightarrow$ emits `notification:new` to the artist's socket.
   - **New Commission**: Requester sends commission $\rightarrow$ Server stores `Notification` $\rightarrow$ emits `notification:new` to the commissioned artist.
   - **Sale Recorded**: E-commerce sale registered $\rightarrow$ Server stores `Notification` $\rightarrow$ emits `notification:new` to the artist.

---

## 🔁 Example User Flow (From Case Study)

1. **Upload**: An artist registers and uploads `"Sunset Dreams"` with tags `[nature, landscape]` via `POST /api/artworks`.
2. **Browse & Social**: A visitor discovers `"Sunset Dreams"` via `GET /api/artworks?tag=landscape`, comments *"Stunning colors!"* via `POST /api/comments`, and likes it via `POST /api/likes`. The artist receives instant notifications.
3. **Commission Request**: A visitor requests a custom artwork: *"Similar style for my living room"* with a budget of ₹15,000 via `POST /api/commissions`.
4. **Curation & Moderation**: An admin reviews the artwork and promotes it to curated discovery via `PUT /api/admin/moderate/:id` with `{ status: "featured" }`.
5. **Print Sale**: A buyer purchases a print for ₹5,000 via `POST /api/sales`.
6. **Artist Dashboard**: The artist checks `GET /api/sales/artist/:id` to inspect monthly earnings (e.g. ₹25,000) and pending commissions.

---

## 🚀 Deployment on Render

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: complete ArtFolio backend implementation"
   git branch -M main
   git remote add origin https://github.com/<your-username>/artfolio-backend.git
   git push -u origin main
   ```
2. **Create Web Service on Render**:
   - Sign in at [render.com](https://render.com/) and click **New + -> Web Service**.
   - Connect your `artfolio-backend` GitHub repository.
   - Set **Build Command**: `npm install`.
   - Set **Start Command**: `npm start`.
3. **Configure Environment Variables**:
   - `MONGO_URI`: Your MongoDB Atlas URI.
   - `JWT_SECRET`: Random 64-character secret key.
   - `FIREBASE_STORAGE_BUCKET`: Your Firebase Storage bucket name (e.g. `artfolio-backend.appspot.com`).
   - `FIREBASE_SERVICE_ACCOUNT_JSON`: Full JSON contents of your downloaded Firebase service account key.
4. **Deploy & Verify**:
   - Access live Swagger documentation at `https://<your-render-subdomain>.onrender.com/api-docs`.

---

## 📄 License
This project is open-source under the MIT License.
