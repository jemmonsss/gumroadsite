# GitHub Pages Gumroad Storefront

This is a static storefront built for GitHub Pages.  
It gives you:

- A main landing page
- Separate category pages (Discord Bots, Websites, Other Assets)
- Product cards powered by your Gumroad links
- Fast customization from 2 files

## Files You Customize

1. `assets/js/site-config.js`
- Brand name
- Hero text
- Footer text
- Category names, descriptions, and page links

2. `assets/js/products.js`
- Product category
- Gumroad URL
- Title/description/price/tags
- `featured: true` to show on landing page

## Gumroad Link Pulling

Each product card always uses your Gumroad URL for checkout.  
The script also tries to pull extra data from Gumroad oEmbed when possible:

- Title
- Thumbnail
- Author info

If Gumroad blocks that request, your manually-entered fields are used as fallback.

## Add a New Category

1. Add a new category object in `assets/js/site-config.js`.
2. Create a new page file (copy one of the existing category pages).
3. Set `data-category="your-slug"` in the `<body>`.
4. Add products with the same `category` slug in `assets/js/products.js`.

## Deploy To GitHub Pages

1. Create a new GitHub repository.
2. Upload this folder.
3. In GitHub, open `Settings -> Pages`.
4. Set source to `Deploy from a branch`.
5. Pick your branch (usually `main`) and `/ (root)`.
6. Save and wait for GitHub to publish.

## Quick Start Checklist

1. Replace placeholder Gumroad links in `assets/js/products.js`.
2. Update brand and copy in `assets/js/site-config.js`.
3. Commit and push to GitHub.
4. Enable Pages.
