# ReelBreak

**ReelBreak** is a Screenpipe pipe designed to help you track and manage your usage of short-form video platforms like **YouTube Shorts**, **Instagram Reels**, and **TikTok**. With daily usage goals, session analysis, and customizable intervention thresholds, ReelBreak empowers you to take control of your screen time and maintain a healthy digital balance.

This project is built as a **Next.js application** and integrates seamlessly with the **Screenpipe** platform to monitor and analyze your activity in real-time.

---

## 🚀 Features

- **Usage Tracking**: Monitor time spent on short-form video platforms.
- **Daily Goal Setting**: Set and track a daily usage limit (default: 30 minutes).
- **Session Analysis**: View detailed session breakdowns by date, including start/end times and platform usage.
- **Intervention Alerts**: Receive desktop notifications when exceeding a customizable threshold (default: 15 minutes).
- **Responsive Dashboard**: Visualize usage stats, platform breakdowns, and weekly trends with interactive charts.
- **Dark Mode Support**: Enjoy a seamless experience with a toggleable dark theme.
- **Settings Management**: Adjust goals and preferences via an intuitive settings page.

---

## 📦 Prerequisites

- [Node.js (v18 or later)](https://nodejs.org/)
- [Bun (optional, for faster builds)](https://bun.sh/)
- [Screenpipe](https://screenpi.pe/) installed locally
- Compatible OS: Windows, macOS, or Linux

---

## ⚙️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/devishmittal-reelbreak.git
cd devishmittal-reelbreak
```

### 2. Install Dependencies

Using **Bun** (recommended):
```bash
bun install
```

Or using **npm**:
```bash
npm install
```

### 3. Set Up Screenpipe

Install the Screenpipe CLI:
```bash
curl -fsSL get.screenpi.pe/cli | sh
```

Ensure Screenpipe is running locally and capturing screen data.

### 4. Install the Pipe

Build the project:
```bash
bun run build
```

Install the pipe in Screenpipe:
```bash
screenpipe install ./devishmittal-reelbreak
```

Enable the pipe:
```bash
screenpipe enable devishmittal-reelbreak
```

### 5. Run Locally

Start the development server:
```bash
bun dev
```

Open your browser and go to: [http://localhost:3000](http://localhost:3000) to access the dashboard.

---

## 📊 Usage

- **Dashboard**: View your daily usage, current session, session count, and weekly trends.
- **Sessions**: Explore detailed session data by selecting a date.
- **Settings**: Customize your daily goal and intervention threshold, and manage preferences.
- **Notifications**: Receive alerts when you exceed your intervention threshold (configurable).


---


## 🙏 Acknowledgments

- Built with **Next.js** and **Tailwind CSS**
- Powered by **Screenpipe** for screen activity tracking
- Thanks to the **open-source community** for inspiration and tools!
```
