# GitHub Pages Settings - Visual Guide

This guide shows you exactly what the GitHub Pages settings page looks like and what you need to configure.

## How to Access

Navigate to: `https://github.com/sorenhellqvist-cloud/carquiz88/settings/pages`

Or from your repository:
1. Click **"Settings"** tab (top right)
2. Scroll down in the left sidebar
3. Click **"Pages"** (under "Code and automation" section)

## What You'll See

### Build and deployment Section

This is the main section you need to configure:

```
┌─────────────────────────────────────────────────────────────┐
│ Build and deployment                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Source                                                       │
│ ┌────────────────────────────────────────┐                  │
│ │ Deploy from a branch            ▼      │  ← DON'T USE    │
│ └────────────────────────────────────────┘                  │
│                                                              │
│ GitHub Actions pages build and deployment workflow runs     │
│ will be displayed here after they've been created.          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### What to Change

**BEFORE (Current/Wrong Configuration):**
```
Source: [Deploy from a branch ▼]
```
This is the default setting, and it will NOT work with our CI/CD workflow.

**AFTER (Correct Configuration):**
```
Source: [GitHub Actions ▼]
```
You need to click the dropdown and select "GitHub Actions".

### Step-by-Step Visual Instructions

1. **Click the Source dropdown:**
   ```
   ┌────────────────────────────────────────┐
   │ Deploy from a branch            ▼      │ ← Click here
   └────────────────────────────────────────┘
   ```

2. **You'll see these options:**
   ```
   ┌────────────────────────────────────────┐
   │ Deploy from a branch                    │
   │ GitHub Actions                   ✓      │ ← Select this
   └────────────────────────────────────────┘
   ```

3. **After selecting "GitHub Actions":**
   ```
   ┌────────────────────────────────────────┐
   │ GitHub Actions                   ▼      │ ✓ Correct!
   └────────────────────────────────────────┘
   
   Use GitHub Actions for continuous deployment
   ```

4. **The page will automatically save** (no Save button needed for this field)

## What Happens After Configuration

Once you set the Source to "GitHub Actions":

1. ✅ The workflow at `.github/workflows/deploy.yml` will be able to run
2. ✅ Future pushes to `main` will automatically trigger deployment
3. ✅ You can manually trigger deployment from the Actions tab
4. ✅ The "Setup Pages" step in the workflow will succeed

## Current Status

❌ **GitHub Pages is NOT enabled yet** - The workflow fails because this setting hasn't been configured.

Once you complete this configuration, the deployment will work automatically.

## Additional Settings on the Same Page

After enabling GitHub Actions, you'll also see these sections:

### Custom domain (Optional)
```
┌─────────────────────────────────────────────────────────────┐
│ Custom domain                                                │
├─────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐                  │
│ │ timede.se                               │                  │
│ └────────────────────────────────────────┘  [Save]          │
│                                                              │
│ ☐ Enforce HTTPS                                             │
└─────────────────────────────────────────────────────────────┘
```

This is already configured via the `CNAME` file in the repository, but you can verify it here.

## Troubleshooting

**If you don't see the "GitHub Actions" option:**
- You may not have admin access to the repository
- Contact the repository owner to enable this setting

**If the dropdown is grayed out:**
- GitHub Pages may be disabled at the organization level
- Check with your organization administrator

## Next Steps

After configuring this:
1. Go to the **Actions** tab
2. Click on "Deploy to GitHub Pages" workflow
3. Click **"Run workflow"** → Select `main` branch → Click **"Run workflow"**
4. Watch the deployment succeed! 🎉

The site will be live at:
- https://timede.se/
- https://timede.se/carquiz.html
