# Backend — Customer Management API

RESTful API built with **Rust** and the **Rocket 0.5** framework. Connects to a SQLite (Northwind) database via `rusqlite` and exposes full CRUD operations for customers and suppliers.

**Runs on:** `http://localhost:8001`

---

## Tech Stack

| Crate | Version | Purpose |
|-------|---------|---------|
| rocket | 0.5 | HTTP framework + routing |
| rusqlite | 0.31 (bundled) | SQLite access |
| serde / serde_json | 1.0 | JSON serialization |
| rocket_cors | 0.6 | CORS middleware |

---

## API Reference

### Customers

#### `GET /customers`
Returns a paginated list of customers.

| Query param | Type | Default | Description |
|-------------|------|---------|-------------|
| `page` | int | 1 | Page number (min 1) |
| `per_page` | int | 10 | Records per page (1–100) |
| `name_filter` | string | — | Filter by company name (partial match) |
| `order_by` | string | — | Column to sort by (e.g. `CompanyName`) |
| `order_direction` | string | — | `ASC` or `DESC` |

**Response:**
```json
{
  "data": [ { "customer_id": "ALFKI", "company_name": "...", ... } ],
  "total": 91,
  "page": 1,
  "per_page": 10
}
```

#### `GET /customers/{id}`
Returns a single customer by `customer_id` (string). Returns `404` if not found.

#### `POST /customers`
Creates a new customer. `customer_id` and `company_name` are required; all other fields are optional.

```json
{
  "customer_id": "DEMO1",
  "company_name": "Demo Company",
  "contact_name": "John Doe",
  "contact_title": "CEO",
  "address": "123 Main St",
  "city": "Demo City",
  "region": "Demo Region",
  "postal_code": "12345",
  "country": "Demo Country",
  "phone": "123-456-7890",
  "fax": "098-765-4321"
}
```

#### `PUT /customers/{id}`
Updates an existing customer. `company_name` is required; all other fields are optional. Returns `404` if not found.

#### `DELETE /customers/{id}`
Deletes a customer by ID. Returns `404` if not found.

---

### Suppliers

#### `GET /suppliers`
Returns a paginated list of suppliers. Accepts the same query parameters as `GET /customers`.

**Response:**
```json
{
  "data": [ { "supplier_id": 1, "company_name": "...", "home_page": null, ... } ],
  "total": 29,
  "page": 1,
  "per_page": 10
}
```

#### `GET /suppliers/{id}`
Returns a single supplier by `supplier_id` (integer). Returns `404` if not found.

#### `POST /suppliers`
Creates a new supplier. `supplier_id` is auto-generated. Only `company_name` is required.

```json
{
  "company_name": "New Supplier Co.",
  "contact_name": "Jane Smith",
  "contact_title": "Sales Manager",
  "address": "456 Trade Ave",
  "city": "Boston",
  "region": "MA",
  "postal_code": "02101",
  "country": "USA",
  "phone": "617-555-0100",
  "fax": "617-555-0101",
  "home_page": "https://newsupplier.example.com"
}
```

#### `PUT /suppliers/{id}`
Updates an existing supplier. `company_name` is required. Returns `404` if not found.

#### `DELETE /suppliers/{id}`
Deletes a supplier by ID. Returns `404` if not found.

---

## Running Locally

```bash
# From the back/ directory
cargo run
```

Ensure `northwind.db` is present in `back/`. The server binds to port `8001` (configured in `Rocket.toml`).

---

## Source Layout

| File | Responsibility |
|------|----------------|
| `src/main.rs` | Rocket ignition, CORS setup, route mounting |
| `src/models.rs` | Customer / Supplier structs, query param structs |
| `src/routes.rs` | Route handlers (thin layer over db) |
| `src/db.rs` | All SQL queries and database logic |
