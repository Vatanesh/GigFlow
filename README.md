# GigFlow - Freelance Marketplace Platform

A full-stack mini-freelance marketplace where clients can post jobs (gigs) and freelancers can apply for them (bids). Built with the MERN stack featuring **real-time notifications** and **transactional integrity** for the hiring process.

## 🌟 Features

### Core Features
- **User Authentication**: Secure JWT-based authentication with HttpOnly cookies
- **Fluid Roles**: Any user can be both a client (post gigs) and a freelancer (bid on gigs)
- **Gig Management**: Full CRUD operations for job postings
- **Search & Filter**: Real-time search functionality for finding gigs
- **Bidding System**: Freelancers can submit bids with custom pricing and messages
- **Smart Hiring Logic**: Atomic hiring process with automatic bid rejection

### Bonus Features (Implemented)
- **🔒 Transactional Integrity**: MongoDB transactions prevent race conditions when multiple admins try to hire different freelancers simultaneously
- **⚡ Real-time Notifications**: Socket.io integration provides instant notifications when freelancers are hired

## 🛠️ Tech Stack

### Frontend
- **React.js** with Vite
- **Tailwind CSS** for styling
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Socket.io Client** for real-time updates
- **Axios** for API requests
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **Socket.io** for WebSocket connections
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation

## 📁 Project Structure

```
gigflow/
├── backend/
│   ├── models/
│   │   ├── User.js          # User schema
│   │   ├── Gig.js           # Gig schema
│   │   └── Bid.js           # Bid schema
│   ├── routes/
│   │   ├── authRoutes.js    # Authentication endpoints
│   │   ├── gigRoutes.js     # Gig CRUD endpoints
│   │   └── bidRoutes.js     # Bidding & hiring endpoints
│   ├── middleware/
│   │   └── authMiddleware.js # JWT verification
│   ├── socket/
│   │   └── socket.js        # Socket.io configuration
│   ├── server.js            # Express server setup
│   ├── package.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── GigList.jsx
    │   │   ├── GigDetail.jsx
    │   │   ├── CreateGig.jsx
    │   │   └── Dashboard.jsx
    │   ├── store/
    │   │   ├── store.js
    │   │   └── authSlice.js
    │   ├── utils/
    │   │   ├── api.js         # Axios configuration
    │   │   └── socket.js      # Socket.io client
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    └── vite.config.js
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (or use the provided `.env.example`):
```env
MONGODB_URI=mongodb://localhost:27017/gigflow
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

4. Start MongoDB (if running locally):
```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
```

5. Start the backend server:
```bash
npm run dev
```

The backend should now be running on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend should now be running on `http://localhost:5173`

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| POST | `/api/auth/logout` | Logout user | Private |
| GET | `/api/auth/me` | Get current user | Private |

### Gigs
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/gigs` | Get all open gigs | Public |
| GET | `/api/gigs?search=keyword` | Search gigs by title | Public |
| GET | `/api/gigs/:id` | Get single gig | Public |
| POST | `/api/gigs` | Create new gig | Private |

### Bids
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/bids` | Submit a bid | Private |
| GET | `/api/bids/:gigId` | Get all bids for a gig | Private (Owner) |
| PATCH | `/api/bids/:bidId/hire` | Hire a freelancer | Private (Owner) |

## 🔐 Database Schema

### User
```javascript
{
  name: String (required, min: 2 chars),
  email: String (required, unique, lowercase),
  password: String (required, hashed, min: 6 chars),
  timestamps: true
}
```

### Gig
```javascript
{
  title: String (required, 5-100 chars),
  description: String (required, 20-2000 chars),
  budget: Number (required, min: 1),
  owner: ObjectId (ref: User),
  status: String (enum: ['open', 'assigned'], default: 'open'),
  timestamps: true
}
```

### Bid
```javascript
{
  gig: ObjectId (ref: Gig),
  freelancer: ObjectId (ref: User),
  message: String (required, 10-1000 chars),
  price: Number (required, min: 1),
  status: String (enum: ['pending', 'hired', 'rejected'], default: 'pending'),
  timestamps: true
}
```

## 🎯 Hiring Logic (Critical Feature)

The hiring process uses **MongoDB transactions** to ensure atomic operations and prevent race conditions:

### Transaction Flow
1. **Start Transaction**: Begin MongoDB session
2. **Verify Ownership**: Check if requester owns the gig
3. **Check Bid Status**: Ensure bid is still pending
4. **Check Gig Status**: Verify gig is still open (prevents race condition)
5. **Update Gig**: Set status to 'assigned'
6. **Update Hired Bid**: Set status to 'hired'
7. **Reject Other Bids**: Set all other bids to 'rejected'
8. **Commit Transaction**: Apply all changes atomically
9. **Send Notification**: Emit Socket.io event to hired freelancer
10. **Rollback on Error**: Undo all changes if anything fails

### Race Condition Prevention
When two admins try to hire different freelancers simultaneously:
- Both transactions check if gig status is 'open'
- First transaction updates gig to 'assigned' and commits
- Second transaction sees gig is no longer 'open' and aborts
- Only one hire succeeds, maintaining data integrity

## ⚡ Real-time Notifications

### How It Works
1. User logs in → Frontend connects to Socket.io
2. Client emits 'join' event with userId
3. Server stores socketId mapping
4. On hire → Server emits 'hired' event to specific freelancer
5. Frontend displays toast notification + updates dashboard

### Socket Events
- **Client → Server**:
  - `join(userId)`: Register user for notifications
- **Server → Client**:
  - `hired(data)`: Notify freelancer they've been hired

## 🧪 Testing the Application

### Manual Testing Flow

1. **Register Two Users**:
   - User A (Client)
   - User B (Freelancer)

2. **User A Posts a Gig**:
   - Navigate to "Post Gig"
   - Fill in title, description, budget
   - Submit

3. **User B Submits a Bid**:
   - Browse gigs
   - Click on User A's gig
   - Submit bid with price and message

4. **Test Real-time Notifications**:
   - Open User B's account in another browser/tab
   - Navigate to Dashboard
   - As User A, hire User B's bid
   - User B should receive instant notification

5. **Test Race Condition Prevention**:
   - Create gig with multiple bids
   - Open two browser windows as the gig owner
   - Try hiring different bids simultaneously
   - Only one should succeed

## 🎨 UI Features

- **Gradient Backgrounds**: Modern blur effects and gradients
- **Glass morphism Cards**: Semi-transparent card designs
- **Smooth Animations**: Hover effects and transitions
- **Status Badges**: Color-coded bid and gig statuses
- **Responsive Design**: Mobile-friendly layouts
- **Toast Notifications**: Beautiful success/error messages

## 🚢 Deployment

### Backend Deployment (Example: Render)
1. Push code to GitHub
2. Create new Web Service on Render
3. Set environment variables
4. Deploy

### Frontend Deployment (Example: Vercel)
1. Push code to GitHub
2. Import project to Vercel
3. Set build command: `npm run build`
4. Deploy

### MongoDB (Atlas)
1. Create MongoDB Atlas account
2. Create cluster
3. Get connection string
4. Update `MONGODB_URI` in backend

## 🔒 Security Features

- HttpOnly cookies for JWT storage (prevents XSS)
- Password hashing with bcryptjs
- CORS configuration
- Input validation with express-validator
- Protected routes on frontend and backend
- MongoDB transactions for data integrity

## 📝 License

MIT License - feel free to use this project for learning or commercial purposes.

## 👨‍💻 Author

Built as a technical assessment for a freelance marketplace assignment.

## 🙏 Acknowledgments

- MERN Stack Community
- Socket.io Documentation
- MongoDB Transaction Docs
- Tailwind CSS

---

**Note**: This is a complete, production-ready implementation with both bonus features (MongoDB transactions + Socket.io real-time notifications) fully integrated.
