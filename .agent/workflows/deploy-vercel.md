---
description: Deploy FoodEase to Vercel
---

# Vercel Deployment Workflow

This workflow guides you through deploying the FoodEase project to Vercel.

## Prerequisites

1. Create accounts:
   - Vercel account (vercel.com)
   - GitHub account
   - Database hosting (PlanetScale or Railway recommended)

## Step 1: Set Up Database

### Using PlanetScale (Recommended)
1. Go to https://planetscale.com and sign up
2. Create new database named `foodease`
3. Import SQL files in order:
   ```bash
   cd database
   # Import: 01_tables_minimal.sql
   # Import: 02_triggers_minimal.sql
   # Import: 03_procedures_streamlined.sql
   # Import: 04_views_indexes_minimal.sql
   # Import: 05_sample_data_minimal.sql
   ```
4. Save connection credentials

### Using Railway
1. Go to https://railway.app and sign up
2. Click "New Project" → "Provision MySQL"
3. Connect and import SQL files
4. Save connection credentials

## Step 2: Push to GitHub

// turbo
```bash
cd "/home/hamza/All Data To Transfer/VIF/Materials/Fourth Year/1st term/Web Programming/Project/Project v2/FoodEase_Project_2025"
./prepare-deployment.sh
```

Then manually:
1. Create new repository on GitHub
2. Push code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/foodease.git
   git push -u origin main
   ```

## Step 3: Deploy Backend to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: (leave empty)
   - **Install Command**: `npm install`
5. Add environment variables:
   ```
   NODE_ENV=production
   DB_HOST=<from step 1>
   DB_USER=<from step 1>
   DB_PASSWORD=<from step 1>
   DB_NAME=foodease
   JWT_SECRET=<generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
   FRONTEND_URL=<will update after frontend deployed>
   ```
6. Click "Deploy"
7. Copy your backend URL (e.g., https://foodease-backend.vercel.app)

## Step 4: Deploy Frontend to Vercel

1. Go to Vercel dashboard
2. Click "Add New" → "Project"
3. Import same GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variable:
   ```
   VITE_API_URL=<your-backend-url-from-step-3>/api/v1
   ```
6. Click "Deploy"
7. Copy your frontend URL (e.g., https://foodease.vercel.app)

## Step 5: Update Backend CORS

1. Go to backend Vercel project settings
2. Update environment variable `FRONTEND_URL` with actual frontend URL from Step 4
3. Go to "Deployments" tab
4. Click "..." on latest deployment → "Redeploy"

## Step 6: Test Deployment

Visit your frontend URL and test:
- [ ] User registration
- [ ] User login
- [ ] Browse restaurants
- [ ] Add to cart
- [ ] Place order
- [ ] Admin panel access

## Troubleshooting

**Database connection fails**
- Verify credentials in Vercel environment variables
- Check database allows external connections

**CORS errors**
- Ensure FRONTEND_URL exactly matches frontend domain
- Check app.js CORS configuration

**Build fails**
- Check Vercel build logs
- Ensure all dependencies in package.json
- Verify Node.js version compatibility

## Success! 🎉

Your app should now be live at:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.vercel.app

Every git push will automatically redeploy!
