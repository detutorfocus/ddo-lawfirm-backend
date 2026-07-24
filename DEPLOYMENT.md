# ============================================================
# D.D. ONIETAN (SAN) & CO. — DEPLOYMENT GUIDE
# Full-Stack Enterprise Law Firm Platform
# ============================================================

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                  PRODUCTION ARCHITECTURE                     │
├─────────────────┬──────────────────┬────────────────────────┤
│   FRONTEND      │    BACKEND API   │     INFRASTRUCTURE     │
│   Next.js       │    tRPC + Next   │                        │
│   Vercel CDN    │    Railway/Render │   Neon PostgreSQL      │
│   Global Edge   │    Node.js 18+   │   AWS S3 + CloudFront  │
│                 │                  │   Resend Email         │
└─────────────────┴──────────────────┴────────────────────────┘
```

---

## STEP 1 — DATABASE SETUP (Neon PostgreSQL)

### 1.1 Create Neon Account
1. Go to https://neon.tech → Sign up (free tier available)
2. Create a new project: "onietan-lawfirm"
3. Choose region: **EU West** or **US East** (closest to Nigeria)
4. Copy the connection string → looks like:
   ```
   postgresql://user:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 1.2 Run Migrations
```bash
# Install dependencies
npm install

# Set your DATABASE_URL in .env.local
echo 'DATABASE_URL="postgresql://..."' > .env.local

# Generate Prisma client
npm run prisma:generate

# Run migrations (creates all tables)
npm run prisma:migrate

# Seed with initial data
npm run prisma:seed
```

### 1.3 Verify Database
```bash
npm run prisma:studio
# Opens browser UI at http://localhost:5555
# Verify all tables and seed data exist
```

---

## STEP 2 — AWS S3 SETUP (Document Storage)

### 2.1 Create S3 Bucket
```
Bucket name: onietan-law-documents
Region: eu-west-1 (Ireland) — closer to Nigeria
Block public access: YES (all blocked — use presigned URLs only)
Versioning: Enabled (for document history)
Server-side encryption: AES-256
```

### 2.2 Bucket Policy (restrict to your app only)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPresignedUpload",
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/onietan-app" },
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::onietan-law-documents/*"
    }
  ]
}
```

### 2.3 IAM User for App
```
User name: onietan-app-s3
Permissions: AmazonS3FullAccess (scope to bucket in production)
Access type: Programmatic access only
→ Save: Access Key ID + Secret Access Key → paste into .env
```

### 2.4 CloudFront Distribution (optional but recommended)
- Create distribution → Origin: onietan-law-documents.s3.eu-west-1.amazonaws.com
- Restrict bucket access: Yes (OAC)
- Signed URLs: Yes (for secure document downloads)
- Copy CloudFront domain → AWS_CLOUDFRONT_URL in .env

---

## STEP 3 — EMAIL SETUP (Resend)

### 3.1 Create Resend Account
1. Go to https://resend.com → Sign up
2. Add domain: **ddonietanandco.com**
3. Add DNS records (Resend provides them — add to your domain registrar)
4. Wait for verification (usually < 1 hour)
5. Create API key → paste into RESEND_API_KEY

### 3.2 Test Emails
```bash
node -e "
const { Resend } = require('resend');
const r = new Resend(process.env.RESEND_API_KEY);
r.emails.send({ from: 'test@ddonietanandco.com', to: 'your@email.com', subject: 'Test', html: '<p>Test</p>' }).then(console.log);
"
```

---

## STEP 4 — DEPLOY BACKEND (Railway)

### 4.1 Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### 4.2 Create Railway Project
```bash
cd onietan-backend
railway init
# Project name: onietan-lawfirm-api
```

### 4.3 Set Environment Variables on Railway
```bash
railway variables set DATABASE_URL="postgresql://..."
railway variables set NEXTAUTH_SECRET="$(openssl rand -base64 32)"
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set JWT_REFRESH_SECRET="$(openssl rand -base64 32)"
railway variables set RESEND_API_KEY="re_..."
railway variables set AWS_ACCESS_KEY_ID="..."
railway variables set AWS_SECRET_ACCESS_KEY="..."
railway variables set AWS_S3_BUCKET_NAME="onietan-law-documents"
railway variables set AWS_REGION="eu-west-1"
railway variables set NEXTAUTH_URL="https://api.ddonietanandco.com"
railway variables set NEXT_PUBLIC_APP_URL="https://ddonietanandco.com"
railway variables set NODE_ENV="production"
railway variables set ENABLE_AUDIT_LOGS="true"
railway variables set ENABLE_2FA="true"
```

### 4.4 Add Procfile for Railway
```bash
echo "web: npm run prisma:migrate:deploy && npm start" > Procfile
```

### 4.5 Deploy
```bash
railway up
# Railway auto-detects Next.js and deploys
# Get URL: e.g. https://onietan-lawfirm-api.up.railway.app
```

### 4.6 Set Custom Domain
```
Railway Dashboard → Settings → Domains
Add: api.ddonietanandco.com
Add CNAME record in your DNS provider
```

---

## STEP 5 — DEPLOY FRONTEND (Vercel)

### 5.1 Install Vercel CLI
```bash
npm install -g vercel
vercel login
```

### 5.2 Deploy
```bash
cd onietan-frontend
vercel --prod
```

### 5.3 Set Environment Variables in Vercel Dashboard
```
NEXT_PUBLIC_APP_URL = https://ddonietanandco.com
NEXTAUTH_URL = https://ddonietanandco.com
NEXTAUTH_SECRET = [same as backend]
NEXT_PUBLIC_API_URL = https://api.ddonietanandco.com
```

### 5.4 Custom Domain
```
Vercel Dashboard → Domains → Add ddonietanandco.com
Add A record: 76.76.21.21
Add CNAME: www → cname.vercel-dns.com
```

---

## STEP 6 — POST-DEPLOYMENT CHECKLIST

```
✅ Database migrations applied
✅ Seed data loaded (admin user created)
✅ S3 bucket created with correct permissions
✅ CloudFront distribution active
✅ Resend domain verified — test emails sending
✅ Environment variables set on Railway + Vercel
✅ Custom domains configured with SSL
✅ CORS configured for production domains
✅ Rate limiting enabled
✅ Audit logging enabled
✅ 2FA enabled
✅ Health check endpoint responding: GET /api/health
✅ Admin login working: admin@ddonietanandco.com
✅ Client registration flow working
✅ Document upload to S3 working
✅ Email notifications sending
```

---

## STEP 7 — HEALTH CHECK ENDPOINT

Add to `pages/api/health.ts`:
```typescript
import { type NextApiRequest, type NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      database: "connected",
    });
  } catch {
    res.status(503).json({ status: "unhealthy", database: "disconnected" });
  }
}
```

---

## MONTHLY COST ESTIMATE (Production)

| Service         | Plan          | Cost (USD/mo) |
|-----------------|---------------|---------------|
| Vercel          | Pro           | $20           |
| Railway         | Starter       | $5–20         |
| Neon PostgreSQL | Launch        | $19           |
| AWS S3 + CF     | Pay-as-you-go | $5–15         |
| Resend          | Pro           | $20           |
| Domain (annual) | .com          | ~$1.50/mo     |
| **TOTAL**       |               | **~$70–95/mo**|

---

## SECURITY HARDENING (Production)

```bash
# 1. Generate strong secrets
openssl rand -base64 32   # NEXTAUTH_SECRET
openssl rand -base64 32   # JWT_SECRET
openssl rand -base64 32   # JWT_REFRESH_SECRET

# 2. Enable Neon connection pooling
# Append ?pgbouncer=true&connection_limit=1 to DATABASE_URL

# 3. Set up Vercel Edge Config for feature flags

# 4. Enable Railway health checks
# Dashboard → Service → Health Check → /api/health

# 5. Configure Cloudflare in front of both domains
# - DDoS protection
# - WAF rules
# - Bot management
# - Nigerian IP optimization
```

---

## BACKUP STRATEGY

```bash
# Automated Neon backups: built-in (7-day point-in-time recovery)

# Manual backup script:
pg_dump "$DATABASE_URL" | gzip > backup-$(date +%Y%m%d).sql.gz
aws s3 cp backup-*.sql.gz s3://onietan-law-backups/db/

# S3 versioning for documents: already enabled above
# Enable S3 Cross-Region Replication for disaster recovery
```
