# Step-by-Step: Configure Amplify to Proxy API Requests

## Step 1: Open Amplify Console

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Select your app "Network"
3. Click on **App settings** in the left sidebar
4. Click on **Rewrites and redirects**

## Step 2: Add Redirect Rule

You should see a table with existing rules. Click the **Edit** button in the top right.

Then add this rule at the TOP of the list:

| # | Source address | Target address | Type | Country |
|---|----------------|----------------|------|---------|
| 1 | `/api/<*>` | `http://51.20.52.19:5000/api/<*>` | 200 (Rewrite) | All |

**Important:**
- Make sure this rule is at the TOP (above any other rules)
- The `<*>` captures everything after `/api/`
- Type must be **200 (Rewrite)** not 301/302 redirect

## Step 3: Save

Click **Save** at the top right.

## Step 4: Test

Wait about 1-2 minutes for the changes to take effect, then refresh your Amplify app URL.

You should now see API requests going to your EC2 backend instead of 404.

---

## Troubleshooting

### Still getting 404?

1. **Check backend is running on EC2:**
   ```bash
   ssh ubuntu@51.20.52.19
   pm2 status
   ```

2. **Test API directly on EC2:**
   ```bash
   curl http://localhost:5000/api/health
   ```

3. **Check security group:**
   - EC2 Security Group must allow inbound traffic on port 5000 from Amplify

### Getting "Failed to fetch"?

This means Amplify can't reach EC2. Check:
- EC2 is running
- Security group allows port 5000
- Backend is running with `pm2 status`

### Getting CORS errors?

The Nginx/config should handle this. For now, make sure your backend has CORS enabled (it does in our config).

---

## Alternative: Quick Test Without Amplify Redirect

If the redirect isn't working, you can temporarily change the frontend to call EC2 directly (for testing only):

In Amplify environment variables, add:
- `VITE_API_URL` = `http://51.20.52.19:5000`

But this will cause Mixed Content errors (HTTPS → HTTP) which browsers block.

**The proper solution is the Amplify redirect above.**
