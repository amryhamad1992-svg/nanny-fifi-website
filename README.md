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
- Stripe (payments - one-time and subscriptions)
- Calendly (booking)
- Formspree (contact form)
- Google Analytics (tracking)

---

## Pages

| File | Description |
|------|-------------|
| index.html | Main landing page with services and pricing |
| love-language-quiz.html | Interactive quiz to discover child's love language |
| behaviour-emotions.html | Behaviour & Emotions service page |
| routines-daily-life.html | Sleep, Meals & Routines service page |
| confidence-transitions.html | Confidence & Transitions service page |
| parental-wellbeing.html | Parental Wellbeing service page |
| thank-you.html | Post-payment confirmation (one-time purchases) |
| thank-you-subscription.html | Subscription confirmation page |

---

## Pricing & Services

| Service | Price (GBP) | Type | Stripe Link |
|---------|-------------|------|-------------|
| Discovery Call | FREE | Calendly | Calendly embed |
| Single Session (60 min) | £85 | One-time | https://buy.stripe.com/28EfZi3dZ9Blf3d2NCe7m00 |
| 3-Session Package | £225 | One-time | https://buy.stripe.com/eVq7sM29VbJtcV53RGe7m01 |
| Email Coaching (6 exchanges) | £45 | One-time | https://buy.stripe.com/eVq6oI8yjbJt2grfAoe7m02 |
| **Monthly Support** | £59.99/month | Subscription | https://buy.stripe.com/aFaaEY29V4h18EP2NCe7m03 |

### Monthly Support Subscription
- Unlimited email support
- Up to 2 check-in calls per month
- Priority response times
- Cancel anytime
- Marked as "Most Popular" on pricing section

---

## Love Language Quiz

Interactive quiz to help parents discover their child's love language. Based on Dr. Gary Chapman's 5 Love Languages concept.

**URL:** https://nannyfifi.com/love-language-quiz.html

**Features:**
- 12 questions with 5 options each (one for each love language)
- Progress bar and navigation
- Instant results with percentage breakdown
- Personalised activity suggestions for each love language
- Discovery call CTA after results
- Share buttons with @nanny_fifi branding:
  - Instagram (copies caption with hashtags)
  - WhatsApp
  - Facebook
  - Copy link
- Google Analytics event tracking
- Mobile-responsive design

**The 5 Love Languages:**
1. Physical Touch - hugs, cuddles, physical closeness
2. Words of Affirmation - verbal praise and encouragement
3. Quality Time - undivided attention and presence
4. Receiving Gifts - thoughtful tokens and surprises
5. Acts of Service - helping and doing things for them

**Instagram Share Caption:**
```
Just discovered my child's love language is [RESULT]!

Understanding how your little one feels most loved is a game changer for connection.

Take the free 3-min quiz to discover yours: nannyfifi.com/love-language-quiz

@nanny_fifi

#nannyfifi #lovelanguages #parentingtips #mumlife #gentleparenting #toddlermum #parentcoach
```

---

## Integrations

### Calendly
- **Account Email:** contact.nannyfifi@gmail.com
- **30-min Discovery Call:** https://calendly.com/contact-nannyfifi/30min
- **60-min Coaching Session:** https://calendly.com/contact-nannyfifi/60-minute-coaching-session

### Stripe
- Payment links for one-time purchases redirect to Calendly or thank-you page
- Subscription (Monthly Support) redirects to thank-you-subscription.html
- Stripe account under Sofia's email

### Formspree (Contact Form)
- **Endpoint:** https://formspree.io/f/xlgrbpod
- Submissions go to contact.nannyfifi@gmail.com

### Google Analytics
- **Tracking ID:** G-HJFNH2HBF2
- Added to all pages
- Tracks quiz completions and share button clicks

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
- logo.jpg - Nanny Fifi logo (NF with lily design) - used in navbar, footer, and favicon
- sofia-profile.jpg - Sofia's headshot (hero section)
- sensory-play.jpg - Sensory play photo (about section)

**Favicon:** All pages use logo.jpg as the browser tab icon.

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
- Text light: #7D6E66 (lighter brown)
- Background: #FFFAF8 (warm white)

Pricing grid: 5 columns for 5 pricing options (responsive to stack on mobile)

---

## Customer Flow

1. **Discovery Call (Free)**
   - User clicks "Book Free Call" -> Calendly 30-min embed

2. **Paid Session (One-time)**
   - User clicks "Book Session" -> Stripe payment -> Calendly 60-min booking

3. **Email Coaching (One-time)**
   - User clicks "Book Session" -> Stripe payment -> Thank You page

4. **Monthly Support (Subscription)**
   - User clicks "Subscribe Now" -> Stripe subscription -> Thank You Subscription page
   - Sofia sends welcome email within 24 hours

5. **Love Language Quiz**
   - User completes quiz -> Results with activities -> Discovery call CTA

6. **Contact Form**
   - User fills form -> Formspree -> Email to contact.nannyfifi@gmail.com

---

## Social Media

- **Instagram:** https://instagram.com/nanny_fifi
- **Handle:** @nanny_fifi

---

*Last updated: December 2024*
