# Amplify Rewrites and Redirects Configuration

## Step 1: Configure Amplify Redirect Rule

In your Amplify console:

1. Go to **App settings → Rewrites and redirects**
2. Click **Edit**
3. Add this rule at the top:

| Source address | Target address | Type |
|----------------|---------------|------|
| `/api/<*>` | `https://api.yourdomain.com/<*>` | 200 (Rewrite) |

**Note:** Replace `api.yourdomain.com` with your actual API domain (see below for HTTPS setup).

---

## Quick Fix (HTTP only - not recommended for production):

If you just want to test quickly:

| Source address | Target address | Type |
|----------------|---------------|------|
| `/api/<*>` | `http://51.20.52.19:5000/<*>` | 200 (Rewrite) |

---

## Recommended: Set up HTTPS on EC2

See the nginx config below for the recommended production setup.
