# ChatChout - Modern Chat Application

A beautiful, responsive chat application built with React, Vite, and Tailwind CSS 4.0.

## Features

- 🎨 **Modern Design** - Beautiful UI with Tailwind CSS 4.0
- 📱 **Responsive** - Works perfectly on desktop and mobile devices
- 🔐 **Authentication** - Login and signup functionality
- 💬 **Real-time Chat Interface** - Intuitive messaging experience
- 🌟 **Animations** - Smooth transitions and micro-interactions
- 🎯 **User-friendly** - Clean and intuitive interface

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS 4.0** - Latest version with new Vite plugin
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icons

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Features Overview

### Landing Page
- Hero section with call-to-action
- Features showcase
- Customer testimonials
- Responsive navigation

### Authentication
- Login form with validation
- Signup form with password confirmation
- Form error handling

### Chat Interface
- Sidebar with chat list
- Real-time message display
- Message input with emoji support
- Mobile-responsive design
- User status indicators

## Tailwind CSS 4.0

This project uses the latest Tailwind CSS 4.0 with the new Vite plugin setup:

```javascript
// vite.config.js
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

```css
/* index.css */
@import "tailwindcss";
```
