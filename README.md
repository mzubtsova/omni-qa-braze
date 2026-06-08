# OmniQA for Braze 🍦

OmniQA is a unified, real-time diagnostic dashboard designed for CRM engineering, campaign managers, and marketing developers. It automates campaign quality assurance by validating coding structures, verifying design compliance, and predicting deliverability health before you hit "Send" in Braze.

![OmniQA Dashboard Preview](omniqa_preview.png)

---

## 🛠️ System Architecture & Data Flow

```mermaid
graph TD
    A[Figma Mockup] -->|API Node Extraction| B(OmniQA Sync Engine)
    C[Braze Campaign Payloads<br/>Email HTML / SMS / Push / IAM] -->|Liquid & Copy Payload| B
    
    B --> D[Copy Sync Auditor]
    B --> E[Multi-Channel Visual Stress-Tester]
    B --> F[Technical Health Auditor]
    B --> N[A/B Copy Compare Engine]
    
    D -->|AI Typos & Price Audits| G[Gemini API]
    E -->|Personalization Expander| H[Device Simulator Frame<br/>Email, Push, SMS, IAM]
    F -->|Liquid AST Parser| I[Syntax Warning logs]
    F -->|Link UTM Crawler| J[Link Health logs]
    F -->|CSS Color contrast ratio| K[WCAG Contrast alerts]
    N -->|Local AI Engagement Heuristics| O[Variant Open/CTR Scores]
    
    G --> L[QA Score Dashboard]
    H --> L
    I --> L
    J --> L
    K --> L
    O --> L
    L --> M[Dynamic Campaign Reports]
    N -->|Sync Back Chosen Variant| C
```

---

## 🚀 Key Features

### 1. Unified Master Diagnostics & Copy sync
*   **Figma Layer Cross-Checking**: Compares text nodes extracted from Figma designs directly with Braze HTML templates and subject lines.
*   **Fuzzy Text-Diff Matcher**: Dynamically tokenizes and scans plain text inside HTML tags to match lines of Figma design copy on the fly.
*   **Monaco HTML Code Editor**: Embeds a rich, syntax-highlighted editor with line numbers, code folding, word wrap, and automatic layout resizing that compiles state changes in real time.
*   **Master Diagnostics Hub**: Consolidates all Figma copy discrepancies, WCAG contrast alerts, UTM link crawler checks, Liquid logic errors, and spam triggers under a unified tabbed filter bar with live numeric counter badges.

### 2. Multi-Device & Multi-Channel Visual Stress-Tester
*   **Personalized Custom Name Typing**: Features an interactive text input allowing developers to type custom subscriber names, instantly resolving personalization tags (`{{ user.first_name }}`) across all channel previews.
*   **Simulated Push Notifications**: Toggles between **Locked Phone (Full Screen)** (displays lockscreen wallpaper, clock/calendar overlay, and rich push notification cards containing the Blizzard campaign banner image) and **Unlocked Phone (App Banner)** (overlays a floating push banner over an active app grid home screen). Laptop preview is automatically hidden in push mode.
*   **In-App Message (IAM) Layout Simulator**: Renders center modals, slide-up banners, and full-screen takeovers directly inside the simulated device with editable headers, body text, dynamic action buttons, and redirect link validators.
*   **SMS Preview & Billing Segment Auditor**: Renders message bubbles in a text chat interface, scans for non-GSM-7 unicode inputs (emojis or smart quotes), calculates text lengths, and warns developers when copy exceeds character limits and triggers multi-segment billing costs.
*   **Email Client Dark Mode Inversion**: Injects dynamic overrides into the email iframe context to invert styles, guaranteeing text legibility in simulated dark mobile environments.

### 3. Technical Health & Reporting Engine
*   **Liquid Logic Delimiter Checker**: Scans logic control flows (`{% if %}` and `{{ ... }}`) for nesting depth errors, missing delimiters, or orphaned statements.
*   **UTM Link Crawler**: Crawls all anchor links to detect dead hrefs, placeholder domains, and missing marketing UTM analytics keys.
*   **HTML Contrast Auto-Fixer**: Features a one-click repair engine that automatically adjusts violating button contrasts, resolves empty placeholder links, and appends missing UTM trackers.
*   **Staging PDF & Email Dispatcher**: Dispatches live email report drafts with detailed bulleted campaign issues lists and exports print-ready visual QA scorecards.

### 4. A/B Copy Compare & Predictive CTR Engine
*   **Standalone Side-by-Side Evaluator**: Compares subject lines, body copy snippets, CTA button texts, and CTA links for two variants (Baseline vs Challenger) in a dedicated tab.
*   **Local AI Predictive Model**: Predicts open rates, click-through rates (CTR), and overall grades based on character lengths, emojis, capitalization rules, urgency triggers, CTA verbs, and UTM configurations.
*   **Active Workspace Application**: Automatically updates the active workspace campaign (including direct parsing and updating of your template's HTML anchor elements) with your winning variant parameters.

---

## 💻 Tech Stack & Design

*   **Core**: React, Vite, and CSS variables.
*   **Theme**: Premium dark cyber-navy palette with glassmorphism overlays and glowing circular gauge metrics.
*   **Typography**: Outfitted with *Outfit* for modern SaaS headers and *JetBrains Mono* for responsive code blocks.

---

## ⚙️ Quick Start & Installation

### Local Sandbox Run (Offline Simulator)
By default, the app initializes in **Sandbox Demo mode**. This allows you to explore the dashboard immediately using high-fidelity test campaigns and simulated responses without setting up API keys.

1.  Navigate to the directory:
    ```bash
    cd omni-qa-braze
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Launch the local dev environment:
    ```bash
    npm run dev
    ```
4.  Open `http://localhost:5176` (or the port Vite allocates) in your browser.

### Live Production Configuration
To link your real environment:
1.  Go to the **Settings** panel in the sidebar.
2.  Toggle off **Use Sandbox Simulation / Demo Mode**.
3.  Add your credentials:
    *   **Gemini API Key** (for active copywriting checks).
    *   **Figma Personal Access Token** and **File ID**.
    *   **Braze REST Endpoint** and **API Key**.
4.  Click **Save Configuration** to sync instantly.
