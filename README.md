# 🎟️ Ticket Management System API

Welcome to the **Ticket Management System API**! 🚀 This project is a comprehensive API built using **Node.js**, **TypeScript**, **Express**, and **PostgreSQL**, providing key functionalities like user management, ticket creation, assignment, and detailed analytics, all while ensuring secure JWT-based authentication and robust request logging.

---

## 📋 Table of Contents

- [🎯 Objective](#🎯-objective)
- [🚀 Features](#🚀-features)
- [🛠 Technologies Used](#🛠-technologies-used)
- [📦 Installation](#📦-installation)
- [🔑 Environment Variables](#🔑-environment-variables)
- [🏃‍♂️ Running the Project](#🏃‍♂️-running-the-project)
- [🌐 API Endpoints](#🌐-api-endpoints)
  - [🧑‍💻 User Management](#🧑‍💻-user-management)
  - [🔐 Authentication](#🔐-authentication)
  - [🎟 Ticket Management](#🎟-ticket-management)
  - [👥 Ticket Assignment](#👥-ticket-assignment)
  - [📝 Ticket Details](#📝-ticket-details)
  - [📊 Ticket Analytics](#📊-ticket-analytics)
- [🛠 Database Setup](#🛠-database-setup)

---

## 🎯 Objective

The **Ticket Management System API** provides:

1. **User Management**: Create users and assign roles (admin, customer).
2. **JWT Authentication**: Secure login using JSON Web Tokens.
3. **Ticket Creation & Assignment**: Create, assign, and manage tickets.
4. **Ticket Analytics**: View detailed statistics and ticket progress.
5. **Comprehensive Logging**: Log each request with key details like IP, user info, request body, etc.

---

## 🚀 Features

- ✅ **Manage users**: Create, update, and assign roles.
- 🔐 **JWT-based authentication**: Secure and scalable access management.
- 📝 **Create, assign, and manage tickets** with statuses like `open`, `in-progress`, and `closed`.
- 📊 **Track ticket analytics**: Get reports on ticket statuses and user assignments.
- 🕵️‍♂️ **Comprehensive logging** of all requests for debugging and tracking user activity.

---

## 🛠 Technologies Used

- **Node.js**: Back-end runtime environment.
- **TypeScript**: Ensures type safety and improves code readability.
- **Express**: Fast, minimalist web framework for Node.js.
- **PostgreSQL**: Robust SQL database for structured data storage.
- **JWT (jsonwebtoken)**: Used for secure user authentication.
- **Moment.js**: Timezone and date handling, especially useful for logging timestamps.

---

## 📦 Installation

To get started with the project, follow these steps:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/ticket-management-system.git
   ```

2. **Navigate to the project directory**:

   ```bash
   cd ticket-management-system
   ```

3. **Install the dependencies**:

   ```bash
   npm install
   ```

---

## 🔑 Environment Variables

Before running the project, you need to configure your environment variables. Create a `.env` file in the root directory and add the following:

```bash
# Server configuration
PORT=5000

# PostgreSQL Database configuration
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_PORT=5432

# JWT Secret for token authentication
JWT_SECRET_KEY=your_jwt_secret_key
```

Make sure to replace the placeholder values with your actual configuration.

---

## 🏃‍♂️ Running the Project

Once you've set up your environment variables, run the following command to start the server:

```bash
npm run dev
```

The server will start on the port defined in your `.env` file (default: `5000`).

---

## 🌐 API Endpoints

### 🧑‍💻 User Management

- **Create a User**  
  `POST /users`  
  **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "type": "customer", // or "admin"
    "password": "password123"
  }
  ```
  **Response**:
  ```json
  {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
  ```

### 🔐 Authentication

- **Login**  
  `POST /auth/login`  
  **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
  **Response**:
  ```json
  {
    "token": "jwt_token"
  }
  ```

### 🎟 Ticket Management

- **Create a Ticket**  
  `POST /ticket`  
  **Headers**:  
  `Authorization: Bearer <jwt_token>`  
  **Request Body**:
  ```json
  {
    "title": "Concert Ticket",
    "description": "VIP concert ticket",
    "type": "concert",
    "venue": "Madison Square Garden",
    "status": "open",
    "price": 150,
    "priority": "high",
    "dueDate": "2024-08-01T18:00:00Z",
    "createdBy": "user_id"
  }
  ```
  **Response**:
  ```json
  {
    "id": "ticket_id",
    "title": "Concert Ticket",
    "status": "open",
    "priority": "high",
    "assignedUsers": []
  }
  ```

### 👥 Ticket Assignment

- **Assign User to a Ticket**  
  `POST /tickets/:ticketId/assign`  
  **Headers**:  
  `Authorization: Bearer <jwt_token>`  
  **Request Body**:
  ```json
  {
    "userId": "user_id"
  }
  ```
  **Response**:
  ```json
  {
    "message": "User assigned successfully"
  }
  ```

### 📝 Ticket Details

- **Get Ticket Details**  
  `GET /tickets/:ticketId`  
  **Headers**:  
  `Authorization: Bearer <jwt_token>`  
  **Response**:
  ```json
  {
    "id": "ticket_id",
    "title": "Concert Ticket",
    "description": "VIP concert ticket",
    "status": "open",
    "assignedUsers": [
      {
        "userId": "user_id_1",
        "name": "John Doe"
      }
    ]
  }
  ```

### 📊 Ticket Analytics

- **Get Ticket Analytics**  
  `GET /tickets/analytics`  
  **Headers**:  
  `Authorization: Bearer <jwt_token>`  
  **Query Parameters (optional)**:

  - `startDate`, `endDate`

  **Response**:

  ```json
  {
    "totalTickets": 50,
    "closedTickets": 30,
    "openTickets": 15,
    "inProgressTickets": 5,
    "priorityDistribution": {
      "low": 10,
      "medium": 20,
      "high": 20
    },
    "typeDistribution": {
      "concert": 20,
      "conference": 15,
      "sports": 15
    }
  }
  ```

---

## 🛠 Database Setup

### Users Table Creation

```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    active_flag INTEGER DEFAULT 1,
    last_login TIMESTAMP,
    jwt_token TEXT,
    plain_password VARCHAR(255),
    registered_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tickets Table Creation

```sql
CREATE TABLE tickets (
    ticket_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    venue VARCHAR(255),
    status VARCHAR(50),
    price NUMERIC(10, 2),
    priority VARCHAR(50),
    due_date TIMESTAMP,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_users JSONB
);
```

### User Logs Table Creation

```sql
CREATE TABLE user_logs (
    id SERIAL PRIMARY KEY,
    user_id INT,
    jwt_token TEXT,
    method VARCHAR(10),
    path TEXT,
    ip_addr VARCHAR(45),
    timestamp TIMESTAMPTZ,
    request_body JSONB,
    user_agent TEXT,
    referer TEXT
);
```
