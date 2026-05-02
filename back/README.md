# Customer Management API

This is a RESTful API built with Rust and Rocket framework that provides customer management functionality. The API connects to a SQLite database (Northwind) and implements CRUD operations for customer records.

## Features

- Get all customers with pagination, filtering and sorting
- Get a single customer by ID 
- Create new customers
- Update existing customers
- Delete customers
- CORS enabled for cross-origin requests

## API Endpoints

### GET /customers
Get a list of customers with optional query parameters:
- page: Page number (default: 1)
- per_page: Number of records per page (default: 10) 
- name_filter: Filter customers by company name


### GET /customers/{id}
Get a single customer by ID

### POST /customers
Create a new customer

### PUT /customers/{id}
Update an existing customer

### DELETE /customers/{id}
Delete a customer

## Technical Details

- Built with Rust and Rocket web framework
- Uses SQLite database with rusqlite for data persistence
- Implements CORS middleware for cross-origin requests
- JSON serialization/deserialization with serde
- Thread-safe database access with Mutex
- Error handling and input validation

## Running the Project

1. Make sure you have Rust and Cargo installed
2. Clone the repository
3. Place the Northwind SQLite database file in the project root
4. Run `cargo run` to start the server
5. API will be available at `http://localhost:8001`
