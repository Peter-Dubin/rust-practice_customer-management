# Customer Management Frontend

This is a React-based frontend application that provides a user interface for managing customer data. It connects to a Rust/Rocket backend API to perform CRUD operations on customer records.

## Features

- View list of customers with pagination and sorting
- Search customers by company name
- View detailed customer information
- Add new customers 
- Edit existing customer details
- Delete customers
- Responsive design for desktop and mobile

## Technical Details

- Built with React and TypeScript
- Fetch for API communication
- Form handling with React Hook Form

## Running the Project

1. Make sure you have Node.js and npm installed
2. Clone the repository
3. Run `npm install` to install dependencies
4. Make sure you have the `.env` file with the `API_URL` and backend API is running (see backend README)
5. Run `npm start` to start the development server
6. Frontend will be available at `http://localhost:3000`

## API Integration

The frontend connects to the backend API running at `http://localhost:8001` and utilizes the following endpoints:

- GET /customers - List customers with pagination/filtering
- GET /customers/{id} - Get single customer
- POST /customers - Create customer
- PUT /customers/{id} - Update customer
- DELETE /customers/{id} - Delete customer
