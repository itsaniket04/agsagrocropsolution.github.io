# AGS Agro Solutions - Backend Deployment Guide

## 🚀 Complete Setup & Deployment Instructions

Follow these steps to deploy your website with a fully functional backend.

---

## Step 1: Install Dependencies

Open terminal in your project folder and run:

```bash
npm install
```

This installs all required packages: mongoose, bcryptjs, jsonwebtoken, dotenv, netlify-cli

---

## Step 2: Create MongoDB Atlas Database

### 2.1 Sign Up for MongoDB Atlas
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Click "Try Free" and create an account
3. Choose the **FREE** M0 cluster option

### 2.2 Create Database
1. After cluster creation, click "Browse Collections"
2. Click "Add My Own Data"
3. Database name: `ags-agro`
4. Collection name: `users` (other collections will be auto-created)

### 2.3 Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string (looks like `mongodb+srv://username:password@...`)
4. Replace `<password>` with your actual password

---

## Step 3: Create Environment File

1. Copy `.env.example` to `.env` in your project root:

```bash
copy .env.example .env
```

2. Edit `.env` file with your actual values:

```env
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/ags-agro?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-random-string-min-32-characters-long
ADMIN_EMAIL=admin@agsagro.com
```

**Generate a secure JWT_SECRET:**
- Windows: Use any 32+ character random string
- Example: `AGS_2024_Super_Secret_Key_For_JWT_Tokens_!@#`

---

## Step 4: Test Locally

Run the development server:

```bash
npm run dev
```

This starts Netlify Dev server at `http://localhost:8888`

### Test Authentication:
1. Open browser to `http://localhost:8888`
2. Open browser console (F12)
3. Test signup:
```javascript
api.signup('Test User', 'test@example.com', 'password123', '9876543210')
```

---

## Step 5: Deploy to Netlify

### 5.1 Create GitHub Repository
1. Go to [github.com](https://github.com)
2. Create new repository: `ags-agro-website`
3. Initialize git in your project folder:

```bash
git init
git add .
git commit -m "Initial commit with backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ags-agro-website.git
git push -u origin main
```

### 5.2 Connect to Netlify
1. Go to [app.netlify.com](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub and select your repository
4. Build settings:
   - Base directory: (leave empty)
   - Build command: (leave empty)
   - Publish directory: `.`
5. Click "Deploy site"

### 5.3 Configure Environment Variables
1. In Netlify dashboard, go to **Site settings** → **Environment variables**
2. Add these variables:

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | Your MongoDB connection string |
| `JWT_SECRET` | Your JWT secret key |
| `ADMIN_EMAIL` | admin@agsagro.com |

3. Click "Save"
4. Go to **Deploys** and click "Trigger deploy" → "Clear cache and deploy site"

---

## Step 6: Initial Product Setup

After deployment, you need to add products to the database.

### Option 1: Manual (MongoDB Atlas Dashboard)
1. Go to MongoDB Atlas → Collections
2. Select `products` collection
3. Click "Insert Document"
4. Add your 10 products manually

### Option 2: Import Script (Recommended)
Create a script to import your products. Contact me if you need help with this.

---

## Step 7: Create Admin Account

1. Sign up with email: `admin@agsagro.com` (from ADMIN_EMAIL env variable)
2. This user will automatically be assigned admin role
3. Use this account to access admin panel

---

## 🎉 Your Website is Live!

Your URL will be: `https://your-site-name.netlify.app`

### Test These Features:
✅ User signup/login
✅ Product viewing  
✅ Add to cart (requires login)
✅ Place order
✅ View order history
✅ Admin panel (admin user only)

---

## API Endpoints Available

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/auth-signup` | POST | No | Create new account |
| `/api/auth-login` | POST | No | User login |
| `/api/auth-verify` | GET | Yes | Verify token |
| `/api/products-get` | GET | No | Get all products |
| `/api/cart-add` | POST | Yes | Add to cart |
| `/api/cart-get` | GET | Yes | Get cart items |
| `/api/order-create` | POST | Yes | Create order |
| `/api/orders-get` | GET | Yes | Get user orders |

---

## Troubleshooting

### Error: "MongoDB connection failed"
- Check your MONGODB_URI in Netlify environment variables
- Ensure IP whitelist in MongoDB Atlas (allow all: `0.0.0.0/0`)

### Error: "Invalid token"
- Clear browser localStorage and login again
- Check JWT_SECRET is set in environment variables

### Functions not working
- Check Netlify Functions logs in dashboard
- Ensure `netlify.toml` is in project root
- Redeploy site after adding environment variables

---

## Next Steps

1. **Custom Domain**: Add your own domain in Netlify settings
2. **SSL**: Automatic HTTPS (enabled by default)
3. **Email Notifications**: Add email service for order confirmations
4. **Payment Gateway**: Integrate payment processor (Razorpay, PayPal)

---

## Support

Need help? Check:
- Netlify Functions logs: Site → Functions → View logs
- MongoDB logs: Atlas → Logs
- Browser console for frontend errors

Your backend is production-ready! 🚀
