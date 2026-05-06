# Social Media Full-Stack App

A complete social platform built with React + Redux Toolkit frontend and Express + MongoDB backend.

## Project Structur

- `client/` React application
- `server/` Express REST API
- `.env.example` Required environment variables

## Setup

1. Copy `.env.example` to `.env` in the **project root** (used by the Express server).
2. Copy `client/.env.example` to `client/.env` (Create React App only reads env files inside `client/`).
3. Install server dependencies:
   - `cd server && npm install`
4. Install client dependencies:
   - `cd ../client && npm install`
5. Start backend:
   - `cd ../server && npm run dev`
6. Start frontend:
   - `cd ../client && npm start`

## Environment Variables

**Root `.env` (server)**

- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `EMAIL_USER`
- `EMAIL_PASS`
- `CLIENT_URL` (e.g. `http://localhost:3000` — used for CORS and password-reset links)
- `PORT`

**`client/.env` (React)**

- `REACT_APP_API_URL` (e.g. `http://localhost:5000/api`)
- `REACT_APP_ASSET_URL` (e.g. `http://localhost:5000` for uploaded images)

## Frontend routes

- `/login`, `/register`, `/forgot-password`, `/reset-password`
- `/`, `/profile/:id`, `/profile/edit`, `/notifications`, `/messages`, `/search`

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Users
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `POST /api/users/:id/follow`
- `GET /api/users/search?q=`

### Posts
- `GET /api/posts`
- `GET /api/posts/user/:id`
- `POST /api/posts`
- `PUT /api/posts/:id`
- `DELETE /api/posts/:id`
- `POST /api/posts/:id/like`
- `POST /api/posts/:id/comment`
- `DELETE /api/posts/:id/comment/:cid`
- `GET /api/posts/search?q=`

### Notifications
- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`

### Messages
- `GET /api/conversations`
- `POST /api/conversations`
- `GET /api/conversations/:id/messages`
- `POST /api/conversations/:id/messages`
