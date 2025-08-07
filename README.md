![App Screenshot](https://i.ibb.co/r2YDdhpr/blood-connect-white-logo-nobg.png)

# Blood Donation Application - (Blood Connect)

A web application that helps users find and manage blood donors efficiently through a smart, location-based search and admin-controlled dashboard.

## Live Link

- Please Visit [Blood Connect](https://bloodconnect-3e8aa.web.app/) !

## ✅ Features of Blood Connect App

- 🔐 **Authentication & Authorization**  
  Secure login via Firebase with JWT-based API access and role-based control.

- 🩸 **Find Blood Donors Easily**  
  Filter donors by blood group, district, and upazila with responsive search.

- 📍 **Smart Location Filtering**  
  Upazila options dynamically appear based on district selection.

- 🧑‍🤝‍🧑 **Role-Based Dashboards**  
  Separate dashboards for Admin, Volunteer, and Donor with custom privileges.

- 💾 **CRUD for Donation Requests**  
  Donors can create/edit/delete requests. Admins manage all requests with status updates.

- 📝 **Blog Publishing System (CMS)**  
  Volunteers/Admins can create, update, and delete formatted blog posts with Jodit Editor.

- 📊 **Dashboard Statistics**  
  Admin dashboard includes: total users, total requests, and funds raised.

- 🚦 **Donation Status Workflow**  
  Statuses like pending, inprogress, done, and canceled are managed by Admin/Volunteers.

- 🧪 **Optimized API Requests**  
  All GET endpoints use TanStack Query with caching and refetching.

- 📂 **Pagination and Filtering**  
  Efficient list management with pagination and filters (status, role).

- 🔔 **Smart Notifications**  
  All interactions are confirmed using SweetAlert2 instead of native alerts.

- 🔒 **JWT-Protected Routes**  
  User sessions persist with secure localStorage and auto re-authentication.

- 💳 **Donation Page with Stripe**  
  Secure funding and payment processing via Stripe; donation history is saved.

- 📱 **Responsive UI**  
  Fully responsive design using Tailwind CSS and daisyUI, optimized for all screen sizes.

- 🌐 **Environment Variables & Secure Deployment**  
  All credentials are secured via .env files. Hosted using Netlify & Render.


## npm packages in Server Side


- Use [node.js](https://nodejs.org/) for server-side scripting and building web applications.
- Uses [express](https://expressjs.com/) to build web applications and APIs easily with routing, middleware, and request handling.
- Uses [nodemon](https://nodemon.io/) for automatically restarts a Node.js application when file changes are detected during development.
- Uses [cors](https://expressjs.com/en/resources/middleware/cors.html) for enabling controlled access to resources from different origins in web applications.
- Uses [dotenv](https://dotenvx.com/) environment variables from a .env file into process.env for secure configuration management.
- Uses [MongoDB](https://www.mongodb.com/)  for storing, querying, and managing large volumes of flexible, JSON-like data in web and mobile applications.
- Uses [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database) for hosting, managing, and scaling MongoDB databases in the cloud securely.
- Uses [stripe](https://stripe.com/) to easily integrate secure payment processing and manage transactions
- Uses [JWT](https://jwt.io/) to securely transmit user authentication data between client and server in web applications.
- Uses [Vercel](https://vercel.com/) for deploying, hosting, and scaling frontend web applications with speed, simplicity, and automation.

## Technologies Used

- ![Node.js](https://img.shields.io/badge/nodedotjs-v22.12.0-155dfc?logo=nodedotjs&logoColor=%235FA04E)
- ![Express](https://img.shields.io/badge/Express-v5.1.0-155dfc?logo=express&logoColor=%23000000)
- ![Mongodb](https://img.shields.io/badge/mongodb-v6.17.0-155dfc?logo=mongodb&logoColor=%2347A248)
- ![.env](https://img.shields.io/badge/.env-v17.2.0-155dfc?logo=dotenv&logoColor=%23ECD53F)
- ![JWT](https://img.shields.io/badge/jsonwebtokens-v9.0.2-155dfc?logo=jsonwebtokens&logoColor=%23000000)
- ![Stripe](https://img.shields.io/badge/Stripe-v18.0.0-155dfc?logo=stripe&logoColor=%23635BFF)
- ![Vercel](https://img.shields.io/badge/Vercel-ffffff?logo=vercel&logoColor=%23000000)


## 🛠️ Installation & Setup Instructions

Follow the steps below to set up the **Blood Connect** application locally:

---

### 1. Clone the Repositories

```bash
git clone https://github.com/Arman3747/BloodConnect-Client.git
git clone https://github.com/Arman3747/BloodConnect-Server.git
```

---

### 2. Client Setup

```bash
cd BloodConnect-Client
npm install
```

Create a `.env.local` file in the root of the client folder and add the following:

```env
VITE_apiKey=your_firebase_key
VITE_authDomain=your_auth_domain
VITE_projectId=your_project_id
VITE_storageBucket=your_storage_bucket
VITE_messagingSenderId=your_sender_id
VITE_appId=your_app_id
VITE_image_upload_key=your_imbb_image_upload_key
VITE_PAYMENT_KEY=your_stripe_payment_key
```

Then start the client:

```bash
npm run dev
```

---

### 3. Server Setup

```bash
cd BloodConnect-Server
npm install
```

Create a `.env` file in the root of the server folder and add the following:

```env

BloodConnect_DB_USER=your_mongodb_admin_username
BloodConnect_DB_PASS=your_mongodb_admin_password
PAYMENT_GATEWAY_KEY=your_stripe_payment_key
FB_SERVICE_KEY=your_FireBase_service_key

```

Then start the server:

```bash
nodemon index.js
```
---

### Thank you for Reading!