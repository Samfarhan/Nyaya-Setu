<div align="center">

# âš–ï¸ Nyayi (à¤¨à¥à¤¯à¤¾à¤¯à¥€) â€” India's AI Legal Intelligence Platform

<p align="center">
  <strong>Democratizing Indian Legal Literacy â€¢ BNS & BNSS 2023 Compliant â€¢ Citizen-First Justice Assistant</strong>
</p>

<p align="center">
  <a href="https://ai.nyayi.in"><img src="https://img.shields.io/badge/ðŸš€_Launch_App-ai.nyayi.in-10b981?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Launch Nyayi App" /></a>
  <a href="https://nyayi.in"><img src="https://img.shields.io/badge/ðŸŒ_Web_Portal-nyayi.in-0ea5e9?style=for-the-badge&logo=safari&logoColor=white" alt="Official Portal" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/ðŸ›¡ï¸_License-Proprietary-red?style=for-the-badge" alt="License" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Cloud-Render-46E3B7?style=flat-square&logo=render&logoColor=white" alt="Render" />
  <img src="https://img.shields.io/badge/CDN-Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare" />
  <img src="https://img.shields.io/badge/PWA-Installable-purple?style=flat-square&logo=pwa&logoColor=white" alt="PWA" />
  <img src="https://img.shields.io/badge/BNS_2023-Active-blue?style=flat-square&logo=scale&logoColor=white" alt="BNS" />
  <img src="https://img.shields.io/badge/Auth-Google_%7C_Email_OTP-orange?style=flat-square&logo=google&logoColor=white" alt="Auth" />
  <img src="https://img.shields.io/badge/SSL-A+_Secured-success?style=flat-square&logo=letsencrypt&logoColor=white" alt="SSL" />
</p>

</div>

---

## ðŸ“Œ Executive Overview

**Nyayi (à¤¨à¥à¤¯à¤¾à¤¯à¥€)** â€” derived from the Sanskrit word for *righteous justice* â€” is India's next-generation AI legal guidance platform. Built from the ground up for Indian citizens, Nyayi bridges the vast communication gap between complex statutory legal codes and ordinary people.

Whether facing a police FIR dispute, property inheritance conflict, cyber fraud loss, or consumer issue, Nyayi equips citizens with instant, empathetic, and actionable procedural understanding grounded in **Indian Penal jurisprudence (BNS, BNSS, BSA, CPC, and Consumer Protection Act)**.

> ðŸ’¡ **Core Philosophy:** Legal literacy is a fundamental right. Law must be explained in the language citizens understand â€” without intimidating jargon or prohibitive advocate fees.

---

## ðŸ§  AI Neural Engine & Technical Architecture

```mermaid
graph TD
    A[Citizen Query / Case Document / Photo] --> B[Input Harmonizer & Normalizer]
    B --> C{Context & Intent Detection}
    C -->|FIR / Criminal Law| D[BNSS 173 & BNS Engine]
    C -->|Evidence / Cyber Crime| E[BSA 63 & IT Act Engine]
    C -->|Civil / Consumer / Property| F[CPC & Consumer Act Engine]
    D --> G[Multi-Stage Statutory Grounding Pipeline]
    E --> G
    F --> G
    G --> H[Empathetic Citizen Language Synthesizer]
    H --> I[Output: Relevant Sections â€¢ Immediate Rights â€¢ Action Steps]
```

### 1. Statutory Grounding Engine
Unlike generic chat models prone to legal hallucination, Nyayi's inference engine strictly incorporates Indian legal doctrines:
- **Bharatiya Nyaya Sanhita (BNS) 2023** (Replacing IPC 1860)
- **Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023** (Replacing CrPC 1973)
- **Bharatiya Sakshya Adhiniyam (BSA) 2023** (Replacing Indian Evidence Act 1872)
- **Information Technology Act, 2000** & Cyber Fraud Recovery Protocols (1930 Helpline)
- **Motor Vehicles (Amendment) Act** & Traffic Challan Procedures

### 2. Document & Media Analysis Pipeline
Integrated into the chat composer via the **`+` Upload Drawer**, citizens can attach:
- ðŸ“„ **FIR Copies & Police Notices** (PDF, DOCX, TXT)
- ðŸ–¼ï¸ **Legal Notices & Affidavits** (Scans & Screenshots)
- ðŸ“¸ **Live Evidence Capture** (Direct camera capture on mobile)

The engine extracts key facts, identifies statutory exposure, and formats a structured action plan.

### 3. Progressive Web App (PWA) Mobile Architecture
- **100dvh Layout:** Zero unwanted browser address-bar scroll clipping.
- **Offline Shell & Service Worker (`sw.js`):** Fast loading with stale-while-revalidate asset caching.
- **Standalone Mode:** Native app look & feel when installed to Android or iOS home screens.

---

## âœ¨ Core Platform Capabilities

| Capability | Description | Statutory / Procedural Anchor |
| :--- | :--- | :--- |
| **âš–ï¸ Fact-to-Law Engine** | Describe any real-world incident in plain words; AI diagnoses exact applicable sections and legal rights. | BNS 2023 / IPC Cross-Walk |
| **ðŸ“‹ Step-by-Step FIR Wizard** | Complete guide to filing an FIR, jurisdiction selection, Zero FIR rules, and remedies if police refuse. | BNSS Section 173(1), 175(3) |
| **ðŸ“– Case Law Simplifier** | Breaks down landmark Supreme Court and High Court judgments into 3-point citizen summaries. | SC / HC Jurisprudence |
| **ðŸ“‘ Legal Notice Drafter** | Generates formal, ready-to-print legal notices for money recovery, tenancy, cheque bounce, or consumer complaints. | Section 138 NI Act, CPC 1908 |
| **ðŸš— Traffic Fine Calculator** | Instant fine calculation, compounding rules, and virtual court resolution methods. | Motor Vehicles Act 2019 |
| **ðŸŽ™ï¸ Multilingual Voice AI** | Full voice conversation supporting **Pure Hindi (Devanagari)**, **English**, and conversational **Hinglish**. | Native Indian Voice Synthesis |
| **ðŸš¨ Emergency SOS System** | One-tap access to 112 (Police), 1091 (Women), 1930 (Cyber Crime), and 15100 (Free Legal Aid). | NALSA / MHA Helplines |

---

## ðŸ’» Tech Stack & Infrastructure

<div align="center">

### Frontend & App Shell
![HTML5](https://img.shields.io/badge/HTML5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![PWA](https://img.shields.io/badge/Progressive_Web_App-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![FontAwesome](https://img.shields.io/badge/Font_Awesome-538DD7?style=for-the-badge&logo=fontawesome&logoColor=white)

### Backend & Cloud Infrastructure
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)

### Security & Authentication
![OAuth 2.0](https://img.shields.io/badge/OAuth_2.0-EB5424?style=for-the-badge&logo=auth0&logoColor=white)
![Resend](https://img.shields.io/badge/Resend_Email_API-000000?style=for-the-badge&logo=mailgun&logoColor=white)
![SSL](https://img.shields.io/badge/TLS_1.3_Encryption-005571?style=for-the-badge&logo=letsencrypt&logoColor=white)

</div>

---

## ðŸ“‚ Repository Directory Structure

```plaintext
Nyaya-Setu/
â”œâ”€â”€ public/
â”‚   â”œâ”€â”€ css/
â”‚   â”‚   â””â”€â”€ style.css            # 100dvh Glassmorphic Responsive Design System
â”‚   â”œâ”€â”€ js/
â”‚   â”‚   â””â”€â”€ script.js            # Chat controller, media upload tray, speech synth
â”‚   â”œâ”€â”€ images/
â”‚   â”‚   â””â”€â”€ logo.png             # Official Nyayi brand logo (192px / 512px)
â”‚   â”œâ”€â”€ auth.html                # Unified Auth: Google OAuth, GitHub, Email OTP
â”‚   â”œâ”€â”€ index.html               # Main PWA application shell & composer
â”‚   â”œâ”€â”€ manifest.json            # PWA standalone manifest configuration
â”‚   â””â”€â”€ sw.js                    # Service Worker caching engine
â”œâ”€â”€ server.js                    # Production Node.js server (Auth, AI API, Resend, Admin)
â”œâ”€â”€ users.json                   # Encrypted user records & authentication timestamps
â”œâ”€â”€ LICENSE                      # Proprietary Software License & BCI Legal Disclaimer
â””â”€â”€ README.md                    # Project documentation
```

---

## ðŸš€ Quick Start & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- Git installed

### 1. Clone the Repository
```bash
git clone https://github.com/Samfarhan/Nyaya-Setu.git
cd Nyaya-Setu
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=3000
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM="Nyayi AI <auth@nyayi.in>"
GOOGLE_CLIENT_ID=your_google_oauth_client_id
ADMIN_SECRET=your_admin_secret_key
```

### 3. Run the Development Server
```bash
node server.js
```
Navigate to `http://localhost:3000` to launch the platform locally.

---

## ðŸ‘¨â€ðŸ’» Founder & Lead Architect

<div align="center">

<img src="https://github.com/Samfarhan.png" width="110px" style="border-radius:50%; border: 3px solid #10b981;" alt="Farhan Khan" /><br/>

### **Farhan Khan**
*Founder & Lead Architect â€” Nyayi AI*  
BCA (Bachelor of Computer Applications) â€¢ Full-Stack AI Developer

[![Instagram](https://img.shields.io/badge/Instagram-%23E4405F.svg?style=for-the-badge&logo=Instagram&logoColor=white)](https://instagram.com/@he_yappz)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:samexists4real@gmail.com)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Samfarhan)

**Co-Architect:** Kamran Sheikh

</div>

---

## ðŸ›¡ï¸ License & Statutory Legal Disclaimer

Copyright (c) 2026 **Farhan Khan**. All Rights Reserved.  
This software is protected under a **Proprietary Commercial & IP Software License**. Unauthorized reproduction, resale, mirroring, white-labeling, or commercial distribution is strictly prohibited. See [LICENSE](LICENSE) for full legal terms.

> **Statutory Notice under Advocates Act, 1961:** Nyayi is an AI-powered legal literacy and guidance tool. It does not provide formal legal advice, advocate representation, or court pleading services under the Advocates Act, 1961 or Bar Council of India (BCI) rules. For active litigation, users are advised to consult certified advocates or government legal aid (NALSA).

<div align="center">
  <sub>Built with â¤ï¸ in India by Farhan Khan for every citizen seeking justice.</sub>
</div>