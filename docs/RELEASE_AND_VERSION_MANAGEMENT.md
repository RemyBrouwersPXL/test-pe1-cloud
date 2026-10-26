# GearBids Platform | Release Tagging & S3 Archival Traceability Guide
> **Enterprise DevOps Standards for Continuous Integration, Artifact Archiving & Continuous Deployment**  
> *Course: Cloud Expert / Advanced DevOps & Cloud Architecture*

---

## 1. Executive Summary & Purpose

In production-grade cloud environments, establishing strict **provenance and traceability** is essential for compliance, auditability, operational rollbacks, and reproducible deployments. 

The **GearBids Platform** implements an end-to-end versioning, release tagging, and archival architecture that establishes an unbreakable chain of custody across every stage of the lifecycle:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Source Code   │       │   CI Pipeline   │       │   S3 Archival   │       │  CD Deployment  │
│   & Git Tags    │ ───►  │  Build & Verify │ ───►  │  Multi-Tier Repo│ ───►  │   via AWS SSM   │
│ (v1.0.0/commit) │       │ (Manifest/SHA)  │       │ (Archive/Tags)  │       │ (EC2 Daemons)   │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
                                                                                       │
                                                                                       ▼
                                                                              ┌─────────────────┐
                                                                              │ Verified Runtime│
                                                                              │ /health Probes  │
                                                                              │ & UI Footer     │
                                                                              └─────────────────┘
```

---

## 2. Versioning Strategy & SemVer 2.0.0

### 2.1 Canonical Version Source
The single source of truth for the platform version is the **[`VERSION`](../VERSION)** file located at the repository root.

All subproject build manifests are strictly synchronized to this canonical value:
- **Project Root**: [`VERSION`](../VERSION) (`1.0.0`)
- **Root NPM Workspace**: [`package.json`](../package.json) (`"version": "1.0.0"`)
- **React Frontend**: [`frontend/package.json`](../frontend/package.json) (`"version": "1.0.0"`)
- **Auction Core Service**: [`services/auction-service/pom.xml`](../services/auction-service/pom.xml) (`<version>1.0.0</version>`)
- **Notification Service**: [`services/notification-service/package.json`](../services/notification-service/package.json) (`"version": "1.0.0"`)
- **FastAPI Inspection Service**: [`services/inspection-service/main.py`](../services/inspection-service/main.py) (`APP_VERSION`)
- **Bidding Worker Daemon**: [`services/bidding-worker-service/worker.py`](../services/bidding-worker-service/worker.py) (`APP_VERSION`)

### 2.2 Release Tag Naming Conventions
Git release tags follow strict Semantic Versioning (`v<MAJOR>.<MINOR>.<PATCH>`):
- **Production Releases**: `v1.0.0`, `v1.1.0`, `v2.0.0`
- **Pre-Releases / Release Candidates**: `v1.1.0-rc.1`, `v1.0.0-beta.2`
- **Test / CI Ephemeral Deployments**: `v1.0.0-test.42`, `v1.0.0-build.105`

---

## 3. Repository Tagging & Synchronization Utility

The CLI utility [`devops/scripts/tag-release.sh`](../devops/scripts/tag-release.sh) provides automated checking, synchronization, version bumping, and git tagging:

```bash
# 1. Check consistency across all subproject configuration files
./devops/scripts/tag-release.sh check

# 2. Synchronize all subproject files to match the canonical VERSION file
./devops/scripts/tag-release.sh sync

# 3. Bump version following SemVer (patch: 1.0.0 -> 1.0.1, minor: 1.0.0 -> 1.1.0, major: 1.0.0 -> 2.0.0)
./devops/scripts/tag-release.sh bump patch
./devops/scripts/tag-release.sh bump minor
./devops/scripts/tag-release.sh bump 1.2.0

# 4. Create an annotated git release tag
./devops/scripts/tag-release.sh tag v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0
```

---

## 4. Packaging, Release Manifest & Cryptographic Integrity

Whenever artifacts are compiled using [`devops/scripts/package-services.sh`](../devops/scripts/package-services.sh), the script produces:

1. **Embedded Version Metadata**: A `version.json` file is baked directly inside every tarball containing its build time, git commit hash, environment, and builder identity.
2. **Cryptographic SHA256 Checksums**: Recorded in `dist-releases/checksums.sha256`.
3. **Canonical Release Manifest**: Generated as `dist-releases/release-manifest.json`.

### Release Manifest Schema (`release-manifest.json`)
```json
{
  "schema_version": "1.0",
  "platform": "GearBids Microservices Platform",
  "version": "1.0.0",
  "release_tag": "v1.0.0",
  "git_commit": "b9715a59435602cbf86b2e39652a1e5a2162cbaa",
  "git_commit_short": "b9715a5",
  "git_branch": "main",
  "target_environment": "production",
  "built_at": "2026-10-06T13:07:34Z",
  "built_by": "GitHub-Actions-CI/run-105",
  "artifact_count": 6,
  "artifacts": {
    "frontend-release.tar.gz": {
      "filename": "frontend-release.tar.gz",
      "sha256": "57728eaca25ee4b51a0b1abcdaa93451af83ccd13685e0d4a1aeb87fb7f28db5",
      "size_bytes": 296237
    },
    "auction-service-release.tar.gz": {
      "filename": "auction-service-release.tar.gz",
      "sha256": "ba5c909222f9ccb27caaa7e6c4f6bb158f0794b313cb3df2d6325d2dcf52f23e",
      "size_bytes": 23290703
    },
    "notification-service-release.tar.gz": {
      "filename": "notification-service-release.tar.gz",
      "sha256": "725dea4f84bf1a9ef178357d6d7d6549d12b42636e3d778d7f1f91edd63417ff",
      "size_bytes": 52892
    },
    "worker-service-release.tar.gz": {
      "filename": "worker-service-release.tar.gz",
      "sha256": "d48802c72ff7de23b9e997786dfb0e6f79b9070278d3b2031b332f2209be44f0",
      "size_bytes": 3938
    },
    "inspection-service-release.tar.gz": {
      "filename": "inspection-service-release.tar.gz",
      "sha256": "7983323fcfa0ae28879ee8c3c0e994c2e5930931cbad67f2f18767ce71262700",
      "size_bytes": 4818
    },
    "database-release.tar.gz": {
      "filename": "database-release.tar.gz",
      "sha256": "fa8599a422f0f4b3e486a9541d7a77b0328758182cf5e41b273e286f12d38da0",
      "size_bytes": 11746
    }
  }
}
```

---

## 5. Amazon S3 Multi-Tier Archival & Cloud Object Tagging

Rather than overwriting release artifacts in place, Amazon S3 storage is structured into **three distinct tiers**:

```
s3://${S3_DEPLOY_BUCKET}/
└── releases/
    ├── archive/                                      <-- Tier 1: Immutable Global Release Archive
    │   ├── v1.0.0/
    │   │   ├── release-manifest.json
    │   │   ├── checksums.sha256
    │   │   ├── frontend-release.tar.gz
    │   │   ├── auction-service-release.tar.gz
    │   │   ├── notification-service-release.tar.gz
    │   │   ├── worker-service-release.tar.gz
    │   │   ├── inspection-service-release.tar.gz
    │   │   └── database-release.tar.gz
    │   └── v1.1.0/
    │       └── ...
    │
    ├── test/                                         <-- Tier 2 & 3: Test Environment Channel
    │   ├── current-release.json                      <-- Active deployed release descriptor
    │   ├── latest/                                   <-- Symlink-like latest mirror
    │   ├── v1.0.0-test.42/                           <-- Test snapshot
    │   └── *.tar.gz                                  <-- Backward-compatible root mirror
    │
    └── prod/                                         <-- Tier 2 & 3: Production Environment Channel
        ├── current-release.json                      <-- Active production release descriptor
        ├── latest/                                   <-- Production latest mirror
        └── v1.0.0/                                   <-- Production immutable snapshot
```

### 5.1 S3 Storage Tiers Explained
1. **Tier 1 (Immutable Archive Tier - `releases/archive/${RELEASE_TAG}/`)**:  
   Permanent repository of all historical builds. Never overwritten or deleted. Allows reproducing, auditing, or rolling back to any prior build at any time.
2. **Tier 2 (Environment Snapshot Tier - `releases/${ENV_NAME}/${RELEASE_TAG}/`)**:  
   Snapshot of the exact bundle deployed to that environment.
3. **Tier 3 (Active Pointer Tier - `releases/${ENV_NAME}/current-release.json` & `latest/`)**:  
   Tracks the currently deployed release in each environment, facilitating zero-downtime bootstrap and quick lookups.

### 5.2 S3 Cloud Object Tagging
Every release artifact uploaded to S3 is tagged with AWS Object Tags for cloud audit trails and lifecycle management:

| S3 Object Tag Key | Example Value | Description |
|---|---|---|
| `Project` | `GearBids` | Platform identifier |
| `Environment` | `prod` / `test` | Target deployment tier |
| `Version` | `1.0.0` | Canonical Semantic Version |
| `ReleaseTag` | `v1.0.0` | Git or pipeline release tag |
| `CommitSha` | `b9715a59...` | Full 40-character Git commit hash |

---

## 6. End-to-End Traceability Matrix

The complete trace of code building, archiving, deploying, and running is verifiable at every layer:

| Layer | Source / Location | Verification Method |
|---|---|---|
| **1. Source Control** | Git repository root | `cat VERSION`<br/>`git describe --tags --abbrev=0`<br/>`git log -1 --format="%H"` |
| **2. CI Pipeline** | GitHub Actions `.github/workflows/ci.yml` | Validates `tag-release.sh check`<br/>Verifies git tag equals `v$(cat VERSION)`<br/>Verifies `sha256sum -c checksums.sha256`<br/>Uploads workflow artifacts |
| **3. S3 Archival** | `s3://${S3_DEPLOY_BUCKET}/releases/archive/${TAG}/` | `aws s3 ls s3://${S3_DEPLOY_BUCKET}/releases/archive/`<br/>`aws s3 cp s3://${S3_DEPLOY_BUCKET}/releases/archive/${TAG}/release-manifest.json -`<br/>`aws s3api get-object-tagging --bucket ${BUCKET} --key releases/archive/${TAG}/auction-service-release.tar.gz` |
| **4. CD Pipeline** | GitHub Actions `deploy-test.yml` / `deploy-prod.yml`<br/>Jenkins `Jenkinsfile.test` / `Jenkinsfile.prod` | Logs resolved `RELEASE_TAG`<br/>Archives to S3 with tags<br/>Executes `deploy-via-ssm.sh --release-tag "${TAG}"` |
| **5. EC2 Target Hosts** | `/opt/gearbids/` & `/etc/gearbids/` on EC2 | `cat /opt/gearbids/CURRENT_RELEASE`<br/>`cat /etc/gearbids/release-manifest.json`<br/>`grep APP_VERSION /etc/gearbids/*.env` |
| **6. Microservice Runtimes** | HTTP `/health` and `/api/version` endpoints | `curl http://<ALB>/health`<br/>`curl http://<ALB>/api/version`<br/>`curl http://<ALB>/api/notifications/health`<br/>`curl http://<ALB>/api/inspections/health` |
| **7. User Interface** | React SPA Footer | Visible release badge in browser footer:<br/>`[Release: v1.0.0 | Commit: b9715a5 | PROD]` |

---

## 7. Evaluator & DevOps Audit Runbook

To demonstrate full release tagging and archival compliance to examiners:

### Step 1: Verify Repository Synchronization
```bash
./devops/scripts/tag-release.sh check
```
*Expected: All 5 files return `1.0.0` and green checkmark.*

### Step 2: Inspect S3 Release Archive & Manifest
```bash
# List historical release archives
aws s3 ls s3://${S3_DEPLOY_BUCKET}/releases/archive/

# Inspect release manifest for v1.0.0
aws s3 cp s3://${S3_DEPLOY_BUCKET}/releases/archive/v1.0.0/release-manifest.json - | jq .

# Inspect S3 Object Tags on an uploaded artifact
aws s3api get-object-tagging \
  --bucket "${S3_DEPLOY_BUCKET}" \
  --key "releases/archive/v1.0.0/auction-service-release.tar.gz"
```

### Step 3: Verify Deployed Release via AWS SSM (Zero SSH)
```bash
# Check current deployed release recorded on Backend EC2
aws ssm send-command \
  --instance-ids "<BACKEND_INSTANCE_ID>" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cat /opt/gearbids/CURRENT_RELEASE", "cat /etc/gearbids/release-manifest.json | jq .release_tag"]' \
  --query "Command.CommandId" --output text
```

### Step 4: Verify Live Service Health Probes
```bash
# Run automated health and version verification probe
./devops/scripts/health-check.sh http://<ALB_DNS_NAME> --expected-version 1.0.0
```

### Step 5: Verify Browser UI Footer
Open `http://<ALB_DNS_NAME>` in a browser and inspect the footer badge at the bottom of the page. It will display the active release tag, short commit SHA, and environment badge.
