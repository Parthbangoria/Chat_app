# MERN Real‑Time Chat App

A beginner‑friendly full‑stack chat application built with **MongoDB**, **Express**, **React**, **Node.js**, and **Socket.IO** for real‑time messaging.

## 🚀 Features

- Real‑time, bidirectional chat using **Socket.IO**.
- Stores chat history in **MongoDB**.
- Simple responsive UI built with React.
- Minimal setup for beginners.

## 🧰 Tech Stack

- **Backend**: Node.js, Express, Socket.IO, Mongoose, CORS
- **Database**: MongoDB / MongoDB Atlas
- **Frontend**: React, socket.io-client, axios

## 📁 Folder Structure

/server
├── index.js
├── models/
└── Message.js
/client
├── src/
├── App.js
└── components/

## 🔧 Prerequisites

- Node.js & npm
- MongoDB (local or Atlas account)
- Basic JavaScript and React knowledge

## 🏗️ Setup Instructions

### Server

```bash
cd server
npm init -y
npm install express mongoose socket.io cors


```

Client

cd client
npx create-react-app .
npm install socket.io-client axios
