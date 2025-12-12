# AGS Agro Crop - Authentication & Shopping Cart System

A production-ready full-stack e-commerce authentication and shopping cart system built with Node.js, Express, MongoDB, and vanilla JavaScript.

## 🌱 Features

### Authentication
- ✅ User signup with email verification
- ✅ Secure login with JWT (access + refresh tokens)
- ✅ HTTP-only secure cookies for refresh tokens
- ✅ Password reset via email
- ✅ Rate limiting on auth endpoints
- ✅ Bcrypt password hashing (12 rounds)

### Shopping Cart
- ✅ Guest cart stored in localStorage
- ✅ Authenticated cart stored in MongoDB
- ✅ Automatic cart merging on login
- ✅ Add/update/remove items
- ✅ Stock validation
- ✅ Variant support (sizes)

### Security
- ✅ JWT with token rotation
- ✅ CSRF protection (SameSite cookies)
- ✅ XSS prevention (input sanitization)
- ✅ Rate limiting (express-rate-limit)
- ✅ Helmet security headers
- ✅ Secure password requirements

## 📦 Tech Stack

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Bcrypt password hashing
- Nodemailer (email)

**Frontend:**
- Vanilla HTML/CSS/JavaScript
- Mobile-responsive design
- LocalStorage for guest cart

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB 5+ (local or Atlas)

### Installation

1. **Clone and navigate:**
```bash
cd "c:/Users/anike/OneDrive/Desktop/AGRO CROP"
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
# Copy example env file
cp .env.example .env

# Edit .env and update:
# - MONGODB_URI (your MongoDB connection string)
# - JWT_ACCESS_SECRET (change to random string)
# - JWT_REFRESH_SECRET (change to random string)
```

4. **Seed database with test accounts:**
```bash
npm run seed
```

5. **Start the server:**
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

6. **Access the application:**
```
http://localhost:5000
```

## 🧪 Test Accounts

After running `npm run seed`, you'll have these test accounts:

| Email | Password |
|-------|----------|
| john@test.com | Password123 |
| sarah@test.com | Password123 |
| test@test.com | Test1234 |

## 📚 API Endpoints

### Authentication

#### POST /api/auth/signup
Register new user
```json
Request:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response (201):
{
  "message": "Signup successful. Please verify your email.",
  "userId": "64abc..."
}
```

#### GET /api/auth/verify-email?token=xxx
Verify email address

#### POST /api/auth/login
Login user
```json
Request:
{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response (200):
{
  "user": { "id": "64abc...", "name": "John Doe", "email": "..." },
  "accessToken": "eyJhbG..."
}
```

#### POST /api/auth/refresh
Refresh access token (requires refresh token cookie)

#### POST /api/auth/logout
Logout and revoke refresh token

#### POST /api/auth/forgot-password
Request password reset
```json
Request:
{
  "email": "john@example.com"
}
```

#### POST /api/auth/reset-password
Reset password with token
```json
Request:
{
  "token": "abc123...",
  "newPassword": "NewSecurePass456"
}
```

### Shopping Cart

#### GET /api/cart
Get user's cart (requires auth)

#### POST /api/cart
Add item to cart
```json
Request:
{
  "productId": "prod1",
  "variant": "5kg",
  "quantity": 2
}
```

#### PUT /api/cart/:itemId
Update item quantity
```json
Request:
{
  "quantity": 3
}
```

#### DELETE /api/cart/:itemId
Remove item from cart

#### POST /api/cart/merge
Merge guest cart on login
```json
Request:
{
  "guestCart": [
    { "productId": "prod1", "variant": "5kg", "quantity": 1 }
  ]
}
```

### User Profile

#### GET /api/user/profile
Get user profile (requires auth)

## 🧪 Manual Testing Instructions

### 1. Signup → Verify → Login Flow

1. Navigate to http://localhost:5000/signup.html
2. Create account with:
   - Name: Test User
   - Email: newuser@test.com
   - Password: TestPass123
3. Check console output or `dev-emails.log` for verification link
4. Copy verification link and open in browser
5. You should see "Email Verified Successfully"
6. Login at http://localhost:5000/login.html with your credentials
7. You should be redirected to products page

### 2. Password Reset Flow

1. Go to http://localhost:5000/forgot-password.html
2. Enter email: john@test.com
3. Check `dev-emails.log` for reset link
4. Open reset link
5. Set new password (e.g., NewPass123)
6. Login with new password

### 3. Guest Cart → Login → Merge

1. **Without logging in**, go to http://localhost:5000/products.html
2. Add 2 different products to cart
3. View cart - you should see items from localStorage
4. Now login with: test@test.com / Test1234
5. After login, check cart - guest items should be merged with server cart
6. Verify cart persists after page refresh

### 4. Error Handling

1. Try adding product with quantity > 999 → Should get error
2. Try logging in 6 times with wrong password → Should get rate limited (429)
3. Try signup with invalid email → Should get validation error
4. Try weak password (< 8 chars) → Should get validation error

### 5. Mobile Responsiveness

1. Open DevTools and set viewport to mobile (375px width)
2. Navigate through signup, login, products, cart pages
3. Verify all elements are responsive and functional

## 📁 Project Structure

```
AGRO CROP/
├── server/                 # Backend
│   ├── config/            # Configuration files
│   │   ├── db.js         # MongoDB connection
│   │   ├── env.js        # Environment variables
│   │   └── security.js   # Security settings
│   ├── models/           # Mongoose models
│   │   ├── User.js
│   │   ├── Cart.js
│   │   └── RefreshToken.js
│   ├── controllers/      # Business logic
│   │   ├── auth.controller.js
│   │   └── cart.controller.js
│   ├── routes/           # API routes
│   │   ├── auth.routes.js
│   │   ├── cart.routes.js
│   │   └── user.routes.js
│   ├── middleware/       # Express middleware
│   │   ├── auth.js
│   │   ├── rateLimit.js
│   │   └── errorHandler.js
│   ├── services/         # External services
│   │   ├── email.service.js
│   │   └── token.service.js
│   ├── utils/            # Utilities
│   │   └── validators.js
│   ├── seed.js           # Database seeder
│   └── server.js         # Main entry point
├── client/               # Frontend
│   ├── css/
│   │   └── main.css
│   ├── js/
│   │   ├── api.js        # API client
│   │   ├── storage.js    # localStorage wrapper
│   │   ├── validation.js # Form validation
│   │   └── ui.js         # UI helpers
│   ├── index.html        # Landing page
│   ├── signup.html
│   ├── login.html
│   ├── verify-email.html
│   ├── forgot-password.html
│   ├── reset-password.html
│   ├── products.html
│   ├── cart.html
│   └── profile.html
├── docs/                 # Documentation
│   └── POSTMAN.json      # Postman collection
├── .env.example          # Environment template
├── .gitignore
├── package.json
└── README.md
```

**Total Files: ~55** (well under 100-file limit)

## 🌐 Deployment

### Deploy to Railway/Render/Heroku

1. **Set environment variables:**
   - `MONGODB_URI` - MongoDB Atlas connection string
   - `JWT_ACCESS_SECRET` - Random secure string
   - `JWT_REFRESH_SECRET` - Random secure string
   - `NODE_ENV=production`

2. **Configure SMTP (optional for production emails):**
   - `SMTP_HOST` - SMTP server
   - `SMTP_USER` - Email username
   - `SMTP_PASS` - Email password

3. **Deploy:**
```bash
git init
git add .
git commit -m "Initial commit"

# For Railway
railway up

# For Render
# Connect GitHub repo in Render dashboard

# For Heroku
heroku create
git push heroku main
```

## 📧 Email Configuration

### Development Mode (Default)
Emails are logged to:
- Console output
- `dev-emails.log` file

### Production Mode
Set these environment variables:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

For Gmail, use [App Passwords](https://support.google.com/accounts/answer/185833).

## ✅ Acceptance Criteria Checklist

- [x] **Signup** - Email validation, password strength, bcrypt hashing
- [x] **Email Verification** - Tokenized link, 24h expiry
- [x] **Login** - Verified email check, rate limiting, JWT tokens
- [x] **Refresh Token** - Rotation, HTTP-only cookies
- [x] **Logout** - Token revocation
- [x] **Forgot Password** - 1-hour token, email link
- [x] **Reset Password** - Token validation, new password hash
- [x] **Protected Routes** - JWT middleware, user profile
- [x] **Guest Cart** - localStorage persistence
- [x] **Add to Cart** - Stock validation, variant support
- [x] **Cart Merge** - Dedupe by product+variant, sum quantities
- [x] **Security** - CSRF, XSS, rate limiting, HTTPS-ready
- [x] **File Limit** - Under 100 files
- [x] **API Docs** - Request/response examples
- [x] **Mobile Responsive** - Works on 375px+ screens

## 🛠️ Development

```bash
# Run in development mode (auto-reload)
npm run dev

# Seed database
npm run seed

# Run in production mode
npm start
```

## 📝 Notes

- Passwords must be 8+ characters with letters and numbers
- Email verification links expire in 24 hours
- Password reset links expire in 1 hour
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Rate limiting: 5 login attempts per 15 minutes
- Max cart quantity per item: 999

## 🐛 Troubleshooting

**MongoDB Connection Failed:**
- Ensure MongoDB is running locally, or
- Use MongoDB Atlas and update `MONGODB_URI` in `.env`

**Emails Not Sending:**
- Check `dev-emails.log` file in dev mode
- Verify SMTP credentials in production

**Token Refresh Fails:**
- Clear browser cookies
- Login again

## 📄 License

MIT License - See package.json

## 👨‍💻 Author

AGS Agro Crop Solutions

---

**Ready for Production** ✅
