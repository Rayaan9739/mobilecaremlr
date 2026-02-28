# Cloudinary Setup Guide

This project uses Cloudinary for image storage and management. Follow these steps to set up Cloudinary for your application.

## Step 1: Create a Cloudinary Account

1. Go to [https://cloudinary.com/](https://cloudinary.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address

## Step 2: Get Your Credentials

1. Log in to your Cloudinary account
2. Go to the Dashboard: [https://cloudinary.com/console](https://cloudinary.com/console)
3. You'll see your credentials in the "Account Details" section:
   - **Cloud Name**: Your unique cloud name
   - **API Key**: Your API key (looks like a number)
   - **API Secret**: Your API secret (click "Show" to reveal it)

## Step 3: Add Credentials to Your Project

1. Open the `.env` file in the `mc_backend` folder
2. Add your Cloudinary credentials:

```env
CLOUDINARY_CLOUD_NAME="your-cloud-name-here"
CLOUDINARY_API_KEY="your-api-key-here"
CLOUDINARY_API_SECRET="your-api-secret-here"
```

**Example:**
```env
CLOUDINARY_CLOUD_NAME="mystore123"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="abcdefghijklmnopqrstuvwxyz123456"
```

## Step 4: Verify Setup

1. Restart your backend server:
   ```bash
   npm run dev
   ```

2. Try uploading an image from the admin panel
3. The image should now be stored on Cloudinary instead of locally

## Features

- **Automatic Image Optimization**: Cloudinary automatically optimizes images for web
- **CDN Delivery**: Images are served through Cloudinary's global CDN for fast loading
- **Transformations**: Images are automatically resized and optimized
- **Storage Folder**: All images are stored in the `mobile-care-products` folder

## Troubleshooting

### Error: "Invalid credentials"
- Double-check that you copied the credentials correctly
- Make sure there are no extra spaces or quotes
- Verify you're using the correct Cloud Name (not the API Environment variable)

### Error: "Upload failed"
- Check your internet connection
- Verify your Cloudinary account is active
- Check if you've exceeded the free tier limits (25 GB storage, 25 GB bandwidth/month)

### Images not showing
- Check the browser console for CORS errors
- Verify the image URLs are correct
- Make sure your Cloudinary account is active

## Free Tier Limits

Cloudinary's free tier includes:
- 25 GB storage
- 25 GB bandwidth per month
- 25,000 transformations per month

This is more than enough for most small to medium-sized stores.

## Need Help?

- Cloudinary Documentation: [https://cloudinary.com/documentation](https://cloudinary.com/documentation)
- Support: [https://support.cloudinary.com](https://support.cloudinary.com)
