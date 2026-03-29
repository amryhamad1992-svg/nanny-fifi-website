#!/usr/bin/env node

/**
 * Nanny Fifi - Article Generator
 *
 * Turns Instagram captions (with optional images) into full SEO blog articles.
 *
 * Usage:
 *   node generate-article.js
 *   node generate-article.js --caption "Your caption here"
 *   node generate-article.js --caption "Caption" --image "path/to/image.jpg"
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// ── Configuration ──────────────────────────────────────────────────────────────

const BLOG_DIR = path.join(__dirname, 'blog');
const BLOG_IMAGES_DIR = path.join(BLOG_DIR, 'images');
const SITEMAP_PATH = path.join(__dirname, 'sitemap.xml');
const SITE_URL = 'https://nannyfifi.com';

// Load API key from .env file or environment
function getApiKey() {
    // Check environment first
    if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;

    // Try .env file
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const match = envContent.match(/ANTHROPIC_API_KEY=(.+)/);
        if (match) return match[1].trim();
    }

    return null;
}

// ── Helper Functions ───────────────────────────────────────────────────────────

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/['']/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 60);
}

function getToday() {
    return new Date().toISOString().split('T')[0];
}

function getMonthYear() {
    const d = new Date();
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

async function ask(rl, question) {
    return new Promise(resolve => rl.question(question, resolve));
}

async function askMultiline(rl, question) {
    console.log(question);
    console.log('  (Press Enter twice on an empty line when done)\n');

    return new Promise(resolve => {
        const lines = [];
        let emptyCount = 0;

        const onLine = (line) => {
            if (line.trim() === '') {
                emptyCount++;
                if (emptyCount >= 1 && lines.length > 0) {
                    rl.removeListener('line', onLine);
                    resolve(lines.join('\n'));
                    return;
                }
            } else {
                emptyCount = 0;
            }
            lines.push(line);
        };

        rl.on('line', onLine);
    });
}

// ── Image Processing ───────────────────────────────────────────────────────────

async function processImage(imagePath) {
    if (!imagePath || !fs.existsSync(imagePath)) return null;

    // Ensure blog/images directory exists
    if (!fs.existsSync(BLOG_IMAGES_DIR)) {
        fs.mkdirSync(BLOG_IMAGES_DIR, { recursive: true });
    }

    const ext = path.extname(imagePath).toLowerCase();
    const baseName = slugify(path.basename(imagePath, ext));
    const webpName = `${baseName}.webp`;
    const webpPath = path.join(BLOG_IMAGES_DIR, webpName);

    try {
        const sharp = require('sharp');
        await sharp(imagePath)
            .webp({ quality: 80 })
            .resize({ width: 1200, withoutEnlargement: true })
            .toFile(webpPath);

        console.log(`  Converted image to WebP: blog/images/${webpName}`);
        return { webpName, webpPath, relativePath: `images/${webpName}` };
    } catch (err) {
        // Fallback: just copy the original
        const copyName = `${baseName}${ext}`;
        const copyPath = path.join(BLOG_IMAGES_DIR, copyName);
        fs.copyFileSync(imagePath, copyPath);
        console.log(`  Copied image: blog/images/${copyName}`);
        return { webpName: copyName, webpPath: copyPath, relativePath: `images/${copyName}` };
    }
}

// ── AI Content Generation ──────────────────────────────────────────────────────

async function generateArticle(apiKey, caption, imageBase64) {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });

    const systemPrompt = `You are Sofia Kavouri (Nanny Fifi), a parent coach with 15+ years of childcare experience and a BA in Early Childhood from The Open University. You write in warm, supportive British English (use "whilst", "behaviour", "personalised", "colour", etc.).

Your task: Turn an Instagram caption into a full SEO blog article.

Rules:
1. Write 900-1200 words of genuinely helpful parenting advice
2. Use a warm, conversational tone — like talking to a friend over tea
3. Include practical, actionable tips parents can use right away
4. Structure with clear headings (H2 and H3)
5. Naturally weave in relevant search keywords throughout
6. End with encouragement and a warm sign-off

Return your response as JSON with this exact structure (no markdown, just raw JSON):
{
    "title": "Article Title: Subtitle If Needed",
    "metaDescription": "150-160 character description with target keywords",
    "slug": "url-friendly-slug",
    "readTime": "5 min read",
    "keywords": "comma, separated, target, keywords",
    "content": "<h2>First Section</h2><p>Content...</p><h2>Second Section</h2><p>More content...</p>",
    "relatedService": "behaviour-emotions|routines-daily-life|confidence-transitions|parental-wellbeing|shop",
    "relatedServiceText": "Text for the internal link to the related service page"
}

For the content field, use only these HTML tags: h2, h3, p, ul, ol, li, strong, em, a
For internal links in the content, use these paths:
- ../behaviour-emotions.html
- ../routines-daily-life.html
- ../confidence-transitions.html
- ../parental-wellbeing.html
- ../shop.html
- ../index.html#book`;

    const userContent = imageBase64
        ? [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
            { type: 'text', text: `Turn this Instagram post into a full SEO blog article:\n\nCaption: ${caption || '(See image for content)'}` }
          ]
        : [{ type: 'text', text: `Turn this Instagram post into a full SEO blog article:\n\nCaption: ${caption}` }];

    const response = await client.messages.create({
        model: imageBase64 ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
    });

    const text = response.content[0].text;
    // Extract JSON from response (handle possible markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI did not return valid JSON');
    const result = JSON.parse(jsonMatch[0]);
    return result;
}

// ── HTML Template ──────────────────────────────────────────────────────────────

function buildHTML(article, imageInfo) {
    const today = getToday();
    const monthYear = getMonthYear();
    const canonicalUrl = `${SITE_URL}/blog/${article.slug}.html`;

    const heroImage = imageInfo
        ? `\n            <img src="${imageInfo.relativePath}" alt="${article.title}" style="width:100%; max-width:750px; border-radius:var(--radius-lg); margin: 1.5rem auto 0; display:block;">`
        : '';

    const ogImage = imageInfo
        ? `${SITE_URL}/blog/${imageInfo.relativePath}`
        : `${SITE_URL}/images/sofia-profile.jpg`;

    // Build CTA based on related service
    const ctaMap = {
        'behaviour-emotions': { heading: 'Need Personalised Support?', text: 'Every child is different. Book a free 30-minute discovery call and let\'s talk about what\'s going on with your little one.', link: '../index.html#book', btnText: 'Book Your Free Discovery Call' },
        'routines-daily-life': { heading: 'Struggling With Routines?', text: 'Every family is different. Book a free discovery call and I\'ll help you create routines that actually work.', link: '../index.html#book', btnText: 'Book Your Free Discovery Call' },
        'confidence-transitions': { heading: 'Need Help With Transitions?', text: 'Starting nursery, new sibling, or a big move? Book a free discovery call and let\'s create a plan together.', link: '../index.html#book', btnText: 'Book Your Free Discovery Call' },
        'parental-wellbeing': { heading: 'You Don\'t Have to Do This Alone', text: 'Parenting is hard, and asking for help is a sign of strength. Book a free discovery call and let\'s talk.', link: '../index.html#book', btnText: 'Book Your Free Discovery Call' },
        'shop': { heading: 'Want the Complete Guide?', text: 'My Baby Led Weaning Guide has 50+ recipes, meal plans, allergen trackers, and everything you need.', link: '../shop.html', btnText: 'Visit the Shop' },
    };

    const cta = ctaMap[article.relatedService] || ctaMap['behaviour-emotions'];

    return `<!DOCTYPE html>
<html lang="en-GB">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-HJFNH2HBF2"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-HJFNH2HBF2');
    </script>
    <meta name="description" content="${article.metaDescription.replace(/"/g, '&quot;')}">
    <meta name="keywords" content="${article.keywords}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonicalUrl}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:title" content="${article.title.replace(/"/g, '&quot;')} | Nanny Fifi">
    <meta property="og:description" content="${article.metaDescription.replace(/"/g, '&quot;')}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:site_name" content="Nanny Fifi">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${article.title.replace(/"/g, '&quot;')} | Nanny Fifi">
    <meta name="twitter:description" content="${article.metaDescription.replace(/"/g, '&quot;')}">
    <meta name="twitter:image" content="${ogImage}">
    <title>${article.title} | Nanny Fifi</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../styles.css">
    <link rel="icon" type="image/jpeg" href="../images/logo.webp">
    <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"Article","headline":"${article.title.replace(/"/g, '\\"')}","author":{"@type":"Person","name":"Sofia Kavouri","jobTitle":"Parent Coach","url":"${SITE_URL}"},"publisher":{"@type":"Organization","name":"Nanny Fifi","url":"${SITE_URL}"},"datePublished":"${today}","dateModified":"${today}","description":"${article.metaDescription.replace(/"/g, '\\"')}","mainEntityOfPage":"${canonicalUrl}"}
    </script>
    <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"${SITE_URL}/"},{"@type":"ListItem","position":2,"name":"Articles","item":"${SITE_URL}/blog/"},{"@type":"ListItem","position":3,"name":"${article.title.replace(/"/g, '\\"')}","item":"${canonicalUrl}"}]}
    </script>
    <style>
        .article-hero { padding: 120px 0 60px; background: linear-gradient(135deg, var(--color-bg) 0%, var(--color-secondary) 100%); }
        .article-hero .back-link { display: inline-block; margin-bottom: 1.5rem; color: var(--color-primary-dark); text-decoration: none; font-weight: 500; }
        .article-hero .back-link:hover { text-decoration: underline; }
        .article-hero h1 { font-family: var(--font-heading); font-size: 2.5rem; color: var(--color-text); margin-bottom: 1rem; }
        .article-meta { color: var(--color-text-light); font-size: 0.95rem; }
        .article-body { padding: 3rem 0; max-width: 750px; margin: 0 auto; }
        .article-body h2 { font-family: var(--font-heading); font-size: 1.75rem; color: var(--color-text); margin: 2.5rem 0 1rem; }
        .article-body h3 { font-family: var(--font-heading); font-size: 1.35rem; color: var(--color-text); margin: 2rem 0 0.75rem; }
        .article-body p { color: var(--color-text); line-height: 1.8; margin-bottom: 1.25rem; font-size: 1.05rem; }
        .article-body ul, .article-body ol { color: var(--color-text); line-height: 1.8; margin-bottom: 1.25rem; padding-left: 1.5rem; }
        .article-body li { margin-bottom: 0.5rem; }
        .article-body strong { color: var(--color-text); }
        .article-body a { color: var(--color-primary-dark); text-decoration: underline; }
        .article-body a:hover { color: var(--color-primary); }
        .article-cta { background: var(--color-secondary); border-radius: var(--radius-lg); padding: 2.5rem; text-align: center; margin: 3rem 0; }
        .article-cta h3 { font-family: var(--font-heading); margin-bottom: 1rem; }
        .article-cta p { color: var(--color-text-light); margin-bottom: 1.5rem; }
        .article-hero-img { width: 100%; max-width: 750px; border-radius: 12px; margin: 1.5rem auto 0; display: block; }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="container nav-container">
            <a href="../index.html" class="logo">
                <img src="../images/logo.webp" alt="Nanny Fifi" class="logo-img">
                <span class="logo-text">Nanny Fifi</span>
            </a>
            <button class="mobile-menu-btn" aria-label="Toggle menu"><span></span><span></span><span></span></button>
            <ul class="nav-links">
                <li><a href="../index.html#about">About</a></li>
                <li><a href="../index.html#services">Services</a></li>
                <li><a href="../shop.html">Shop</a></li>
                <li><a href="../love-language-quiz.html">Love Language Quiz</a></li>
                <li><a href="../index.html#testimonials">Testimonials</a></li>
                <li><a href="../index.html#book" class="btn btn-primary nav-cta">Book a Call</a></li>
            </ul>
        </div>
    </nav>

    <header class="article-hero">
        <div class="container">
            <a href="../index.html" class="back-link">&larr; Back to Home</a>
            <h1>${article.title}</h1>
            <div class="article-meta">
                <span>By Sofia Kavouri</span> &middot; <span>${monthYear}</span> &middot; <span>${article.readTime}</span>
            </div>${heroImage}
        </div>
    </header>

    <main class="section">
        <div class="container">
            <div class="article-body">
                ${article.content}

                <div class="article-cta">
                    <h3>${cta.heading}</h3>
                    <p>${cta.text}</p>
                    <a href="${cta.link}" class="btn btn-primary btn-large">${cta.btnText}</a>
                </div>
            </div>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-brand">
                    <a href="../index.html" class="logo"><span class="logo-icon">&#x1f9f8;</span><span class="logo-text">Nanny Fifi</span></a>
                    <p>Helping parents raise happy, confident children through gentle guidance and expert support.</p>
                </div>
                <div class="footer-links">
                    <div class="footer-column">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><a href="../index.html#about">About</a></li>
                            <li><a href="../index.html#services">Services</a></li>
                            <li><a href="../love-language-quiz.html">Love Language Quiz</a></li>
                            <li><a href="../index.html#book">Book a Call</a></li>
                        </ul>
                    </div>
                    <div class="footer-column">
                        <h4>Services</h4>
                        <ul>
                            <li><a href="../behaviour-emotions.html">Behaviour & Emotions</a></li>
                            <li><a href="../routines-daily-life.html">Sleep, Meals & Routines</a></li>
                            <li><a href="../confidence-transitions.html">Confidence & Transitions</a></li>
                            <li><a href="../parental-wellbeing.html">Parental Wellbeing</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="footer-bottom"><p>&copy; 2024 Nanny Fifi. All rights reserved.</p></div>
        </div>
    </footer>
    <script src="../script.js"></script>
    <div id="cookie-consent" style="display:none; position:fixed; bottom:0; left:0; right:0; background:#4A3F3A; color:#fff; padding:1rem 1.5rem; z-index:10000; font-family:'Inter',sans-serif; font-size:0.9rem;">
        <div style="max-width:1200px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.75rem;">
            <p style="margin:0; flex:1; min-width:250px;">We use cookies to analyse site traffic and improve your experience. By clicking &ldquo;Accept&rdquo;, you consent to our use of cookies.</p>
            <div style="display:flex; gap:0.5rem;">
                <button onclick="acceptCookies()" style="background:#E8A598; color:#4A3F3A; border:none; padding:0.5rem 1.25rem; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.85rem;">Accept</button>
                <button onclick="declineCookies()" style="background:transparent; color:#fff; border:1px solid #fff; padding:0.5rem 1.25rem; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.85rem;">Decline</button>
            </div>
        </div>
    </div>
    <script>
    function acceptCookies(){document.cookie="cookie_consent=accepted;path=/;max-age=31536000";document.getElementById('cookie-consent').style.display='none';}
    function declineCookies(){document.cookie="cookie_consent=declined;path=/;max-age=31536000";document.getElementById('cookie-consent').style.display='none';window['ga-disable-G-HJFNH2HBF2']=true;}
    (function(){var c=document.cookie.match(/cookie_consent=([^;]+)/);if(c){if(c[1]==='declined')window['ga-disable-G-HJFNH2HBF2']=true;}else{document.getElementById('cookie-consent').style.display='block';}})();
    </script>
</body>
</html>`;
}

// ── Sitemap Update ─────────────────────────────────────────────────────────────

function updateSitemap(slug) {
    const today = getToday();
    const newEntry = `    <url>
        <loc>${SITE_URL}/blog/${slug}.html</loc>
        <lastmod>${today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>`;

    let sitemap = fs.readFileSync(SITEMAP_PATH, 'utf-8');

    // Check if already in sitemap
    if (sitemap.includes(`/blog/${slug}.html`)) {
        console.log('  Article already in sitemap');
        return;
    }

    sitemap = sitemap.replace('</urlset>', `${newEntry}\n</urlset>`);
    fs.writeFileSync(SITEMAP_PATH, sitemap);
    console.log('  Sitemap updated');
}

// ── Git Push ───────────────────────────────────────────────────────────────────

function gitPush(slug, title) {
    try {
        execSync('git add blog/ sitemap.xml', { cwd: __dirname, stdio: 'pipe' });
        execSync(`git commit -m "Add article: ${title}"`, { cwd: __dirname, stdio: 'pipe' });
        execSync('git push origin main', { cwd: __dirname, stdio: 'pipe' });
        return true;
    } catch (err) {
        console.error('  Git push failed:', err.message);
        return false;
    }
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n  ╔══════════════════════════════════════╗');
    console.log('  ║   Nanny Fifi - Article Generator     ║');
    console.log('  ╚══════════════════════════════════════╝\n');

    // Check API key
    const apiKey = getApiKey();
    if (!apiKey) {
        console.log('  No Anthropic API key found.\n');
        console.log('  Set it up in one of these ways:');
        console.log('  1. Create a .env file with: ANTHROPIC_API_KEY=sk-ant-...');
        console.log('  2. Set environment variable: export ANTHROPIC_API_KEY=sk-ant-...\n');
        process.exit(1);
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    // Parse command line args
    const args = process.argv.slice(2);
    let caption = '';
    let imagePath = '';

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--caption' && args[i+1]) caption = args[++i];
        if (args[i] === '--image' && args[i+1]) imagePath = args[++i];
    }

    // Interactive mode if no args
    if (!caption && !imagePath) {
        console.log('  What are you working with?\n');
        console.log('  1. Caption only (text post)');
        console.log('  2. Caption + image');
        console.log('  3. Image only\n');

        const choice = await ask(rl, '  Choose (1/2/3): ');
        console.log('');

        if (choice === '1' || choice === '2') {
            caption = await askMultiline(rl, '  Paste the Instagram caption:');
        }

        if (choice === '2' || choice === '3') {
            imagePath = (await ask(rl, '  Image path (drag file here): ')).trim().replace(/['"]/g, '');
        }
    }

    if (!caption && !imagePath) {
        console.log('\n  Nothing to work with. Provide a caption or image.\n');
        rl.close();
        process.exit(1);
    }

    // Process image if provided
    console.log('\n  Generating article...\n');

    let imageBase64 = null;
    let imageInfo = null;

    if (imagePath && fs.existsSync(imagePath)) {
        console.log('  Processing image...');
        imageBase64 = fs.readFileSync(imagePath).toString('base64');
        imageInfo = await processImage(imagePath);
    }

    // Generate article with AI
    console.log('  Calling AI...');
    const article = await generateArticle(apiKey, caption, imageBase64);

    console.log(`\n  Title: ${article.title}`);
    console.log(`  Slug:  ${article.slug}`);
    console.log(`  Keywords: ${article.keywords}\n`);

    // Build and save HTML
    const html = buildHTML(article, imageInfo);
    const filePath = path.join(BLOG_DIR, `${article.slug}.html`);

    // Ensure blog directory exists
    if (!fs.existsSync(BLOG_DIR)) {
        fs.mkdirSync(BLOG_DIR, { recursive: true });
    }

    fs.writeFileSync(filePath, html);
    console.log(`  Article saved: blog/${article.slug}.html`);

    // Update sitemap
    updateSitemap(article.slug);

    // Preview URL
    console.log(`\n  Preview: ${SITE_URL}/blog/${article.slug}.html\n`);

    // Ask to push
    const pushAnswer = await ask(rl, '  Push to GitHub and make it live? (y/n): ');

    if (pushAnswer.toLowerCase() === 'y') {
        console.log('\n  Pushing to GitHub...');
        if (gitPush(article.slug, article.title)) {
            console.log(`\n  Live at: ${SITE_URL}/blog/${article.slug}.html\n`);
        }
    } else {
        console.log('\n  Not pushed. You can push manually later with:');
        console.log('  git add blog/ sitemap.xml && git commit -m "Add article" && git push origin main\n');
    }

    rl.close();
}

main().catch(err => {
    console.error('\n  Error:', err.message);
    process.exit(1);
});
