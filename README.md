# ✝️ ChristSeeker

**ChristSeeker** is a state-of-the-art digital companion designed to bridge the gap between technology and faith. Built for modern churchgoers, it provides a suite of AI-powered tools to enhance the sermon experience, deepen personal study, and foster spiritual growth.

🌐 **Live Site:** [christseeker.uk](https://christseeker.uk)

---

## ✨ Key Features

### 🎙️ Sermon Live Tools
*   **Real-time Subtitles:** Large-format, high-contrast captions for live sermons, specifically designed for the deaf and hard-of-hearing community.
*   **AI Note Taker:** Leveraging Gemini AI to listen to live sermons and generate structured summaries, key points, and practical applications automatically.

### 🤖 AI Spiritual Companion
*   **Theological Chat:** A smart assistant capable of discussing scripture and theology from various denominational perspectives (Non-Denominational, Baptist, Catholic, etc.).
*   **Devotional Guidance:** Generate personalized devotionals based on your current feelings or specific scripture passages.

### 📝 Spiritual Discipline Tools
*   **Journaling:** A dedicated space to save AI-generated sermon notes and personal reflections.
*   **Prayer Wall:** A communal space to share and support one another in prayer.
*   **Breath Prayers:** Interactive, calming tools for meditative prayer and stress relief.
*   **Stronghold Buster:** Specialized guidance for overcoming spiritual and personal challenges.

### 📖 Scripture & Study
*   **Reading Plans:** Structured plans to help you stay consistent in the Word.
*   **Scripture Exploration:** A modern interface for reading and interacting with the Bible.

---

## 🛠️ Tech Stack

*   **Frontend:** React 18, TypeScript, Vite
*   **Styling:** Tailwind CSS, Framer Motion (Animations), Lucide React (Icons)
*   **Backend & Auth:** Supabase (PostgreSQL, Auth, Edge Functions)
*   **AI Engine:** Google Gemini (via Supabase Edge Functions)
*   **Accessibility:** ARIA-compliant design with high-contrast themes.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- A Supabase project with Edge Functions enabled

### Installation

1.  **Clone the repo:**
    ```bash
    git clone https://github.com/ChristSeeker-Depot/christseeker.git
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run locally:**
    ```bash
    npm run dev
    ```

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

Built with ❤️ for the Body of Christ.
