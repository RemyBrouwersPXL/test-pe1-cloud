# Frontend Application (`frontend`)

## Overview
The **GearBids Frontend** is a Single-Page Application (SPA) built with **React 18, TypeScript, Vite, and Tailwind CSS**. Modeled directly after **Cars & Bids**, it delivers a responsive car enthusiast marketplace experience:
- Live auction cards with countdown timers.
- Anti-sniping dynamic indicators (pulsing red warning and 2-minute timer extensions).
- Full listing page with multi-image photo gallery, specs, Doug's Take review, verified vehicle inspection scores, and comments feed.
- Interactive bidding box with session-cookie authentication and live bid history.
- Live Server-Sent Events (SSE) notification drawer for real-time outbid notices.

---

## Architectural Role & API Integration

In development, Vite proxies requests directly to local microservices:
- `/api/auctions` & `/api/auth` ➔ `http://localhost:5000` (Auction Core)
- `/api/notifications` ➔ `http://localhost:5001` (Notification Service)
- `/api/inspections` ➔ `http://localhost:5002` (Inspection Service)

In AWS Production on EC2:
- An **AWS Application Load Balancer (ALB)** routes client traffic based on URL paths.
- The compiled SPA files in `dist/` are served with high performance via **Nginx** on the Frontend EC2 instance.

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_AUCTION_SERVICE_URL` | Upstream Auction Service endpoint | `http://localhost:5000` |
| `VITE_NOTIFICATION_SERVICE_URL`| Upstream Notification Service endpoint| `http://localhost:5001` |
| `VITE_INSPECTION_SERVICE_URL` | Upstream Inspection Service endpoint | `http://localhost:5002` |

---

## Local Development & Build

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Typecheck and build production bundle into dist/
npm run build

# Preview production build locally
npm run preview
```

---

## EC2 Deployment & SSM Operations
On the Frontend EC2 instance, the built artifacts are deployed into `/opt/gearbids/frontend/dist` and served by Nginx:

```bash
# Check Nginx status
sudo systemctl status nginx

# Verify Nginx configuration syntax
sudo nginx -t

# Reload Nginx after deploying new bundle
sudo systemctl reload nginx
```

### AWS Systems Manager (SSM) Deployment
```bash
aws ssm send-command \
  --instance-ids "<FRONTEND_EC2_ID>" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /opt/gearbids/frontend && sudo systemctl reload nginx"]'
```
