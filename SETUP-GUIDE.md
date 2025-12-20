# Nanny Fifi Website - Setup Guide

## Website Files Created

Your website is ready at: `C:\Users\hamad\OneDrive\Desktop\nanny-fifi-website`

Files included:
- `index.html` - Main website page
- `styles.css` - All styling (warm pink/peach theme)
- `script.js` - Interactive features (menu, FAQ, animations)

---

## Step 1: Calendly Setup (Free Account)

### Create Your Calendly Account

1. Go to **https://calendly.com/signup**
2. Sign up with your email (or Google account)
3. Choose the **Free plan** (works great for starting out)

### Create Your Discovery Call Event

1. After logging in, click **"+ Create"** button
2. Select **"One-on-One"**
3. Configure the event:
   - **Event name:** `Free Discovery Call`
   - **Duration:** `15 minutes`
   - **Location:** `Zoom` (or Google Meet)
   - **Description:**
     ```
     A free 15-minute call to discuss your parenting challenges
     and see how I can help your family thrive.
     ```

4. Set your **availability**:
   - Choose which days you're available
   - Set time slots (e.g., 9am-5pm)
   - Set timezone

5. Click **"Save & Close"**

### Get Your Calendly Link

1. Go to your Calendly dashboard
2. Click on your event
3. Copy the link (looks like: `https://calendly.com/your-username/discovery-call`)

### Add Calendly to Your Website

Open `index.html` and find this section (around line 390):

```html
<div class="calendly-placeholder" id="calendly-embed">
    <div class="calendly-setup-notice">
        ...
    </div>
</div>
```

**Replace it with:**

```html
<div class="calendly-inline-widget"
     data-url="https://calendly.com/YOUR_USERNAME/discovery-call"
     style="min-width:320px;height:630px;">
</div>
<script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
```

Replace `YOUR_USERNAME` with your actual Calendly username.

---

## Step 2: GitHub Pages Deployment

### Create the Repository

1. Go to **https://github.com** and log in
2. Click the **+** icon (top right) → **"New repository"**
3. Repository name: `nannyfifi.com` (or `nanny-fifi-website`)
4. Make it **Public**
5. Click **"Create repository"**

### Upload Your Files

**Option A: Using GitHub Website (Easiest)**

1. In your new repository, click **"uploading an existing file"**
2. Drag and drop all 3 files:
   - `index.html`
   - `styles.css`
   - `script.js`
3. Scroll down and click **"Commit changes"**

**Option B: Using Git Command Line**

```bash
cd "C:\Users\hamad\OneDrive\Desktop\nanny-fifi-website"

git init
git add .
git commit -m "Initial website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nannyfifi.com.git
git push -u origin main
```

### Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **"Settings"** tab
3. Scroll down to **"Pages"** in the left sidebar
4. Under **"Source"**, select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **"Save"**
6. Wait 1-2 minutes, then your site will be live at:
   - `https://YOUR_USERNAME.github.io/nannyfifi.com`

---

## Step 3: Connect Your Custom Domain (nannyfifi.com)

### In GitHub Pages Settings

1. Go to repository **Settings → Pages**
2. Under **"Custom domain"**, enter: `nannyfifi.com`
3. Click **"Save"**
4. Check **"Enforce HTTPS"** (after DNS propagates)

### Update Your Domain DNS

Go to your domain registrar (where you bought nannyfifi.com) and add these DNS records:

**Option A: For apex domain (nannyfifi.com)**

Add these 4 **A records**:
| Type | Name | Value |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

**Option B: Add www subdomain (recommended)**

Add a **CNAME record**:
| Type | Name | Value |
|------|------|-------|
| CNAME | www | YOUR_USERNAME.github.io |

### Wait for DNS Propagation

- DNS changes can take 15 minutes to 48 hours
- Check status: https://dnschecker.org
- Once propagated, your site will be live at: **https://nannyfifi.com**

---

## Step 4: Customize Your Content

### Add Your Photos

Replace the placeholder images in `index.html`:

1. **Hero image**: Replace the `hero-placeholder` div with:
```html
<img src="your-hero-photo.jpg" alt="Nanny Fifi - Parent Coach" class="hero-photo">
```

2. **About image**: Replace the `about-placeholder` div similarly

### Update Your Information

Search and replace in `index.html`:

- `hello@nannyfifi.com` → Your actual email
- Experience years (`10+`) → Your experience
- Stats (`500+` families, etc.) → Your stats
- Pricing (`$79`, `$199`) → Your actual prices
- Testimonials → Real testimonials (when you get them)

### Update Bio Text

Find the "About" section and personalize:
- Your background story
- Your qualifications
- Your approach to coaching

---

## Step 5: Test Everything

Before going live, test:

- [ ] All navigation links work
- [ ] Mobile menu opens/closes
- [ ] FAQ accordion works
- [ ] Calendly booking widget loads
- [ ] Contact form opens email client
- [ ] Site looks good on mobile
- [ ] Custom domain works with HTTPS

---

## Optional Enhancements

### Add Google Analytics

1. Create account at https://analytics.google.com
2. Get your tracking ID (G-XXXXXXXXXX)
3. Add before `</head>` in index.html:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Add a Favicon

Create a small logo/icon and add to `<head>`:
```html
<link rel="icon" type="image/png" href="favicon.png">
```

### Connect a Form Service (for real form submissions)

Instead of mailto, use:
- **Formspree** (free): https://formspree.io
- **Netlify Forms** (if hosting on Netlify)

---

## Need Help?

If you run into any issues:
1. Check GitHub Pages documentation: https://docs.github.com/pages
2. Check Calendly help: https://help.calendly.com
3. Ask me for help!

Good luck with Nanny Fifi's coaching business!
