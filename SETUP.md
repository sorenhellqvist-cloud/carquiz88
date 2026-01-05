# Quick Setup Guide for CI/CD

This guide walks you through the one-time setup required to enable automated deployment for carquiz88.

## Prerequisites

- Repository administrator access
- DNS access for timede.se domain (if using custom domain)

## Step 1: Enable GitHub Pages

**This is the critical step that enables the CI/CD pipeline.**

1. Navigate to repository settings:
   ```
   https://github.com/sorenhellqvist-cloud/carquiz88/settings/pages
   ```

2. Under **"Build and deployment"** section:
   - **Source**: Select **"GitHub Actions"** from the dropdown
   - ⚠️ Do NOT select "Deploy from a branch"
   
3. Click **"Save"**

4. The GitHub Actions workflow will now be enabled and ready to deploy

## Step 2: Configure DNS (for custom domain)

If you want to use the custom domain `timede.se`, configure the following DNS records with your domain registrar:

### A Records (for apex domain)
Point timede.se to GitHub Pages servers:
```
Type: A     Name: @     Value: 185.199.108.153
Type: A     Name: @     Value: 185.199.109.153
Type: A     Name: @     Value: 185.199.110.153
Type: A     Name: @     Value: 185.199.111.153
```

### CNAME Record (for www subdomain - optional)
```
Type: CNAME     Name: www     Value: sorenhellqvist-cloud.github.io
```

## Step 3: Configure Custom Domain in GitHub

1. Go back to repository Settings → Pages
2. Under **"Custom domain"**, enter: `timede.se`
3. Click **"Save"**
4. Wait for DNS check to complete (may take a few minutes to hours)
5. Once verified, enable **"Enforce HTTPS"**

## Step 4: Test the Deployment

### Automatic Deployment
1. Make any change to the `main` branch
2. Push the change
3. Go to the **Actions** tab: https://github.com/sorenhellqvist-cloud/carquiz88/actions
4. Watch the "Deploy to GitHub Pages" workflow run
5. Once complete (green checkmark), visit:
   - https://timede.se
   - https://timede.se/carquiz.html

### Manual Deployment
1. Go to Actions tab: https://github.com/sorenhellqvist-cloud/carquiz88/actions
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow" button
4. Select the `main` branch
5. Click the green "Run workflow" button
6. Watch the workflow execute

## Step 5: Verify Everything Works

After deployment completes:
- ✅ Visit https://timede.se - should load the quiz
- ✅ Visit https://timede.se/carquiz.html - should load the quiz
- ✅ HTTPS should be working (padlock icon in browser)
- ✅ Quiz functionality should work (timer, questions, scoring)

## Troubleshooting

### "Setup Pages" step fails in workflow
- **Cause**: GitHub Pages is not enabled or not set to "GitHub Actions" source
- **Solution**: Follow Step 1 above

### DNS not resolving
- **Cause**: DNS changes haven't propagated yet
- **Solution**: Wait 24-48 hours, verify DNS records are correct

### 404 Error on site
- **Cause**: Workflow hasn't run successfully yet
- **Solution**: Check Actions tab for workflow status, re-run if needed

### HTTPS not working
- **Cause**: GitHub is still provisioning SSL certificate
- **Solution**: Wait a few hours after DNS is verified, then enable "Enforce HTTPS"

## What Happens After Setup?

Once setup is complete, the CI/CD pipeline works automatically:

1. **Developer pushes code** to `main` branch
2. **GitHub Actions triggers** the deployment workflow automatically
3. **Workflow builds and deploys** the static site to GitHub Pages
4. **Site updates** at https://timede.se within 1-2 minutes
5. **Users see changes** immediately

No manual intervention needed! 🎉

## Additional Resources

- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment documentation
- [README.md](README.md) - Project overview and features
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
