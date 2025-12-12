# 📸 Cloudinary Integration Guide

## ✅ Setup Complete!

Your FoodEase project is now configured to use **Cloudinary** for image storage! All uploaded images will be stored in the cloud instead of locally.

---

## 🔑 Your Cloudinary Credentials

```bash
Cloud Name: dohg8ini6
API Key: 779645829788358
API Secret: bdWt2sUpHtB0ko4bXz6MYcOF8I8
Collection/Folder: FoodEase-Project
```

**Important:** These credentials work for **ALL folders/collections** in your Cloudinary account! You don't need different credentials for different collections.

---

## 📁 How Collections Work

In Cloudinary:
- **Account Credentials** = Same for entire account
  - Cloud Name: `dohg8ini6`
  - API Key & Secret: Authentication keys
  
- **Folders/Collections** = Organizational feature
  - `FoodEase-Project` = Your image folder
  - All images upload to: `FoodEase-Project/image-xxxxx.jpg`

---

## 🚀 What Was Configured

### 1. **Installed Packages**
```bash
✅ cloudinary - Cloudinary SDK
✅ multer-storage-cloudinary - Multer + Cloudinary integration
```

### 2. **Created Files**

**`backend/config/cloudinary.js`**
- Configuration for Cloudinary connection
- Uses your credentials
- Can be updated via environment variables

**Updated `backend/middlewares/upload.js`**
- Now uses Cloudinary storage instead of local disk
- Auto-uploads to `FoodEase-Project` folder
- Auto-resizes large images (max 1000x1000)
- Allowed formats: jpg, jpeg, png, gif, webp
- 5MB file size limit

**Updated `backend/routes/upload.routes.js`**
- Returns Cloudinary URLs instead of local paths
- Provides cloudinary_id for future deletions

### 3. **Updated Environment Variables**

Added to `backend/.env.example`:
```bash
CLOUDINARY_CLOUD_NAME=dohg8ini6
CLOUDINARY_API_KEY=779645829788358
CLOUDINARY_API_SECRET=bdWt2sUpHtB0ko4bXz6MYcOF8I8
```

---

## 🔧 How to Use

### For Local Development

1. **Create `.env` file** (if not exists):
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Your `.env` should include**:
   ```bash
   # Database
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=food_ordering_platform
   
   # JWT
   JWT_SECRET=your_secret_key
   
   # Cloudinary (already configured!)
   CLOUDINARY_CLOUD_NAME=dohg8ini6
   CLOUDINARY_API_KEY=779645829788358
   CLOUDINARY_API_SECRET=bdWt2sUpHtB0ko4bXz6MYcOF8I8
   
   # Server
   PORT=3000
   FRONTEND_URL=http://localhost:5173
   ```

3. **Start your backend**:
   ```bash
   npm run dev
   ```

### For Vercel Deployment

Add these environment variables in **Vercel Dashboard**:

```bash
CLOUDINARY_CLOUD_NAME=dohg8ini6
CLOUDINARY_API_KEY=779645829788358
CLOUDINARY_API_SECRET=bdWt2sUpHtB0ko4bXz6MYcOF8I8
```

---

## 📤 Upload Endpoints

### Single Image Upload

**Endpoint:** `POST /api/v1/upload/image`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: multipart/form-data
```

**Body (form-data):**
```
image: <file>
```

**Response:**
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/dohg8ini6/image/upload/v1234567890/FoodEase-Project/image-1234567890.jpg",
  "filename": "image-1234567890",
  "cloudinary_id": "FoodEase-Project/image-1234567890"
}
```

### Multiple Images Upload

**Endpoint:** `POST /api/v1/upload/images`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: multipart/form-data
```

**Body (form-data):**
```
images: <file1>
images: <file2>
images: <file3>
```

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "url": "https://res.cloudinary.com/dohg8ini6/image/upload/.../file1.jpg",
      "filename": "images-1234567890",
      "cloudinary_id": "FoodEase-Project/images-1234567890"
    },
    {
      "url": "https://res.cloudinary.com/dohg8ini6/image/upload/.../file2.jpg",
      "filename": "images-1234567891",
      "cloudinary_id": "FoodEase-Project/images-1234567891"
    }
  ],
  "count": 2
}
```

---

## 🎨 Frontend Integration

When you upload images from the frontend, you'll receive Cloudinary URLs that you can directly use:

```javascript
// Example: Upload restaurant image
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/v1/upload/image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
console.log('Cloudinary URL:', data.url);
// Use data.url for restaurant image_url field
```

---

## 🗂️ Image Organization

All images are uploaded to: **`FoodEase-Project/`** folder on Cloudinary

Example structure in Cloudinary dashboard:
```
FoodEase-Project/
├── image-1702345678901-123456789.jpg  (Restaurant logo)
├── image-1702345678902-987654321.jpg  (Menu item)
├── images-1702345678903-111111111.jpg (Gallery image 1)
└── images-1702345678904-222222222.jpg (Gallery image 2)
```

---

## ✨ Features

### Auto-Resize
- Large images automatically resized to max 1000x1000px
- Maintains aspect ratio
- Reduces bandwidth & improves performance

### Supported Formats
- ✅ JPG/JPEG
- ✅ PNG
- ✅ GIF
- ✅ WEBP

### File Size Limit
- 5 MB maximum per file
- Prevents server overload

### Security
- Only authenticated users (restaurant owners & admins) can upload
- File type validation (images only)

---

## 🔄 Migration from Local Storage

**Good news:** Your code automatically switched from local storage to Cloudinary!

**Old behavior:**
- Images saved to: `/uploads/` folder
- URLs like: `/uploads/general/image-xxx.jpg`

**New behavior:**
- Images saved to: Cloudinary cloud
- URLs like: `https://res.cloudinary.com/dohg8ini6/image/upload/v.../FoodEase-Project/image-xxx.jpg`

**No frontend changes needed!** The API still returns URLs - just now they're Cloudinary URLs instead of local paths.

---

## 🧪 Testing the Upload

### Using Postman

1. **Create a POST request**: `http://localhost:3000/api/v1/upload/image`

2. **Headers**:
   - `Authorization: Bearer YOUR_JWT_TOKEN`

3. **Body** (form-data):
   - Key: `image`
   - Type: File
   - Value: Select an image file

4. **Send** ✅

5. **Check response** for Cloudinary URL

6. **Verify on Cloudinary**:
   - Go to [cloudinary.com/console](https://cloudinary.com/console)
   - Navigate to Media Library
   - Check `FoodEase-Project` folder
   - Your image should be there!

---

## 📊 Cloudinary Dashboard

Access your images at: [https://cloudinary.com/console](https://cloudinary.com/console)

**Login with your credentials**
- View all uploaded images
- Organize into folders
- Delete images
- Get image URLs
- View usage statistics

---

## ⚠️ Important Notes

### 1. **Same Credentials for All Folders**
You asked: "Do I need new credentials for the new collection?"

**Answer:** NO! ❌

Your credentials (`dohg8ini6`, API key, API secret) work for **ALL folders** in your account:
- `FoodEase-Project/` ✅
- `any-other-folder/` ✅
- `test/` ✅

Folders are just organizational - they all use the same account credentials.

### 2. **Free Tier Limits**
- 25 GB storage
- 25 GB monthly bandwidth
- 25,000 transformations/month

**Plenty for student projects!** 🎉

### 3. **Production Deployment**
When deploying to Vercel:
- Add Cloudinary variables to Vercel environment settings
- Images automatically upload to cloud
- No need for `/uploads` folder on server

---

## 🎯 Summary

✅ **Cloudinary configured** with your credentials  
✅ **Collection set** to `FoodEase-Project`  
✅ **Upload routes updated** to return Cloudinary URLs  
✅ **Auto-resize enabled** for large images  
✅ **Environment variables** ready for deployment  
✅ **Same credentials** work for all folders  

**You're all set!** Images will now be stored in the cloud! ☁️📸

---

## 🆘 Troubleshooting

**Upload fails with "Invalid credentials"**
- Check `.env` file has correct values
- Restart backend server after updating `.env`

**Images not appearing in Cloudinary dashboard**
- Check folder name: must be `FoodEase-Project`
- Verify upload response includes Cloudinary URL
- Check Cloudinary account is active

**File too large error**
- Current limit: 5 MB
- Compress image before upload
- Or increase limit in `middlewares/upload.js`

---

**Happy uploading! 🚀**
