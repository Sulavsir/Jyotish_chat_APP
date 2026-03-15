# Environment variables – API and Web

Use these in `apps/api/.env` and `apps/web/.env.local` (or `.env`). Never commit real secrets.

---

## API (`apps/api/.env`)

### Core (required for API to run)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/jyotish_db?schema=public
JWT_SECRET=your-jwt-secret-min-32-chars
ENCRYPTION_KEY=your-32-char-encryption-key
```

### App & CORS
```env
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

### GetPay (for “GetPay” payment option)
```env
GETPAY_SCRIPT_URL=https://minio.finpos.global/getpay-cdn/webcheckout/v5/bundle.js
GETPAY_BASE_URL=https://uat-bank-getpay.nchl.com.np/ecom-web-checkout/v1/secure-merchant
GETPAY_PAP_INFO=your-pap-info-from-getpay
GETPAY_OPR_KEY=your-opr-key-from-getpay
# GETPAY_INS_KEY=optional-ins-key
```

### Fonepay Dynamic QR (do not mix with Web)
**Test:** Merchant `EPAYTEST`, token `123456` or `Nepal@123`. Official sandbox: gunaso@fonepay.com

```env
FONEPAY_QR_USERNAME=EPAYTEST
FONEPAY_QR_PASSWORD=123456
FONEPAY_QR_MERCHANT_CODE=EPAYTEST
FONEPAY_QR_SECRET=123456
# Optional – omit for dev defaults
# FONEPAY_QR_BASE_URL=https://dev-merchantapi.fonepay.com/convergent-merchant-web/api
# FONEPAY_QR_WS_BASE=wss://dev-ws.fonepay.com/convergent-webSocket-web
```

### Fonepay Web Redirect (card – do not mix with QR)
**Different URL:** `https://dev-clientapi.fonepay.com/api/merchantRequest`. RU must be public HTTPS (use ngrok in dev).

```env
FONEPAY_WEB_PID=EPAYTEST
FONEPAY_WEB_SECRET=123456
# Optional
# FONEPAY_WEB_URL=https://dev-clientapi.fonepay.com
# API_URL or FONEPAY_WEB_RETURN_URL = public callback URL
```

### Optional (email, SMS, Redis, etc.)
```env
# SMTP (emails)
# SMTP_HOST=...
# SMTP_PORT=587
# SMTP_USER=...
# SMTP_PASSWORD=...

# SMS (e.g. Aakash)
# SMS_API_URL=https://sms.aakashsms.com/sms/v3/send
# SMS_AUTH_TOKEN=...

# Redis (if used)
# REDIS_URL=redis://localhost:6379
# REDIS_HOST=localhost
# REDIS_PORT=6379

# Cookies (production)
# COOKIE_DOMAIN=.yourdomain.com

# API public URL (for Swagger, Fonepay callback RU – must be reachable by Fonepay in production)
# API_URL=http://localhost:4000
```

---

## Web (`apps/web/.env.local`)

### API and app URL
```env
# Production: your backend URL
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Optional: canonical web URL (for metadata, redirects)
# NEXT_PUBLIC_WEB_URL=https://yourdomain.com
```

### GetPay (frontend – only public keys)
```env
NEXT_PUBLIC_GETPAY_OPR_KEY=your-opr-key-same-as-backend
# Optional
# NEXT_PUBLIC_GETPAY_INS_KEY=...
# NEXT_PUBLIC_GETPAY_BASE_URL=https://...
```

### App name (optional, used in GetPay checkout)
```env
# NEXT_PUBLIC_APP_NAME=Chat Jyotish
```

**Note:** Fonepay (QR) does **not** need any env in the web app. All Fonepay API calls and the secret key stay in the API.

---

## Quick checklist

| Feature           | API env                                                                 | Web env                          |
|------------------|-------------------------------------------------------------------------|----------------------------------|
| App runs         | `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, `FRONTEND_URL`         | (optional) `NEXT_PUBLIC_API_URL` |
| GetPay payments  | `GETPAY_SCRIPT_URL`, `GETPAY_BASE_URL`, `GETPAY_PAP_INFO`, `GETPAY_OPR_KEY` | `NEXT_PUBLIC_GETPAY_OPR_KEY`      |
| Fonepay QR       | `FONEPAY_QR_USERNAME`, `FONEPAY_QR_PASSWORD`, `FONEPAY_QR_MERCHANT_CODE`, `FONEPAY_QR_SECRET` | None                             |
| Fonepay Web (card) | `FONEPAY_WEB_PID`, `FONEPAY_WEB_SECRET`, `FONEPAY_WEB_URL`, `API_URL` (callback)           | None                             |
