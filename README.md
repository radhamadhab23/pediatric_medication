# Pediatric Medication Calculator

A full-stack application that helps calculate appropriate medication dosages for pediatric patients based on their age and weight.

## Project Structure

```
pediatric-medication/
├── client/              # Frontend React application
│   ├── src/            # Source files
│   └── package.json    # Frontend dependencies
└── server/             # Backend Node.js application
    ├── models/         # Database models
    ├── routes/         # API routes
    ├── server.js       # Main server file
    └── package.json    # Backend dependencies
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB installed and running locally
- npm or yarn package manager

### Backend Setup

1. Navigate to the server directory:

   ```bash
   cd server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a .env file with the following content:

   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/pediatric_meds
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:

   ```bash
   cd client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open http://localhost:3000 in your browser

## Usage

1. Enter the medication name
2. Input the patient's age (in years)
3. Input the patient's weight (in kilograms)
4. Click "Calculate Dosage" to get the recommended dosage

## Features

- Medication dosage calculation based on age and weight
- User-friendly interface
- Real-time validation
- Comprehensive medication database
- Notes and warnings for specific medications
