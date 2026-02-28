# Quick Setup Checklist

## ✅ Cloudinary Setup (Required for Image Uploads)

### Step 1: Get Cloudinary Credentials
1. Go to https://cloudinary.com and sign up (free)
2. Go to Dashboard: https://cloudinary.com/console
3. Copy these three values:
   - Cloud Name: `_________________`
   - API Key: `_________________`
   - API Secret: `_________________`

### Step 2: Add to .env File
Open `mc_backend/.env` and add:
```env
CLOUDINARY_CLOUD_NAME="paste-your-cloud-name-here"
CLOUDINARY_API_KEY="paste-your-api-key-here"
CLOUDINARY_API_SECRET="paste-your-api-secret-here"
```

### Step 3: Restart Backend
```bash
cd mc_backend
npm run dev
```

## ✅ Test the Changes

### 1. Test Technician Management
- [ ] Open http://localhost:5173/admin
- [ ] Click "Technicians" tab
- [ ] Click "Add Technician"
- [ ] Fill in name, role, and upload an image
- [ ] Save and verify it appears in the list

### 2. Test About Page
- [ ] Open http://localhost:5173/about
- [ ] Scroll down to "Our Technicians" section
- [ ] Verify technicians from admin panel appear here

### 3. Test Home Page
- [ ] Open http://localhost:5173
- [ ] Verify NO "Testimonials" section appears
- [ ] Verify NO "Team" section appears

### 4. Test Image Upload
- [ ] Go to Admin > Products
- [ ] Try adding a product with an image
- [ ] Verify image uploads successfully
- [ ] Check Cloudinary dashboard to see the uploaded image

## 🔧 Troubleshooting

### Images not uploading?
1. Check .env file has correct Cloudinary credentials
2. Restart backend server
3. Check browser console for errors
4. Verify Cloudinary account is active

### Technicians not showing on About page?
1. Make sure you added technicians in Admin panel
2. Check browser console for errors
3. Clear browser cache and reload

### Backend not starting?
1. Check all environment variables are set
2. Run `npm install` in mc_backend folder
3. Check for port conflicts (default: 5000)

## 📝 Notes

- All images are now stored on Cloudinary (cloud storage)
- Technicians are stored in browser localStorage
- Changes in admin panel are instant
- Free Cloudinary tier: 25GB storage, 25GB bandwidth/month

## 🎯 What's New

✅ Technician management in admin panel
✅ Technicians section on About page
✅ Cloudinary integration for all images
❌ Removed testimonials from home page
❌ Removed team section from home page

## 📚 Documentation

- Full setup guide: `mc_backend/CLOUDINARY_SETUP.md`
- Migration details: `MIGRATION_GUIDE.md`
- Cloudinary docs: https://cloudinary.com/documentation
