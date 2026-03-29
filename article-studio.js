#!/usr/bin/env node

/**
 * Nanny Fifi - Article Studio
 * Local web app to generate, preview, edit and publish blog articles.
 * Run: node article-studio.js
 * Open: http://localhost:3456
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const app = express();
const PORT = 3456;
const ROOT = __dirname;
const BLOG_DIR = path.join(ROOT, 'blog');
const BLOG_IMAGES_DIR = path.join(BLOG_DIR, 'images');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const SITE_URL = 'https://nannyfifi.com';

// Ensure directories exist
[BLOG_DIR, BLOG_IMAGES_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/preview-assets', express.static(ROOT));

const upload = multer({ dest: path.join(ROOT, '.uploads') });

// Load API key
function getApiKey() {
    if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
    const envPath = path.join(ROOT, '.env');
    if (fs.existsSync(envPath)) {
        const match = fs.readFileSync(envPath, 'utf-8').match(/ANTHROPIC_API_KEY=(.+)/);
        if (match) return match[1].trim();
    }
    return null;
}

// Store current article state for refinement
let currentArticle = null;
let conversationHistory = [];

// ── AI Generation ──────────────────────────────────────────────────────────────

async function generateArticle(caption, imageBase64, feedback) {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: getApiKey() });

    const systemPrompt = `You are Sofia Kavouri (Nanny Fifi), a parent coach with 15+ years of childcare experience and a BA in Early Childhood from The Open University. You write in warm, supportive British English (use "whilst", "behaviour", "personalised", "colour", etc.).

Your task: Turn an Instagram caption into a full SEO blog article.

Rules:
1. Write 900-1200 words of genuinely helpful parenting advice
2. Use a warm, conversational tone — like talking to a friend over tea
3. Include practical, actionable tips parents can use right away
4. Structure with clear headings (H2 and H3)
5. Naturally weave in relevant search keywords throughout
6. End with encouragement and a warm sign-off

CRITICAL: Return ONLY raw JSON (no markdown, no backticks, no explanation). All string values must be on a single line. Use \\n for newlines. Escape quotes with \\". Structure:
{
    "title": "Article Title: Subtitle If Needed",
    "metaDescription": "150-160 character description with target keywords",
    "slug": "url-friendly-slug",
    "readTime": "5 min read",
    "keywords": "comma, separated, target, keywords",
    "content": "<h2>First Section</h2><p>Content...</p>",
    "relatedService": "behaviour-emotions|routines-daily-life|confidence-transitions|parental-wellbeing|shop",
    "relatedServiceText": "Text for the internal link"
}

For the content field, use only: h2, h3, p, ul, ol, li, strong, em, a
Internal link paths: ../behaviour-emotions.html, ../routines-daily-life.html, ../confidence-transitions.html, ../parental-wellbeing.html, ../shop.html, ../index.html#book`;

    // Build messages
    const messages = [];

    if (conversationHistory.length > 0 && feedback) {
        // Refinement mode — continue conversation
        messages.push(...conversationHistory);
        messages.push({ role: 'user', content: [{ type: 'text', text: `Please update the article based on this feedback: ${feedback}\n\nReturn the complete updated article as JSON in the same format.` }] });
    } else {
        // First generation
        const content = [];
        if (imageBase64) {
            content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } });
        }
        content.push({ type: 'text', text: `Turn this Instagram post into a full SEO blog article:\n\nCaption: ${caption || '(See image for content)'}` });
        messages.push({ role: 'user', content });
    }

    const response = await client.messages.create({
        model: imageBase64 && !feedback ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: systemPrompt,
        messages,
    });

    const text = response.content[0].text;

    // Save conversation for refinement
    if (conversationHistory.length === 0 || !feedback) {
        conversationHistory = messages;
    } else {
        conversationHistory.push(messages[messages.length - 1]);
    }
    conversationHistory.push({ role: 'assistant', content: [{ type: 'text', text }] });

    // Parse JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI did not return valid JSON');

    let jsonStr = jsonMatch[0];
    let result;
    try {
        result = JSON.parse(jsonStr);
    } catch (e) {
        // Fix common issues
        jsonStr = jsonStr.replace(/(?<=:\s*")([\s\S]*?)(?="(?:\s*[,}]))/g, (m) =>
            m.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
        );
        try {
            result = JSON.parse(jsonStr);
        } catch (e2) {
            const extract = (field) => {
                const m = text.match(new RegExp(`"${field}"\\s*:\\s*"([\\s\\S]*?)(?:"|$)\\s*(?:,|\\})`));
                return m ? m[1].replace(/\\"/g, '"').replace(/\n/g, ' ') : '';
            };
            result = {
                title: extract('title'), metaDescription: extract('metaDescription'),
                slug: extract('slug'), readTime: extract('readTime') || '5 min read',
                keywords: extract('keywords'), content: extract('content'),
                relatedService: extract('relatedService'), relatedServiceText: extract('relatedServiceText')
            };
        }
    }

    currentArticle = result;
    return result;
}

// ── HTML Builder ───────────────────────────────────────────────────────────────

function buildArticleHTML(article, imageRelPath) {
    const today = new Date().toISOString().split('T')[0];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthYear = `${months[new Date().getMonth()]} ${new Date().getFullYear()}`;
    const canonicalUrl = `${SITE_URL}/blog/${article.slug}.html`;
    const ogImage = imageRelPath ? `${SITE_URL}/blog/${imageRelPath}` : `${SITE_URL}/images/sofia-profile.jpg`;

    const heroImage = imageRelPath
        ? `\n            <img src="${imageRelPath}" alt="${article.title}" style="width:100%; max-width:750px; border-radius:12px; margin:1.5rem auto 0; display:block;">`
        : '';

    const ctaMap = {
        'behaviour-emotions': { h: 'Need Personalised Support?', p: 'Every child is different. Book a free 30-minute discovery call and let\'s talk about what\'s going on with your little one.', link: '../index.html#book', btn: 'Book Your Free Discovery Call' },
        'routines-daily-life': { h: 'Struggling With Routines?', p: 'Every family is different. Book a free discovery call and I\'ll help you create routines that actually work.', link: '../index.html#book', btn: 'Book Your Free Discovery Call' },
        'confidence-transitions': { h: 'Need Help With Transitions?', p: 'Starting nursery, new sibling, or a big move? Book a free discovery call and let\'s create a plan together.', link: '../index.html#book', btn: 'Book Your Free Discovery Call' },
        'parental-wellbeing': { h: 'You Don\'t Have to Do This Alone', p: 'Parenting is hard, and asking for help is a sign of strength. Book a free discovery call and let\'s talk.', link: '../index.html#book', btn: 'Book Your Free Discovery Call' },
        'shop': { h: 'Want the Complete Guide?', p: 'My Baby Led Weaning Guide has 50+ recipes, meal plans, allergen trackers, and everything you need.', link: '../shop.html', btn: 'Visit the Shop' },
    };
    const cta = ctaMap[article.relatedService] || ctaMap['behaviour-emotions'];

    return `<!DOCTYPE html>
<html lang="en-GB">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-HJFNH2HBF2"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-HJFNH2HBF2');</script>
    <meta name="description" content="${article.metaDescription.replace(/"/g,'&quot;')}">
    <meta name="keywords" content="${article.keywords}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonicalUrl}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:title" content="${article.title.replace(/"/g,'&quot;')} | Nanny Fifi">
    <meta property="og:description" content="${article.metaDescription.replace(/"/g,'&quot;')}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:site_name" content="Nanny Fifi">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${article.title.replace(/"/g,'&quot;')} | Nanny Fifi">
    <meta name="twitter:description" content="${article.metaDescription.replace(/"/g,'&quot;')}">
    <meta name="twitter:image" content="${ogImage}">
    <title>${article.title} | Nanny Fifi</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../styles.css">
    <link rel="icon" type="image/jpeg" href="../images/logo.webp">
    <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"Article","headline":"${article.title.replace(/"/g,'\\"')}","author":{"@type":"Person","name":"Sofia Kavouri","jobTitle":"Parent Coach","url":"${SITE_URL}"},"publisher":{"@type":"Organization","name":"Nanny Fifi","url":"${SITE_URL}"},"datePublished":"${today}","dateModified":"${today}","description":"${article.metaDescription.replace(/"/g,'\\"')}","mainEntityOfPage":"${canonicalUrl}"}
    </script>
    <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"${SITE_URL}/"},{"@type":"ListItem","position":2,"name":"Articles","item":"${SITE_URL}/blog/"},{"@type":"ListItem","position":3,"name":"${article.title.replace(/"/g,'\\"')}","item":"${canonicalUrl}"}]}
    </script>
    <style>
        .article-hero{padding:120px 0 60px;background:linear-gradient(135deg,var(--color-bg) 0%,var(--color-secondary) 100%)}
        .article-hero .back-link{display:inline-block;margin-bottom:1.5rem;color:var(--color-primary-dark);text-decoration:none;font-weight:500}
        .article-hero .back-link:hover{text-decoration:underline}
        .article-hero h1{font-family:var(--font-heading);font-size:2.5rem;color:var(--color-text);margin-bottom:1rem}
        .article-meta{color:var(--color-text-light);font-size:.95rem}
        .article-body{padding:3rem 0;max-width:750px;margin:0 auto}
        .article-body h2{font-family:var(--font-heading);font-size:1.75rem;color:var(--color-text);margin:2.5rem 0 1rem}
        .article-body h3{font-family:var(--font-heading);font-size:1.35rem;color:var(--color-text);margin:2rem 0 .75rem}
        .article-body p{color:var(--color-text);line-height:1.8;margin-bottom:1.25rem;font-size:1.05rem}
        .article-body ul,.article-body ol{color:var(--color-text);line-height:1.8;margin-bottom:1.25rem;padding-left:1.5rem}
        .article-body li{margin-bottom:.5rem}
        .article-body strong{color:var(--color-text)}
        .article-body a{color:var(--color-primary-dark);text-decoration:underline}
        .article-body a:hover{color:var(--color-primary)}
        .article-cta{background:var(--color-secondary);border-radius:var(--radius-lg);padding:2.5rem;text-align:center;margin:3rem 0}
        .article-cta h3{font-family:var(--font-heading);margin-bottom:1rem}
        .article-cta p{color:var(--color-text-light);margin-bottom:1.5rem}
    </style>
</head>
<body>
    <nav class="navbar"><div class="container nav-container">
        <a href="../index.html" class="logo"><img src="../images/logo.webp" alt="Nanny Fifi" class="logo-img"><span class="logo-text">Nanny Fifi</span></a>
        <button class="mobile-menu-btn" aria-label="Toggle menu"><span></span><span></span><span></span></button>
        <ul class="nav-links">
            <li><a href="../index.html#about">About</a></li>
            <li><a href="../index.html#services">Services</a></li>
            <li><a href="../shop.html">Shop</a></li>
            <li><a href="../love-language-quiz.html">Love Language Quiz</a></li>
            <li><a href="../index.html#testimonials">Testimonials</a></li>
            <li><a href="../index.html#book" class="btn btn-primary nav-cta">Book a Call</a></li>
        </ul>
    </div></nav>
    <header class="article-hero"><div class="container">
        <a href="../index.html" class="back-link">&larr; Back to Home</a>
        <h1>${article.title}</h1>
        <div class="article-meta"><span>By Sofia Kavouri</span> &middot; <span>${monthYear}</span> &middot; <span>${article.readTime}</span></div>${heroImage}
    </div></header>
    <main class="section"><div class="container"><div class="article-body">
        ${article.content}
        <div class="article-cta">
            <h3>${cta.h}</h3>
            <p>${cta.p}</p>
            <a href="${cta.link}" class="btn btn-primary btn-large">${cta.btn}</a>
        </div>
    </div></div></main>
    <footer class="footer"><div class="container"><div class="footer-content">
        <div class="footer-brand"><a href="../index.html" class="logo"><span class="logo-icon">&#x1f9f8;</span><span class="logo-text">Nanny Fifi</span></a><p>Helping parents raise happy, confident children through gentle guidance and expert support.</p></div>
        <div class="footer-links">
            <div class="footer-column"><h4>Quick Links</h4><ul><li><a href="../index.html#about">About</a></li><li><a href="../index.html#services">Services</a></li><li><a href="../love-language-quiz.html">Love Language Quiz</a></li><li><a href="../index.html#book">Book a Call</a></li></ul></div>
            <div class="footer-column"><h4>Services</h4><ul><li><a href="../behaviour-emotions.html">Behaviour & Emotions</a></li><li><a href="../routines-daily-life.html">Sleep, Meals & Routines</a></li><li><a href="../confidence-transitions.html">Confidence & Transitions</a></li><li><a href="../parental-wellbeing.html">Parental Wellbeing</a></li></ul></div>
        </div>
    </div><div class="footer-bottom"><p>&copy; 2024 Nanny Fifi. All rights reserved.</p></div></div></footer>
    <script src="../script.js"></script>
    <div id="cookie-consent" style="display:none;position:fixed;bottom:0;left:0;right:0;background:#4A3F3A;color:#fff;padding:1rem 1.5rem;z-index:10000;font-family:'Inter',sans-serif;font-size:.9rem"><div style="max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem"><p style="margin:0;flex:1;min-width:250px">We use cookies to analyse site traffic and improve your experience. By clicking "Accept", you consent to our use of cookies.</p><div style="display:flex;gap:.5rem"><button onclick="acceptCookies()" style="background:#E8A598;color:#4A3F3A;border:none;padding:.5rem 1.25rem;border-radius:6px;cursor:pointer;font-weight:600;font-size:.85rem">Accept</button><button onclick="declineCookies()" style="background:transparent;color:#fff;border:1px solid #fff;padding:.5rem 1.25rem;border-radius:6px;cursor:pointer;font-weight:600;font-size:.85rem">Decline</button></div></div></div>
    <script>function acceptCookies(){document.cookie="cookie_consent=accepted;path=/;max-age=31536000";document.getElementById('cookie-consent').style.display='none';}function declineCookies(){document.cookie="cookie_consent=declined;path=/;max-age=31536000";document.getElementById('cookie-consent').style.display='none';window['ga-disable-G-HJFNH2HBF2']=true;}(function(){var c=document.cookie.match(/cookie_consent=([^;]+)/);if(c){if(c[1]==='declined')window['ga-disable-G-HJFNH2HBF2']=true;}else{document.getElementById('cookie-consent').style.display='block';}})();</script>
</body>
</html>`;
}

// ── Sitemap ────────────────────────────────────────────────────────────────────

function updateSitemap(slug) {
    const today = new Date().toISOString().split('T')[0];
    let sitemap = fs.readFileSync(SITEMAP_PATH, 'utf-8');
    if (sitemap.includes(`/blog/${slug}.html`)) return;
    const entry = `    <url>\n        <loc>${SITE_URL}/blog/${slug}.html</loc>\n        <lastmod>${today}</lastmod>\n        <changefreq>monthly</changefreq>\n        <priority>0.7</priority>\n    </url>`;
    sitemap = sitemap.replace('</urlset>', `${entry}\n</urlset>`);
    fs.writeFileSync(SITEMAP_PATH, sitemap);
}

// ── Image Processing ───────────────────────────────────────────────────────────

async function processUploadedImage(filePath, slug) {
    const webpName = `${slug}.webp`;
    const webpPath = path.join(BLOG_IMAGES_DIR, webpName);
    try {
        const sharp = require('sharp');
        await sharp(filePath).webp({ quality: 80 }).resize({ width: 1200, withoutEnlargement: true }).toFile(webpPath);
    } catch {
        const ext = path.extname(filePath);
        const fallback = `${slug}${ext}`;
        fs.copyFileSync(filePath, path.join(BLOG_IMAGES_DIR, fallback));
        return `images/${fallback}`;
    }
    return `images/${webpName}`;
}

// ── Routes ─────────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nanny Fifi - Article Studio</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #FFFAF8; color: #4A3F3A; }
        .header { background: #4A3F3A; color: #fff; padding: 1rem 2rem; display: flex; align-items: center; gap: 1rem; }
        .header h1 { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 600; }
        .header span { color: #E8A598; }
        .container { display: grid; grid-template-columns: 400px 1fr; height: calc(100vh - 56px); }
        .sidebar { padding: 1.5rem; overflow-y: auto; border-right: 1px solid #F5D5CE; background: #fff; }
        .preview-panel { overflow-y: auto; background: #f5f5f5; }
        .preview-panel iframe { width: 100%; height: 100%; border: none; }
        label { display: block; font-weight: 600; margin-bottom: 0.4rem; font-size: 0.9rem; color: #4A3F3A; }
        textarea { width: 100%; border: 1.5px solid #E8A598; border-radius: 8px; padding: 0.75rem; font-family: 'Inter', sans-serif; font-size: 0.9rem; resize: vertical; outline: none; transition: border-color 0.2s; }
        textarea:focus { border-color: #D4887A; }
        .caption-input { min-height: 150px; }
        .feedback-input { min-height: 80px; }
        .file-upload { border: 2px dashed #E8A598; border-radius: 8px; padding: 1.5rem; text-align: center; cursor: pointer; transition: all 0.2s; margin-bottom: 0.5rem; }
        .file-upload:hover { border-color: #D4887A; background: #FFF5F1; }
        .file-upload.has-file { border-style: solid; background: #FFF5F1; }
        .file-upload input { display: none; }
        .file-upload p { color: #7D6E66; font-size: 0.85rem; }
        .file-upload .filename { color: #D4887A; font-weight: 600; }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; width: 100%; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-generate { background: #E8A598; color: #4A3F3A; }
        .btn-generate:hover:not(:disabled) { background: #D4887A; color: #fff; }
        .btn-refine { background: #fff; color: #4A3F3A; border: 1.5px solid #E8A598; }
        .btn-refine:hover:not(:disabled) { background: #FFF5F1; }
        .btn-publish { background: #4A3F3A; color: #fff; }
        .btn-publish:hover:not(:disabled) { background: #3a302a; }
        .section { margin-bottom: 1.25rem; }
        .section-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid #F5D5CE; }
        .status { padding: 0.75rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem; display: none; }
        .status.info { display: block; background: #F5D5CE; color: #4A3F3A; }
        .status.success { display: block; background: #d4edda; color: #155724; }
        .status.error { display: block; background: #f8d7da; color: #721c24; }
        .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid #ccc; border-top-color: #4A3F3A; border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .article-info { background: #FFF5F1; padding: 0.75rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem; display: none; }
        .article-info h4 { font-family: 'Playfair Display', serif; margin-bottom: 0.3rem; }
        .article-info p { color: #7D6E66; margin: 0.15rem 0; }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #A69890; text-align: center; padding: 2rem; }
        .empty-state h2 { font-family: 'Playfair Display', serif; color: #7D6E66; margin-bottom: 0.5rem; }
        .btn-row { display: flex; gap: 0.5rem; }
        .btn-row .btn { flex: 1; }
    </style>
</head>
<body>
    <div class="header">
        <h1><span>Nanny Fifi</span> Article Studio</h1>
    </div>
    <div class="container">
        <div class="sidebar">
            <div id="status" class="status"></div>

            <div class="section">
                <div class="section-title">Instagram Post</div>
                <label for="caption">Caption</label>
                <textarea id="caption" class="caption-input" placeholder="Paste the Instagram caption here..."></textarea>
            </div>

            <div class="section">
                <label>Image (optional)</label>
                <div class="file-upload" id="dropzone" onclick="document.getElementById('imageInput').click()">
                    <input type="file" id="imageInput" accept="image/*">
                    <p id="fileLabel">Drop an image here or click to browse</p>
                </div>
            </div>

            <div class="section">
                <button class="btn btn-generate" id="generateBtn" onclick="generate()">Generate Article</button>
            </div>

            <div id="articleInfo" class="article-info">
                <h4 id="articleTitle"></h4>
                <p id="articleKeywords"></p>
                <p id="articleSlug"></p>
            </div>

            <div class="section" id="refineSection" style="display:none;">
                <div class="section-title">Refine</div>
                <label for="feedback">What would you like to change?</label>
                <textarea id="feedback" class="feedback-input" placeholder="e.g. Make the tone more playful, add a section about nighttime, shorter intro..."></textarea>
                <div style="margin-top:0.5rem;">
                    <button class="btn btn-refine" id="refineBtn" onclick="refine()">Update Article</button>
                </div>
            </div>

            <div class="section" id="publishSection" style="display:none;">
                <div class="section-title">Publish</div>
                <div class="btn-row">
                    <button class="btn btn-publish" id="publishBtn" onclick="publish()">Publish to Website</button>
                </div>
            </div>
        </div>

        <div class="preview-panel" id="previewPanel">
            <div class="empty-state" id="emptyState">
                <h2>Article Preview</h2>
                <p>Paste a caption and click Generate to see your article here.</p>
            </div>
            <iframe id="previewFrame" style="display:none;"></iframe>
        </div>
    </div>

    <script>
        let currentSlug = null;
        let hasImage = false;

        // File upload handling
        const dropzone = document.getElementById('dropzone');
        const imageInput = document.getElementById('imageInput');
        const fileLabel = document.getElementById('fileLabel');

        imageInput.addEventListener('change', () => {
            if (imageInput.files.length > 0) {
                fileLabel.innerHTML = '<span class="filename">' + imageInput.files[0].name + '</span>';
                dropzone.classList.add('has-file');
                hasImage = true;
            }
        });

        dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = '#D4887A'; });
        dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = '#E8A598'; });
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = '#E8A598';
            if (e.dataTransfer.files.length > 0) {
                imageInput.files = e.dataTransfer.files;
                fileLabel.innerHTML = '<span class="filename">' + e.dataTransfer.files[0].name + '</span>';
                dropzone.classList.add('has-file');
                hasImage = true;
            }
        });

        function setStatus(msg, type) {
            const el = document.getElementById('status');
            el.className = 'status ' + type;
            el.innerHTML = msg;
        }

        async function generate() {
            const caption = document.getElementById('caption').value.trim();
            const file = imageInput.files[0];

            if (!caption && !file) {
                setStatus('Please provide a caption or image.', 'error');
                return;
            }

            const btn = document.getElementById('generateBtn');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> Generating...';
            setStatus('Claude is writing your article...', 'info');

            const formData = new FormData();
            formData.append('caption', caption);
            if (file) formData.append('image', file);

            try {
                const res = await fetch('/generate', { method: 'POST', body: formData });
                const data = await res.json();

                if (data.error) {
                    setStatus('Error: ' + data.error, 'error');
                    btn.disabled = false;
                    btn.innerHTML = 'Generate Article';
                    return;
                }

                currentSlug = data.slug;
                document.getElementById('articleTitle').textContent = data.title;
                document.getElementById('articleKeywords').textContent = 'Keywords: ' + data.keywords;
                document.getElementById('articleSlug').textContent = 'URL: nannyfifi.com/blog/' + data.slug + '.html';
                document.getElementById('articleInfo').style.display = 'block';

                // Show preview
                document.getElementById('emptyState').style.display = 'none';
                const frame = document.getElementById('previewFrame');
                frame.style.display = 'block';
                frame.src = '/preview/' + data.slug + '?t=' + Date.now();

                // Show refine and publish sections
                document.getElementById('refineSection').style.display = 'block';
                document.getElementById('publishSection').style.display = 'block';

                setStatus('Article generated! Review the preview and refine or publish.', 'success');
            } catch (err) {
                setStatus('Error: ' + err.message, 'error');
            }

            btn.disabled = false;
            btn.innerHTML = 'Generate Article';
        }

        async function refine() {
            const feedback = document.getElementById('feedback').value.trim();
            if (!feedback) {
                setStatus('Please describe what you want to change.', 'error');
                return;
            }

            const btn = document.getElementById('refineBtn');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> Updating...';
            setStatus('Claude is updating the article...', 'info');

            try {
                const res = await fetch('/refine', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ feedback })
                });
                const data = await res.json();

                if (data.error) {
                    setStatus('Error: ' + data.error, 'error');
                    btn.disabled = false;
                    btn.innerHTML = 'Update Article';
                    return;
                }

                currentSlug = data.slug;
                document.getElementById('articleTitle').textContent = data.title;
                document.getElementById('articleKeywords').textContent = 'Keywords: ' + data.keywords;
                document.getElementById('articleSlug').textContent = 'URL: nannyfifi.com/blog/' + data.slug + '.html';

                const frame = document.getElementById('previewFrame');
                frame.src = '/preview/' + data.slug + '?t=' + Date.now();

                document.getElementById('feedback').value = '';
                setStatus('Article updated! Review and refine again or publish.', 'success');
            } catch (err) {
                setStatus('Error: ' + err.message, 'error');
            }

            btn.disabled = false;
            btn.innerHTML = 'Update Article';
        }

        async function publish() {
            if (!currentSlug) return;

            const btn = document.getElementById('publishBtn');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> Publishing...';
            setStatus('Pushing to GitHub...', 'info');

            try {
                const res = await fetch('/publish', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slug: currentSlug })
                });
                const data = await res.json();

                if (data.error) {
                    setStatus('Error: ' + data.error, 'error');
                } else {
                    setStatus('Published! Live at: <a href="' + data.url + '" target="_blank" style="color:inherit;font-weight:600">' + data.url + '</a>', 'success');
                }
            } catch (err) {
                setStatus('Error: ' + err.message, 'error');
            }

            btn.disabled = false;
            btn.innerHTML = 'Publish to Website';
        }
    </script>
</body>
</html>`);
});

// Generate endpoint
app.post('/generate', upload.single('image'), async (req, res) => {
    try {
        const caption = req.body.caption || '';
        let imageBase64 = null;
        let imageRelPath = null;

        if (req.file) {
            imageBase64 = fs.readFileSync(req.file.path).toString('base64');
        }

        // Reset conversation for new generation
        conversationHistory = [];
        currentArticle = null;

        const article = await generateArticle(caption, imageBase64);

        // Process image if uploaded
        if (req.file) {
            imageRelPath = await processUploadedImage(req.file.path, article.slug);
            fs.unlinkSync(req.file.path); // Clean up temp file
        }

        // Save HTML
        const html = buildArticleHTML(article, imageRelPath);
        fs.writeFileSync(path.join(BLOG_DIR, `${article.slug}.html`), html);

        // Store image path for refinements
        currentArticle._imageRelPath = imageRelPath;

        res.json(article);
    } catch (err) {
        res.json({ error: err.message });
    }
});

// Refine endpoint
app.post('/refine', async (req, res) => {
    try {
        const { feedback } = req.body;
        const oldSlug = currentArticle?.slug;
        const imageRelPath = currentArticle?._imageRelPath;

        const article = await generateArticle(null, null, feedback);

        // Delete old file if slug changed
        if (oldSlug && oldSlug !== article.slug) {
            const oldPath = path.join(BLOG_DIR, `${oldSlug}.html`);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        // Save updated HTML
        const html = buildArticleHTML(article, imageRelPath);
        fs.writeFileSync(path.join(BLOG_DIR, `${article.slug}.html`), html);
        currentArticle._imageRelPath = imageRelPath;

        res.json(article);
    } catch (err) {
        res.json({ error: err.message });
    }
});

// Preview endpoint — serves the article with corrected asset paths
app.get('/preview/:slug', (req, res) => {
    const filePath = path.join(BLOG_DIR, `${req.params.slug}.html`);
    if (!fs.existsSync(filePath)) return res.status(404).send('Not found');

    let html = fs.readFileSync(filePath, 'utf-8');
    // Rewrite relative paths for local preview
    html = html.replace(/href="\.\.\//g, 'href="/preview-assets/');
    html = html.replace(/src="\.\.\//g, 'src="/preview-assets/');
    html = html.replace(/href="\.\.\/styles\.css"/g, 'href="/preview-assets/styles.css"');
    // Fix image paths within blog
    html = html.replace(/src="images\//g, 'src="/preview-assets/blog/images/');
    res.send(html);
});

// Publish endpoint
app.post('/publish', (req, res) => {
    try {
        const { slug } = req.body;

        // Update sitemap
        updateSitemap(slug);

        // Git commit and push
        execSync('git add blog/ sitemap.xml', { cwd: ROOT, stdio: 'pipe' });
        execSync(`git commit -m "Add article: ${slug}"`, { cwd: ROOT, stdio: 'pipe' });
        execSync('git push origin main', { cwd: ROOT, stdio: 'pipe' });

        res.json({ success: true, url: `${SITE_URL}/blog/${slug}.html` });
    } catch (err) {
        res.json({ error: err.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════════╗');
    console.log('  ║   Nanny Fifi - Article Studio            ║');
    console.log('  ║                                          ║');
    console.log(`  ║   Open: http://localhost:${PORT}            ║`);
    console.log('  ║   Press Ctrl+C to stop                   ║');
    console.log('  ╚══════════════════════════════════════════╝');
    console.log('');
});
