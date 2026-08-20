# 🚀 DevNext

> **AI-Powered Developer Growth Platform**

DevNext is a full-stack AI-powered platform built to help developers **learn, practice, analyze their skills, and improve their technical growth** in one place.

It combines **AI-powered developer analysis, quizzes, coding contests, real-time interaction, authentication, and personalized insights** into a single platform.

🌐 **Live Demo:** https://dev-next-three.vercel.app/

📂 **GitHub:** https://github.com/ChanchalSHARMA09/DevNext

---

## ✨ Features

### 🤖 AI-Powered Developer Analysis

- AI-powered developer performance analysis
- Personalized insights and recommendations
- Identify strengths and improvement areas
- AI integration using **LangChain + Groq**
- Dedicated AI service and prompt architecture

### 📊 Developer Dashboard

- Personalized developer dashboard
- Track development and learning activity
- View performance information
- Centralized overview of developer growth

### 🧠 Technical Quiz

- Interactive technical quizzes
- Practice programming and development concepts
- Test your technical knowledge
- Track quiz performance

### 🏆 Coding Arena

- Coding practice environment
- Contest-based coding experience
- Interactive contest system
- Real-time contest communication
- Socket.IO integration

### 🎮 Contest Lobby

- Real-time contest lobby
- Join and interact with contests
- Socket-based communication
- Designed for competitive coding experiences

### 🔐 Authentication

- User registration
- User login
- JWT-based authentication
- Password hashing with bcrypt
- Email verification
- Forgot password
- Password reset
- Protected routes

### 📧 Email Services

- Email verification
- Password reset emails
- Nodemailer integration

### ⚡ Real-Time Communication

- Socket.IO integration
- Real-time events
- Contest/lobby communication
- Interactive user experience

---

# 🛠️ Tech Stack

## Frontend

- React.js
- Vite
- React Router
- Tailwind CSS
- Axios
- Socket.IO Client
- Lucide React

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt.js
- Socket.IO
- Nodemailer
- Helmet
- CORS
- Cookie Parser
- dotenv

## AI

- LangChain
- Groq

## Tools

- Git
- GitHub
- VS Code
- Postman

---

# 🏗️ Project Structure

```text
DevNext/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── context/
│       │
│       ├── pages/
│       │   ├── Analysis.jsx
│       │   ├── Arena.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Quiz.jsx
│       │   ├── Lobby.jsx
│       │   ├── ForgotPassword.jsx
│       │   ├── ResetPassword.jsx
│       │   └── VerifyEmail.jsx
│       │
│       ├── services/
│       ├── App.jsx
│       └── main.jsx
│
├── backend/
│   └── src/
│       ├── config/
│       │
│       ├── controllers/
│       │   ├── analysis.controller.js
│       │   ├── auth.controller.js
│       │   ├── contest.controller.js
│       │   ├── dashboard.controller.js
│       │   └── quiz.controller.js
│       │
│       ├── middlewares/
│       ├── models/
│       ├── prompts/
│       ├── routes/
│       ├── services/
│       ├── sockets/
│       ├── utils/
│       └── server.js
│
├── .gitignore
└── README.md
