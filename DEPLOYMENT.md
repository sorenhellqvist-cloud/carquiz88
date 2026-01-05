# Deployment Guide

## Automated CI/CD Pipeline

This application uses GitHub Actions for continuous deployment. Every push to the `main` branch automatically triggers a deployment to GitHub Pages.

### Deployment URLs
- **Root**: `https://timede.se/`
- **Direct access**: `https://timede.se/carquiz.html`

Both URLs serve the same CarQuiz88 application.

## Publishing to timede.se

This application is configured to be deployed to GitHub Pages with a custom domain (timede.se).

### Setup Instructions

#### 1. Enable GitHub Pages

**⚠️ IMPORTANT: This step must be completed by a repository administrator before the CI/CD pipeline will work.**

1. Go to your repository settings: `https://github.com/sorenhellqvist-cloud/carquiz88/settings/pages`
2. Under "Source", select **"GitHub Actions"** from the dropdown (NOT "Deploy from a branch")
3. Save the changes
4. The workflow will automatically deploy when you push to the `main` branch or can be triggered manually

Once enabled, the automated deployment workflow will:
- ✅ Trigger on every push to `main`
- ✅ Build and deploy the static site
- ✅ Update the live site at timede.se
- ✅ Can be manually triggered from the Actions tab

#### 2. Configure Custom Domain (timede.se)

##### On GitHub:
1. Go to repository Settings → Pages
2. Under "Custom domain", enter: `timede.se`
3. Click "Save"
4. Wait for DNS check to complete
5. Enable "Enforce HTTPS" once DNS is verified

##### On Your Domain Registrar (for timede.se):
You need to configure DNS records for timede.se:

**For apex domain (timede.se):**
Add these A records pointing to GitHub Pages:
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**For www subdomain (optional):**
Add a CNAME record:
```
www.timede.se → sorenhellqvist-cloud.github.io
```

**Add CNAME for verification:**
```
_github-pages-challenge-sorenhellqvist-cloud.timede.se → <verification-code>
```
(GitHub will provide the verification code in the Pages settings)

#### 3. Verify Deployment

After DNS propagation (can take up to 24-48 hours):
1. Visit `https://timede.se` or `https://timede.se/carquiz.html` to see your quiz app
2. Verify HTTPS is working
3. Test the quiz functionality
4. Check the Actions tab to confirm successful deployment

### Alternative: Deploy to GitHub Pages without Custom Domain

If you want to use GitHub's default URL instead:
1. Delete the `CNAME` file
2. The app will be available at: `https://sorenhellqvist-cloud.github.io/carquiz88/`

### Manual Deployment

The GitHub Actions workflow (`deploy.yml`) automatically deploys on push to `main`. 
You can also trigger it manually:
1. Go to Actions tab
2. Select "Deploy to GitHub Pages"
3. Click "Run workflow"

### Testing Locally

To test before deployment:
```bash
# Start a local server
python3 -m http.server 8000

# Or use Node.js
npx http-server -p 8000

# Visit http://localhost:8000
```

### Troubleshooting

**DNS not resolving:**
- Check DNS propagation: `nslookup timede.se`
- Wait 24-48 hours for DNS changes to propagate
- Verify A records are correctly configured

**404 Error:**
- Ensure GitHub Pages is enabled
- Check that workflow ran successfully in Actions tab
- Verify branch is set to `main` in Pages settings

**HTTPS not working:**
- DNS must be fully propagated first
- GitHub needs to provision SSL certificate (can take a few hours)
- Check that "Enforce HTTPS" is enabled in Pages settings

### Files for Deployment

- `.github/workflows/deploy.yml` - GitHub Actions workflow for automatic CI/CD
- `CNAME` - Custom domain configuration for timede.se
- `index.html` - Main entry point (served at root and /index.html)
- `carquiz.html` - Alternate entry point (served at /carquiz.html)
- `script.js`, `style.css` - The quiz application code and styling

### CI/CD Workflow Details

The deployment workflow (`.github/workflows/deploy.yml`) performs the following steps:
1. **Checkout**: Clones the repository code
2. **Setup Pages**: Configures GitHub Pages environment
3. **Upload artifact**: Packages all files for deployment
4. **Deploy**: Publishes to GitHub Pages

**Workflow triggers:**
- Automatic: Push to `main` branch
- Manual: Via Actions tab → "Deploy to GitHub Pages" → "Run workflow"
