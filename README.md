# Vibely — Social Media Platform

Vibely is a light-theme, responsive mini social network built with HTML, CSS, Vanilla JavaScript, Express, Node.js, and MongoDB Atlas.

## Features

- Registration, login, logout, password hashing, and server-side sessions
- MongoDB-backed profiles, posts, comments, likes, follows, and notifications
- Create text/image posts; edit/delete your own post text; delete your own comments
- Feed pagination, user discovery/search, profile pages, follower/following counts
- In-app follow/like/comment notifications and read status
- Responsive light UI, mobile navigation, toast messages, and subtle motion
- Image uploads up to 5 MB (JPG, PNG, WEBP, GIF) stored locally in `public/uploads`

## Requirements

- Node.js 18 or newer
- npm
- A MongoDB Atlas cluster and database user

## Run on Windows

1. Extract `Vibely_Social_Media_Platform.zip`.
2. Open the extracted `Vibely_Social_Media_Platform` folder in VS Code.
3. Open a terminal in that folder.
4. Install dependencies:

   ```powershell
   npm install
   ```

5. Copy `.env.example` to `.env`:

   ```powershell
   Copy-Item .env.example .env
   ```

6. In MongoDB Atlas:
   - Create a cluster if you do not already have one.
   - Create a database user and password.
   - In **Network Access**, allow your current IP address.
   - Select **Connect → Drivers**, choose Node.js, and copy the connection string.
   - Replace the placeholder in `MONGODB_URI` in `.env` with that connection string. URL-encode special characters in the database password.
   - Replace `SESSION_SECRET` with a long random secret.
   - Keep `.env` private; never upload it to GitHub.

7. Start the app:

   ```powershell
   npm run dev
   ```

8. Open `http://localhost:3000`.

The server will not start until `MONGODB_URI` is set and Atlas can be reached.

## Optional demo data

After configuring `.env`, run:

```powershell
npm run seed
```

Demo users (the same demo password applies to each):

- `maya.demo@example.com` / `VibelyDemo123!`
- `jordan.demo@example.com` / `VibelyDemo123!`
- `ava.demo@example.com` / `VibelyDemo123!`

The seed command is optional and inserts sample users/posts. These are public demo credentials: do not use them for real accounts or a public deployment. If you use the seed data, log in and change or remove those accounts before deploying.

## Useful commands

```powershell
npm run dev      # Development server with nodemon
npm start        # Standard server
npm run check    # Syntax checks for the core JavaScript files
npm run seed     # Insert sample data (requires Atlas configuration)
```

Health check: `GET http://localhost:3000/api/health`

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `GET /api/posts`, `POST /api/posts`, `GET /api/posts/:id`, `PUT /api/posts/:id`, `DELETE /api/posts/:id`
- `POST /api/posts/:id/like`, `DELETE /api/posts/:id/like`
- `GET /api/posts/:id/comments`, `POST /api/posts/:id/comments`, `DELETE /api/posts/comments/:commentId`
- `GET /api/users/search?q=...`, `GET /api/users/suggested`, `GET /api/users/:username`, `PUT /api/users/me`
- `POST /api/users/:id/follow`, `DELETE /api/users/:id/follow`
- `GET /api/users/:id/followers`, `GET /api/users/:id/following`
- `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`

All social routes require a logged-in session. Session cookies are HTTP-only and configured as secure in production.

## Project structure

```text
Vibely_Social_Media_Platform/
├── public/
│   ├── css/styles.css
│   ├── js/api.js
│   ├── js/app.js
│   ├── uploads/
│   └── index.html
├── scripts/seed.js
├── src/
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── models/{User,Post,Comment,Notification}.js
│   ├── routes/{auth,users,posts,notifications}.js
│   ├── utils/notify.js
│   └── app.js
├── server.js
├── package.json
└── .env.example
```

## Important limitations / next improvements

- This is a complete starter project, but it has not been penetration-tested or load-tested.
- Uploaded images are stored on the local server disk. For cloud deployment, use a persistent volume or integrate Cloudinary/S3; ephemeral hosts may delete local uploads.
- Profile avatar and cover images currently use image URLs. Post images use the local upload endpoint.
- Session storage uses MongoDB when `MONGODB_URI` is configured. The development-only fallback secret must be replaced before deployment.
- Add CSRF protection and stricter production security headers before exposing the app publicly.
- The app uses server-rendered API data and vanilla JS, with no frontend build step.
