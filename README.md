# MERN Literary Works Reader

A full-stack web application for writers to store, display, and share their literary works. Built with the MERN stack (MongoDB, Express, React, Node.js) featuring an advanced reader interface, admin content management, and real-time user engagement.

## Features

### 🚀 Core Features
- **Digital Library**: Browse and discover literary works
- **Advanced Reader**: Immersive reading experience with customization options
- **Admin Dashboard**: Content management system for writers
- **Real-time Comments**: Live discussion system with Socket.IO
- **User Suggestions**: Feedback system for readers

### 📖 Reader Features
- **Font Customization**: Adjustable font size and family (including dyslexic-friendly fonts)
- **Text-to-Speech**: Built-in TTS with speed control
- **Navigation**: Seamless chapter-to-chapter navigation
- **Responsive Design**: Optimized for all devices

### 🔐 Admin Features
- **JWT Authentication**: Secure admin access
- **Content Management**: Create, update, and delete works
- **Analytics Dashboard**: View likes, comments, and suggestions
- **Real-time Monitoring**: Track user engagement

### 💬 Social Features
- **Live Comments**: Real-time commenting on chapters and lore
- **Suggestion System**: Readers can submit feedback
- **Like System**: Engagement tracking

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO
- **Authentication**: JWT with bcrypt
- **Styling**: CSS3 with responsive design

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- MongoDB (local or cloud)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MERN-xdu-reader
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../client
   npm install
   npm start
   ```

4. **Create Admin User**
   ```bash
   # POST to http://localhost:5000/api/auth/register
   # with username and password
   ```

### Environment Variables

**Server (.env)**
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/literary-works
JWT_SECRET=your-super-secret-jwt-key
CLIENT_URL=http://localhost:3000
```

**Client (.env)**
```
REACT_APP_API_URL=http://localhost:5000
```

## Project Structure

```
MERN-xdu-reader/
├── server/                 # Backend API
│   ├── config/            # Database configuration
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Authentication middleware
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   └── server.js         # Entry point
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── context/      # React context (auth)
│   │   ├── services/     # API services
│   │   ├── types/        # TypeScript types
│   │   └── App.tsx       # Main app component
│   └── public/           # Static assets
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/register` - Register admin (first time setup)

### Works (Books/Stories)
- `GET /api/works` - Get all works (public)
- `GET /api/works/:id` - Get single work with chapters (public)
- `POST /api/works` - Create work (admin)
- `PUT /api/works/:id` - Update work (admin)
- `DELETE /api/works/:id` - Delete work (admin)
- `POST /api/works/:id/like` - Like a work (public)

### Chapters
- `GET /api/chapters/:id` - Get chapter content (public)
- `POST /api/chapters` - Create chapter (admin)
- `PUT /api/chapters/:id` - Update chapter (admin)
- `DELETE /api/chapters/:id` - Delete chapter (admin)
- `POST /api/chapters/:id/like` - Like a chapter (public)

### Comments
- `GET /api/comments/:contentId` - Get comments for content (public)
- `POST /api/comments` - Create comment (public)
- `DELETE /api/comments/:id` - Delete comment (admin)

### Suggestions
- `GET /api/suggestions` - Get all suggestions (admin)
- `POST /api/suggestions` - Submit suggestion (public)
- `DELETE /api/suggestions/:id` - Delete suggestion (admin)

## Development

### Available Scripts

**Backend**
- `npm start` - Run production server
- `npm run dev` - Run development server with nodemon

**Frontend**
- `npm start` - Run development server
- `npm run build` - Build for production
- `npm test` - Run tests

### Data Models

**Work**
- title, synopsis, coverImage, category, likes, chapters[]

**Chapter**
- title, content, work, chapterNumber, likes

**Lore**
- title, content, category, likes

**Comment**
- authorName, content, parentContent, parentType

**Suggestion**
- content, authorName, email, timestamp

**User**
- username, password (hashed)

## Deployment

1. **Build the frontend**
   ```bash
   cd client && npm run build
   ```

2. **Deploy backend** to your preferred hosting service
3. **Configure environment variables** for production
4. **Set up MongoDB** (MongoDB Atlas recommended)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.