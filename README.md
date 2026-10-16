# Vulnerable Demo Repository (`vulrepo`)

An intentionally vulnerable Node.js/Express application designed for testing DevSecOps pipelines with **Snyk** and **Jenkins**.

---

## 🎯 Included Vulnerabilities for Snyk to Detect

This repository contains known vulnerable dependencies (Software Composition Analysis - SCA) and code security patterns (Static Application Security Testing - SAST):

| Package / Component | Installed Version | Known Vulnerability / CVE |
| :--- | :--- | :--- |
| **`lodash`** | `4.17.15` | Prototype Pollution ([CVE-2020-8203](https://security.snyk.io/vuln/SNYK-JS-LODASH-567746), [CVE-2021-23337](https://security.snyk.io/vuln/SNYK-JS-LODASH-1018905)) |
| **`axios`** | `0.21.1` | SSRF & ReDoS ([CVE-2020-28168](https://security.snyk.io/vuln/SNYK-JS-AXIOS-1038255), [CVE-2021-3749](https://security.snyk.io/vuln/SNYK-JS-AXIOS-1579269)) |
| **`minimist`** | `1.2.0` | Prototype Pollution ([CVE-2020-7598](https://security.snyk.io/vuln/SNYK-JS-MINIMIST-559764)) |
| **`express`** | `4.16.0` | Outdated web framework with downstream query string / body parser flaws |
| **`server.js`** | SAST issues | Hardcoded mock API key and reflected input patterns detectable by Snyk Code |

---

## 🐳 Docker Usage

### Build the Docker image
```bash
docker build -t vulrepo:latest .
```

### Run the container
```bash
docker run -d -p 3000:3000 --name vulrepo-app vulrepo:latest
```

Access the app at `http://localhost:3000`.

---

## ⚙️ Setting Up the Jenkins Freestyle Job (Step-by-Step)

Follow these steps to configure a Jenkins Freestyle Job that pulls this repository via **Poll SCM** and runs a **Snyk** scan:

### Step 1: Add Snyk API Token to Jenkins Credentials
1. Obtain your Snyk API token from [Snyk Account Settings](https://app.snyk.io/account).
2. Go to your Jenkins Dashboard -> **Manage Jenkins** -> **Credentials**.
3. Under **Stores scoped to Jenkins**, click **System** -> **Global credentials (unrestricted)** -> **+ Add Credentials**.
4. Configure:
   - **Kind**: `Secret text`
   - **Scope**: `Global`
   - **Secret**: *(Paste your Snyk API Token)*
   - **ID**: `snyk-api-token`
   - **Description**: `Snyk API Token`
5. Click **Create**.

---

### Step 2: Ensure Snyk CLI is Available on Jenkins
You can either:
- **Option A (System install on Jenkins host/agent)**:
  ```bash
  npm install -g snyk
  ```
- **Option B (Use `npx`)**:
  If Node/NPM is installed on Jenkins, Jenkins can execute `npx -y snyk <command>` on the fly.
- **Option C (Jenkins Snyk Plugin)**:
  Install the official **Snyk Security** plugin via **Manage Jenkins** -> **Plugins**.

---

### Step 3: Create the Freestyle Job
1. From Jenkins Dashboard, click **New Item**.
2. Enter item name: `vulrepo-snyk-scan`.
3. Select **Freestyle project** and click **OK**.

---

### Step 4: Configure Source Code Management (Git)
1. In the job configuration, scroll down to **Source Code Management**.
2. Select **Git**.
3. Fill in:
   - **Repository URL**: `git@github.com:daksh-devrani/vulrepo.git` (or HTTPS URL: `https://github.com/daksh-devrani/vulrepo.git`)
   - **Credentials**: Select your Git SSH key or GitHub Token credentials.
   - **Branch Specifier**: `*/main` (or `*/master`)

---

### Step 5: Configure Build Triggers (Poll SCM)
1. Scroll down to **Build Triggers**.
2. Check the box for **Poll SCM**.
3. In the **Schedule** field, enter your cron expression:
   - `H/5 * * * *` *(Polls the repository every 5 minutes for new commits)*
   - `* * * * *` *(Polls every minute, suitable for quick testing)*
4. *(Optional)* Check **Ignore post-commit hooks** if needed.

---

### Step 6: Configure Build Environment (Inject Snyk Token)
1. Under **Build Environment**, check **Use secret text(s) or file(s)**.
2. Click **Add** -> **Secret text**.
3. Set:
   - **Variable**: `SNYK_TOKEN`
   - **Credentials**: Choose `snyk-api-token` (the one created in Step 1).

---

### Step 7: Add Build Step to Run Snyk
Scroll to the **Build Steps** section:

#### Method A: Using "Execute shell" (Standard & Flexible)
1. Click **Add build step** -> **Execute shell**.
2. Enter the following script:

```bash
#!/bin/bash
set -e

echo "=== Checking Node & Snyk ==="
node -v
npm -v

# Authenticate Snyk with the injected token
if command -v snyk >/dev/null 2>&1; then
    SNYK_BIN="snyk"
else
    SNYK_BIN="npx -y snyk"
fi

$SNYK_BIN auth "$SNYK_TOKEN"

echo "=== Running Snyk Open Source (SCA) Test ==="
# Note: '|| true' allows the build to continue if vulnerabilities are found,
# or remove '|| true' if you want Jenkins to fail the build when vulnerabilities exist.
$SNYK_BIN test --severity-threshold=medium || true

echo "=== Running Snyk Code (SAST) Test ==="
$SNYK_BIN code test || true
```

#### Method B: Using Snyk Security Plugin (If plugin installed)
1. Click **Add build step** -> **Invoke Snyk Security Task**.
2. Configure:
   - **Target**: `package.json`
   - **Severity threshold**: `medium` or `high`
   - Select your configured Snyk installation and credential.

---

### Step 8: Save and Test
1. Click **Save**.
2. Click **Build Now** to execute the first run manually.
3. Check the **Console Output** to verify:
   - Git repository checkout succeeded.
   - Snyk authenticated and scanned the codebase.
   - Snyk detected the intentionally vulnerable dependencies (`lodash`, `axios`, `minimist`, etc.).
4. When you push a new commit to the repository, Jenkins will automatically detect it during its next SCM poll cycle and trigger the job!
