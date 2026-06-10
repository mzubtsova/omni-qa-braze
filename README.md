# OmniQA for Braze 🍦

OmniQA is a unified, real-time diagnostic dashboard designed for CRM engineering, campaign managers, and marketing developers. It automates campaign quality assurance by validating coding structures, verifying design compliance, and predicting deliverability health before you hit "Send" in Braze.

![OmniQA Dashboard Preview](omniqa_preview.png)

---

## 🛠️ System Architecture & Data Flow

```mermaid
flowchart TD
    %% Styling Definitions
    classDef source fill:#1e293b,stroke:#475569,stroke-width:2px,color:#f8fafc;
    classDef core fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef validator fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc;
    classDef api fill:#311042,stroke:#c084fc,stroke-width:2px,color:#f8fafc;
    classDef output fill:#061712,stroke:#34d399,stroke-width:2px,color:#f8fafc;

    %% Nodes
    Figma["🎨 Figma Mockup API"]:::source
    Payload["✉️ Coded Campaign HTML/CSS"]:::source
    Catalog["🗂️ Campaign Catalog Workspace"]:::source
    
    App["📊 OmniQA Diagnostics Console"]:::core
    
    subgraph LocalValidators ["🛡️ LOCAL CODE VALIDATORS"]
        Liquid["🧠 AST-less Liquid Parser"]
        Links["🔗 Link & UTM Crawler"]
        WCAG["👁️ WCAG Contrast Checker"]
    end
    class LocalValidators,Liquid,Links,WCAG validator;
    
    subgraph ExternalServices ["🤖 EXTERNAL SERVICES & APIS"]
        Gemini["💬 Gemini copy/spell Sync Auditor"]
        Braze["🔥 Braze REST Campaign API"]
    end
    class ExternalServices,Gemini,Braze api;
    
    PDFExport["📄 Visual QA PDF Scorecard"]:::output
    ReportEmail["📧 HTML Diagnostics Report Email"]:::output
    AutoFix["🪄 One-Click HTML Auto-Fixer"]:::output
    
    %% Flow Connections
    Figma -->|Extract Text| App
    Payload -->|Import Code| App
    Catalog -->|Load Draft| App
    
    App <-->|Syntax Auditing| Liquid
    App <-->|Link Verification| Links
    App <-->|A11y Validation| WCAG
    
    App <-->|AI Spell & Price Checks| Gemini
    
    App -->|Generate Scorecard| PDFExport
    App -->|Generate Email| ReportEmail
    App -->|Trigger Repair| AutoFix
    
    AutoFix -->|Sync Corrected Template| Braze
```

### Component Breakdown & Data Flow
1.  **Input Sources**: Campaign contexts are pulled from **Figma frames** (extracting copy blocks) and **Braze/HTML files** (fetching code assets).
2.  **OmniQA Core Controller (`App.jsx`)**: Orchestrates data state and passes values to dedicated subcomponents.
3.  **Local Validators**: Processes code syntax, contrast calculations, and URL routing locally in the browser to ensure instantaneous feedback.
4.  **External Copilot Services**: Integrates with **Google Gemini API** (using JSON Schema schemas for predictable formatting) to score brand sentiment and audit syntax.
5.  **Output Layer**: Allows campaign developers to directly export report summaries, print PDF scorecards, or sync the corrected code back to the active campaign in Braze.

---

## 🚀 Key Features

### 1. Unified Master Diagnostics & Copy Sync
*   **Figma Layer Cross-Checking**: Compares text nodes extracted from Figma designs directly with Braze HTML templates and subject lines.
*   **Fuzzy Text-Diff Matcher**: Dynamically tokenizes and scans plain text inside HTML tags to match lines of Figma design copy on the fly.
*   **Monaco HTML Code Editor**: Embeds a rich, syntax-highlighted editor with line numbers, code folding, word wrap, and automatic layout resizing that compiles state changes in real time.
*   **Master Diagnostics Hub**: Consolidates all Figma copy discrepancies, WCAG contrast alerts, UTM link crawler checks, Liquid logic errors, and spam triggers under a unified tabbed filter bar with live numeric counter badges.

### 2. Multi-Device & Multi-Channel Visual Stress-Tester
*   **Interactive Liquid Overrides**: Scans and detects dynamic Liquid template variables (`{{ user.first_name }}`, `{{ tier }}`) and renders text inputs for real-time customer profile updates.
*   **Custom Dynamic Variables (`+` / `×`)**: Allows developers to manually define, add (`+`), or delete (`×`) custom key-value variables to test edge cases outside default database parameters.
*   **Unified Multi-Tab Previews**: Allows campaign managers to instantly toggle the preview pane between:
    *   `📱 Device Simulator`: Renders simulated device frames (iPhone, Android, Tablet, Laptop) across channels.
    *   `📥 Client Inbox Previews`: Simulates subject line rendering and truncation lengths across Gmail Desktop, Apple Mail iOS, and Outlook Web.
    *   `📐 Figma Specification`: Displays Figma outline SVG blueprints side-by-side with code.
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

### 5. Braze Campaign Catalog & Workspace Manager
*   **Dynamic Campaign Catalog**: Tracks campaign drafts, versions, status, and synchronization state.
*   **Cluster-Mapped Workspace Links**: Maps REST API endpoints (e.g. `rest.iad-01`, `rest.iad-03`, `rest.eu`) to direct, clickable URLs pointing straight to your campaign configuration inside the Braze dashboard console.

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
