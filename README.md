# Customer Management Application

A full-stack web application for managing customers and suppliers, built with a **Rust/Rocket** REST API backend and a **Next.js 14** frontend. Data is persisted in a SQLite (Northwind) database.

---

## Architecture Overview

```
customer_management/
├── back/       # Rust + Rocket REST API  (port 8001)
└── front/      # Next.js 14 + MUI frontend (port 3000)
```

**Backend stack:** Rust · Rocket 0.5 · rusqlite 0.31 · serde · rocket_cors

**Frontend stack:** Next.js 14 · React 18 · TypeScript 5 · MUI v5 · React Hook Form v7

---

## Features

### Customers
- List all customers with pagination, search by company name, and multi-column sorting
- View, create, edit, and delete individual customer records

### Suppliers
- List all suppliers with pagination, search by company name, and multi-column sorting
- View, create, edit, and delete individual supplier records

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers` | List customers (pagination, filter, sort) |
| GET | `/customers/{id}` | Get customer by ID |
| POST | `/customers` | Create a customer |
| PUT | `/customers/{id}` | Update a customer |
| DELETE | `/customers/{id}` | Delete a customer |
| GET | `/suppliers` | List suppliers (pagination, filter, sort) |
| GET | `/suppliers/{id}` | Get supplier by ID |
| POST | `/suppliers` | Create a supplier |
| PUT | `/suppliers/{id}` | Update a supplier |
| DELETE | `/suppliers/{id}` | Delete a supplier |

Query parameters for list endpoints: `page`, `per_page`, `name_filter`, `order_by`, `order_direction`

---

## Getting Started

### Prerequisites

- [Rust + Cargo](https://rustup.rs/)
- [Node.js 18+](https://nodejs.org/) and npm

### Backend

```bash
cd back
cargo run
# API available at http://localhost:8001
```

> The Northwind SQLite database (`northwind.db`) must be present in the `back/` directory.

### Frontend

```bash
cd front
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:8001
npm run dev
# App available at http://localhost:3000
```

---

## Project Structure

```
back/src/
├── main.rs      # Rocket setup, CORS, routes registration
├── models.rs    # Customer / Supplier structs + query params
├── routes.rs    # HTTP route handlers
└── db.rs        # Database access layer (rusqlite)

front/src/
├── app/
│   ├── customers/   # Customers list page + detail page
│   └── suppliers/   # Suppliers list page
├── components/      # CustomerTable, CustomerForm, SupplierTable, SupplierForm, etc.
├── types/           # TypeScript interfaces (Customer, Supplier)
└── lib/api.ts       # Fetch wrapper for all API calls
```
