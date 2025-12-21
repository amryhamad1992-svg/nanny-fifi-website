# Nanny Fifi Website

Parent coaching website for Sofia Kavouri (Nanny Fifi).

**Live Site:** https://nannyfifi.com

---

## Quick Overview

| Item | Details |
|------|---------|
| **Owner** | Sofia Kavouri |
| **Email** | contact.nannyfifi@gmail.com |
| **Hosting** | GitHub Pages |
| **Domain** | nannyfifi.com |
| **Repository** | github.com/amryhamad1992-svg/nanny-fifi-website |

---

## Tech Stack

- HTML, CSS, JavaScript (static site)
- GitHub Pages hosting
- Stripe (payments)
- Calendly (booking)
- Formspree (contact form)
- Google Analytics (tracking)

---

## Pages

| File | Description |
|------|-------------|
| index.html | Main landing page |
| behaviour-emotions.html | Behaviour & Emotions service page |
| routines-daily-life.html | Sleep, Meals & Routines service page |
| confidence-transitions.html | Confidence & Transitions service page |
| parental-wellbeing.html | Parental Wellbeing service page |
| thank-you.html | Post-payment confirmation page |

---

## Pricing & Services

| Service | Price (GBP) | Stripe Link |
|---------|-------------|-------------|
| Discovery Call | FREE | Calendly embed |
| Single Session (60 min) | 85 GBP | https://buy.stripe.com/28EfZi3dZ9Blf3d2NCe7m00 |
| 3-Session Package | 225 GBP | https://buy.stripe.com/eVq7sM29VbJtcV53RGe7m01 |
| Email Coaching (6 exchanges) | 45 GBP | https://buy.stripe.com/eVq6oI8yjbJt2grfAoe7m02 |

---

## Integrations

### Calendly
- **Account Email:** contact.nannyfifi@gmail.com
- **30-min Discovery Call:** https://calendly.com/contact-nannyfifi/30min
- **60-min Coaching Session:** https://calendly.com/contact-nannyfifi/60-minute-coaching-session

### Stripe
- Payment links redirect to Calendly (for paid sessions) or thank-you page (for email coaching)
- Stripe account under Sofia's email

### Formspree (Contact Form)
- **Endpoint:** https://formspree.io/f/xlgrbpod
- Submissions go to contact.nannyfifi@gmail.com

### Google Analytics
- **Tracking ID:** G-HJFNH2HBF2
- Added to all pages

### Google Search Console
- Verified with google3239d655610bf37b.html
- Sitemap submitted: sitemap.xml

---

## SEO Files

| File | Purpose |
|------|---------|
| sitemap.xml | Lists all pages for search engines |
| robots.txt | Crawling instructions |
| google3239d655610bf37b.html | Google Search Console verification |

---

## Images

Located in /images/ folder:
- logo.jpg - Pram logo (used in navbar and footer)
- sofia-profile.jpg - Sofia's headshot (hero section)
- sensory-play.jpg - Sensory play photo (about section)

---

## Deployment

The site auto-deploys via GitHub Pages when changes are pushed to main branch.

```bash
git add -A
git commit -m "Your message"
git push origin main
```

Changes typically go live within 1-2 minutes.

---

## Key Styles

CSS variables in styles.css:
- Primary color: #E8A598 (soft coral/peach)
- Text color: #4A3F3A (warm dark brown)
- Text light: #7D6E66 (lighter brown - used for nav links and logo text)
- Background: #FFFAF8 (warm white)

---

## Customer Flow

1. **Discovery Call (Free)**
   - User clicks "Book Free Call" -> Calendly 30-min embed

2. **Paid Session**
   - User clicks "Book Session" -> Stripe payment -> Calendly 60-min booking

3. **Email Coaching**
   - User clicks "Book Session" -> Stripe payment -> Thank You page

4. **Contact Form**
   - User fills form -> Formspree -> Email to contact.nannyfifi@gmail.com

---

## Social Media

- **Instagram:** https://instagram.com/nanny_fifi

---

*Last updated: December 2024*
