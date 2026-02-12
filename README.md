# Instagram Unfollower Finder

A privacy-focused web app to find Instagram accounts that don't follow you back.

## Features

- 🔒 **100% Private** - All processing happens in your browser
- 🚫 **No Data Upload** - Your data never leaves your device
- 📊 **Clear Results** - See who's not following you back
- 📥 **Export to CSV** - Download results for later

## How to Use

1. Go to Instagram Settings → Your Activity → Download Your Information
2. Request download in HTML format
3. Select "Followers and Following" only
4. Wait for Instagram's email (usually 48 hours)
5. Download and extract the ZIP file
6. Upload `followers.html` and `following.html` to this app

## Deployment to Vercel

### Quick Deploy

1. Push this repository to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Click "Deploy" (no configuration needed)

### Manual Configuration

If you need to configure settings:

1. Root Directory: `./`
2. Build Command: (leave empty)
3. Output Directory: `.`
4. Install Command: (leave empty)

## Local Development

Simply open `index.html` in your browser. No build step required!

## Tech Stack

- Pure HTML, CSS, and JavaScript
- No frameworks or dependencies
- No build process required

## Privacy

This app:
- ✅ Processes everything locally in your browser
- ✅ Never uploads your data to any server
- ✅ Doesn't use cookies or tracking
- ✅ Is completely open source

## License

MIT License - feel free to use and modify!
