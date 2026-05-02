# Customer Management – Implementation Plan
> Optimized for Claude Code execution · Full-stack: Rust/Rocket backend + Next.js/MUI frontend

---

## Context
Greenfield project. Only README files and `back/test.http` exist. This plan builds both the backend API and the frontend UI from scratch, following the requirements in the seed files.

---

## 1. Project Structure

```
customer_management/
├── README.md
├── plans/
│   └── customer-management-implementation-plan.md
├── back/
│   ├── Cargo.toml
│   ├── Rocket.toml
│   ├── northwind.db          ← user must supply this
│   ├── test.http
│   └── src/
│       ├── main.rs
│       ├── models.rs
│       ├── db.rs
│       └── routes.rs
└── front/
    ├── package.json
    ├── tsconfig.json
    ├── next.config.mjs
    ├── .env.example
    ├── .env.local
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx
        │   └── customers/
        │       ├── page.tsx
        │       └── [id]/
        │           └── page.tsx
        ├── components/
        │   ├── CustomerTable.tsx
        │   ├── CustomerForm.tsx
        │   └── ConfirmDialog.tsx
        ├── lib/
        │   └── api.ts
        └── types/
            └── customer.ts
```

---

## 2. Prerequisites

- Rust + Cargo (stable toolchain)
- Node.js ≥ 18 + npm
- Northwind SQLite database file (`northwind.db`) placed at `back/northwind.db`

The Northwind Customers table schema expected:
```sql
CREATE TABLE Customers (
  CustomerID   TEXT PRIMARY KEY,
  CompanyName  TEXT NOT NULL,
  ContactName  TEXT,
  ContactTitle TEXT,
  Address      TEXT,
  City         TEXT,
  Region       TEXT,
  PostalCode   TEXT,
  Country      TEXT,
  Phone        TEXT,
  Fax          TEXT
);
```

---

## 3. Backend – Rust / Rocket

### 3.1 `back/Cargo.toml`
```toml
[package]
name = "customer-management-api"
version = "0.1.0"
edition = "2021"

[dependencies]
rocket = { version = "0.5", features = ["json"] }
rusqlite = { version = "0.31", features = ["bundled"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
rocket_cors = "0.6"
```

### 3.2 `back/Rocket.toml`
```toml
[default]
port = 8001
address = "0.0.0.0"
```

### 3.3 `back/src/models.rs`

Types for the Customer entity and API request/response shapes:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Customer {
    pub customer_id: String,
    pub company_name: String,
    pub contact_name: Option<String>,
    pub contact_title: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub region: Option<String>,
    pub postal_code: Option<String>,
    pub country: Option<String>,
    pub phone: Option<String>,
    pub fax: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCustomerRequest {
    pub customer_id: String,
    pub company_name: String,
    pub contact_name: Option<String>,
    pub contact_title: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub region: Option<String>,
    pub postal_code: Option<String>,
    pub country: Option<String>,
    pub phone: Option<String>,
    pub fax: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCustomerRequest {
    pub company_name: String,
    pub contact_name: Option<String>,
    pub contact_title: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub region: Option<String>,
    pub postal_code: Option<String>,
    pub country: Option<String>,
    pub phone: Option<String>,
    pub fax: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T: Serialize> {
    pub data: Vec<T>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
}

#[derive(Debug, FromForm)]
pub struct CustomerQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub name_filter: Option<String>,
    pub order_by: Option<String>,
    pub order_direction: Option<String>,
}
```

### 3.4 `back/src/db.rs`

Database access layer wrapping a `Mutex<Connection>`:

```rust
use rusqlite::{Connection, Result, params};
use std::sync::Mutex;
use crate::models::{Customer, CreateCustomerRequest, UpdateCustomerRequest, PaginatedResponse};

pub struct Db(pub Mutex<Connection>);

impl Db {
    pub fn open(path: &str) -> Result<Self> {
        let conn = Connection::open(path)?;
        Ok(Db(Mutex::new(conn)))
    }

    pub fn list_customers(
        &self,
        page: i64,
        per_page: i64,
        name_filter: Option<&str>,
        order_by: Option<&str>,
        order_direction: Option<&str>,
    ) -> Result<PaginatedResponse<Customer>> {
        let conn = self.0.lock().unwrap();
        let offset = (page - 1) * per_page;

        let allowed_columns = ["CompanyName", "ContactName", "City", "Country", "CustomerID"];
        let order_col = order_by
            .filter(|c| allowed_columns.contains(c))
            .unwrap_or("CompanyName");
        let order_dir = match order_direction {
            Some(d) if d.to_uppercase() == "DESC" => "DESC",
            _ => "ASC",
        };

        let filter_val = name_filter.map(|f| format!("%{}%", f));

        // Split SQL by filter presence so parameter indices are always contiguous
        let (count_sql, list_sql) = if filter_val.is_some() {
            (
                "SELECT COUNT(*) FROM Customers WHERE CompanyName LIKE ?1".to_string(),
                format!(
                    "SELECT CustomerID, CompanyName, ContactName, ContactTitle, \
                     Address, City, Region, PostalCode, Country, Phone, Fax \
                     FROM Customers WHERE CompanyName LIKE ?1 \
                     ORDER BY {} {} LIMIT ?2 OFFSET ?3",
                    order_col, order_dir
                ),
            )
        } else {
            (
                "SELECT COUNT(*) FROM Customers".to_string(),
                format!(
                    "SELECT CustomerID, CompanyName, ContactName, ContactTitle, \
                     Address, City, Region, PostalCode, Country, Phone, Fax \
                     FROM Customers ORDER BY {} {} LIMIT ?1 OFFSET ?2",
                    order_col, order_dir
                ),
            )
        };

        let total: i64 = if let Some(ref fv) = filter_val {
            conn.query_row(&count_sql, params![fv], |r| r.get(0))?
        } else {
            conn.query_row(&count_sql, [], |r| r.get(0))?
        };

        let mut stmt = conn.prepare(&list_sql)?;
        let map_row = |r: &rusqlite::Row| -> rusqlite::Result<Customer> {
            Ok(Customer {
                customer_id: r.get(0)?,
                company_name: r.get(1)?,
                contact_name: r.get(2)?,
                contact_title: r.get(3)?,
                address: r.get(4)?,
                city: r.get(5)?,
                region: r.get(6)?,
                postal_code: r.get(7)?,
                country: r.get(8)?,
                phone: r.get(9)?,
                fax: r.get(10)?,
            })
        };

        let customers: Vec<Customer> = if let Some(ref fv) = filter_val {
            stmt.query_map(params![fv, per_page, offset], map_row)?
                .collect::<Result<Vec<_>>>()?
        } else {
            stmt.query_map(params![per_page, offset], map_row)?
                .collect::<Result<Vec<_>>>()?
        };

        Ok(PaginatedResponse { data: customers, total, page, per_page })
    }

    pub fn get_customer(&self, id: &str) -> Result<Option<Customer>> {
        let conn = self.0.lock().unwrap();
        let sql = "SELECT CustomerID, CompanyName, ContactName, ContactTitle, \
                   Address, City, Region, PostalCode, Country, Phone, Fax \
                   FROM Customers WHERE CustomerID = ?1";
        let result = conn.query_row(sql, params![id], |r| Ok(Customer {
            customer_id: r.get(0)?,
            company_name: r.get(1)?,
            contact_name: r.get(2)?,
            contact_title: r.get(3)?,
            address: r.get(4)?,
            city: r.get(5)?,
            region: r.get(6)?,
            postal_code: r.get(7)?,
            country: r.get(8)?,
            phone: r.get(9)?,
            fax: r.get(10)?,
        }));
        match result {
            Ok(c) => Ok(Some(c)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn create_customer(&self, req: &CreateCustomerRequest) -> Result<Customer> {
        let conn = self.0.lock().unwrap();
        conn.execute(
            "INSERT INTO Customers \
             (CustomerID, CompanyName, ContactName, ContactTitle, \
              Address, City, Region, PostalCode, Country, Phone, Fax) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                req.customer_id, req.company_name, req.contact_name, req.contact_title,
                req.address, req.city, req.region, req.postal_code,
                req.country, req.phone, req.fax
            ],
        )?;
        Ok(Customer {
            customer_id: req.customer_id.clone(),
            company_name: req.company_name.clone(),
            contact_name: req.contact_name.clone(),
            contact_title: req.contact_title.clone(),
            address: req.address.clone(),
            city: req.city.clone(),
            region: req.region.clone(),
            postal_code: req.postal_code.clone(),
            country: req.country.clone(),
            phone: req.phone.clone(),
            fax: req.fax.clone(),
        })
    }

    pub fn update_customer(&self, id: &str, req: &UpdateCustomerRequest) -> Result<bool> {
        let conn = self.0.lock().unwrap();
        let rows = conn.execute(
            "UPDATE Customers SET \
             CompanyName=?1, ContactName=?2, ContactTitle=?3, Address=?4, \
             City=?5, Region=?6, PostalCode=?7, Country=?8, Phone=?9, Fax=?10 \
             WHERE CustomerID=?11",
            params![
                req.company_name, req.contact_name, req.contact_title, req.address,
                req.city, req.region, req.postal_code, req.country,
                req.phone, req.fax, id
            ],
        )?;
        Ok(rows > 0)
    }

    pub fn delete_customer(&self, id: &str) -> Result<bool> {
        let conn = self.0.lock().unwrap();
        let rows = conn.execute(
            "DELETE FROM Customers WHERE CustomerID = ?1",
            params![id],
        )?;
        Ok(rows > 0)
    }
}
```

### 3.5 `back/src/routes.rs`

All Rocket route handlers:

```rust
use rocket::{State, http::Status, serde::json::Json};
use crate::db::Db;
use crate::models::{CreateCustomerRequest, UpdateCustomerRequest, CustomerQuery};

#[get("/customers?<query..>")]
pub fn list_customers(
    db: &State<Db>,
    query: CustomerQuery,
) -> Result<Json<serde_json::Value>, Status> {
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(10).clamp(1, 100);

    db.list_customers(
        page,
        per_page,
        query.name_filter.as_deref(),
        query.order_by.as_deref(),
        query.order_direction.as_deref(),
    )
    .map(|r| Json(serde_json::to_value(r).unwrap()))
    .map_err(|_| Status::InternalServerError)
}

#[get("/customers/<id>")]
pub fn get_customer(db: &State<Db>, id: &str) -> Result<Json<serde_json::Value>, Status> {
    match db.get_customer(id) {
        Ok(Some(c)) => Ok(Json(serde_json::to_value(c).unwrap())),
        Ok(None) => Err(Status::NotFound),
        Err(_) => Err(Status::InternalServerError),
    }
}

#[post("/customers", format = "json", data = "<req>")]
pub fn create_customer(
    db: &State<Db>,
    req: Json<CreateCustomerRequest>,
) -> Result<Json<serde_json::Value>, Status> {
    db.create_customer(&req.into_inner())
        .map(|c| Json(serde_json::to_value(c).unwrap()))
        .map_err(|_| Status::InternalServerError)
}

#[put("/customers/<id>", format = "json", data = "<req>")]
pub fn update_customer(
    db: &State<Db>,
    id: &str,
    req: Json<UpdateCustomerRequest>,
) -> Result<Json<serde_json::Value>, Status> {
    match db.update_customer(id, &req.into_inner()) {
        Ok(true) => Ok(Json(serde_json::json!({"message": "updated"}))),
        Ok(false) => Err(Status::NotFound),
        Err(_) => Err(Status::InternalServerError),
    }
}

#[delete("/customers/<id>")]
pub fn delete_customer(db: &State<Db>, id: &str) -> Result<Json<serde_json::Value>, Status> {
    match db.delete_customer(id) {
        Ok(true) => Ok(Json(serde_json::json!({"message": "deleted"}))),
        Ok(false) => Err(Status::NotFound),
        Err(_) => Err(Status::InternalServerError),
    }
}
```

### 3.6 `back/src/main.rs`

```rust
#[macro_use]
extern crate rocket;

mod db;
mod models;
mod routes;

use db::Db;
use rocket_cors::{AllowedOrigins, CorsOptions};

#[launch]
fn rocket() -> _ {
    let db = Db::open("northwind.db").expect("Failed to open northwind.db");

    let cors = CorsOptions::default()
        .allowed_origins(AllowedOrigins::all())
        .to_cors()
        .expect("CORS configuration error");

    rocket::build()
        .manage(db)
        .attach(cors)
        .mount(
            "/",
            routes![
                routes::list_customers,
                routes::get_customer,
                routes::create_customer,
                routes::update_customer,
                routes::delete_customer,
            ],
        )
}
```

---

## 4. Frontend – Next.js 14 / React / TypeScript / MUI

### 4.1 `front/package.json`
```json
{
  "name": "customer-management-front",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.2.29",
    "react": "^18",
    "react-dom": "^18",
    "@mui/material": "^5",
    "@mui/icons-material": "^5",
    "@emotion/react": "^11",
    "@emotion/styled": "^11",
    "react-hook-form": "^7"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5"
  }
}
```

### 4.2 `front/.env.example` and `front/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8001
```

### 4.3 `front/tsconfig.json`
Standard Next.js 14 tsconfig with path alias `@/*` → `./src/*`:
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 4.4 `front/next.config.mjs`
Next.js 14.x does not support `next.config.ts`. Use `.mjs` instead:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
```

### 4.5 `front/src/types/customer.ts`
```ts
export interface Customer {
  customer_id: string;
  company_name: string;
  contact_name?: string;
  contact_title?: string;
  address?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  fax?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface CustomerQuery {
  page?: number;
  per_page?: number;
  name_filter?: string;
  order_by?: string;
  order_direction?: 'ASC' | 'DESC';
}
```

### 4.6 `front/src/lib/api.ts`
```ts
import { Customer, CustomerQuery, PaginatedResponse } from '@/types/customer';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8001';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (res.status === 204) return null as T;
  return res.json();
}

export const api = {
  listCustomers(q: CustomerQuery = {}): Promise<PaginatedResponse<Customer>> {
    const params = new URLSearchParams();
    if (q.page)            params.set('page', String(q.page));
    if (q.per_page)        params.set('per_page', String(q.per_page));
    if (q.name_filter)     params.set('name_filter', q.name_filter);
    if (q.order_by)        params.set('order_by', q.order_by);
    if (q.order_direction) params.set('order_direction', q.order_direction);
    return request(`/customers?${params}`);
  },
  getCustomer(id: string): Promise<Customer> {
    return request(`/customers/${encodeURIComponent(id)}`);
  },
  createCustomer(data: Customer): Promise<Customer> {
    return request('/customers', { method: 'POST', body: JSON.stringify(data) });
  },
  updateCustomer(id: string, data: Partial<Customer>): Promise<void> {
    return request(`/customers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  deleteCustomer(id: string): Promise<void> {
    return request(`/customers/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};
```

### 4.7 `front/src/app/layout.tsx`
Root layout with MUI ThemeProvider, CssBaseline, and AppBar:

```tsx
'use client';

import { ReactNode } from 'react';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, Container, Box } from '@mui/material';

const theme = createTheme();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div">
                Customer Management
              </Typography>
            </Toolbar>
          </AppBar>
          <Container maxWidth="xl">
            <Box sx={{ mt: 3 }}>{children}</Box>
          </Container>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 4.8 `front/src/app/page.tsx`
```tsx
import { redirect } from 'next/navigation';
export default function Home() {
  redirect('/customers');
}
```

### 4.9 `front/src/app/customers/page.tsx` (`'use client'`)

Main list page managing all state and orchestrating the three components:

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Snackbar, TextField, InputAdornment,
  Typography, CircularProgress, Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { api } from '@/lib/api';
import { Customer, CustomerQuery } from '@/types/customer';
import CustomerTable from '@/components/CustomerTable';
import CustomerForm from '@/components/CustomerForm';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [nameFilter, setNameFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
  const [orderDir, setOrderDir] = useState<'ASC' | 'DESC'>('ASC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | undefined>(undefined);

  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q: CustomerQuery = { page, per_page: perPage };
      if (nameFilter) q.name_filter = nameFilter;
      if (orderBy) { q.order_by = orderBy; q.order_direction = orderDir; }
      const result = await api.listCustomers(q);
      setCustomers(result.data);
      setTotal(result.total);
    } catch {
      setError('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, nameFilter, orderBy, orderDir]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleSearch = () => {
    setPage(1);
    setNameFilter(searchInput);
  };

  const handleSort = (col: string) => {
    if (orderBy === col) {
      setOrderDir(d => d === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setOrderBy(col);
      setOrderDir('ASC');
    }
    setPage(1);
  };

  const handleEdit = (c: Customer) => { setEditCustomer(c); setFormOpen(true); };
  const handleAdd = () => { setEditCustomer(undefined); setFormOpen(true); };
  const handleFormSuccess = (msg: string) => {
    setFormOpen(false);
    setSnackbar(msg);
    fetchCustomers();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteCustomer(deleteTarget.customer_id);
      setSnackbar(`"${deleteTarget.company_name}" deleted.`);
      setDeleteTarget(null);
      fetchCustomers();
    } catch {
      setSnackbar('Failed to delete customer.');
      setDeleteTarget(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Customers</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Customer
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search by company name…"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          sx={{ width: 320 }}
        />
        <Button variant="outlined" onClick={handleSearch}>Search</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <CustomerTable
          customers={customers}
          total={total}
          page={page}
          perPage={perPage}
          orderBy={orderBy}
          orderDir={orderDir}
          onSort={handleSort}
          onPageChange={setPage}
          onPerPageChange={p => { setPerPage(p); setPage(1); }}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
        />
      )}

      <CustomerForm
        open={formOpen}
        customer={editCustomer}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteTarget?.company_name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
      />
    </Box>
  );
}
```

### 4.10 `front/src/app/customers/[id]/page.tsx` (`'use client'`)

Customer detail view:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Button, Typography, Paper, Grid, CircularProgress, Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { api } from '@/lib/api';
import { Customer } from '@/types/customer';
import CustomerForm from '@/components/CustomerForm';

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <Grid item xs={12} sm={6}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body1">{value ?? '—'}</Typography>
    </Grid>
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setCustomer(await api.getCustomer(id));
    } catch {
      setError('Customer not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  if (error || !customer) return <Alert severity="error">{error ?? 'Not found'}</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/customers')}>Back</Button>
        <Button variant="contained" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>Edit</Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>{customer.company_name}</Typography>
        <Grid container spacing={2}>
          <Field label="Customer ID" value={customer.customer_id} />
          <Field label="Contact Name" value={customer.contact_name} />
          <Field label="Contact Title" value={customer.contact_title} />
          <Field label="Address" value={customer.address} />
          <Field label="City" value={customer.city} />
          <Field label="Region" value={customer.region} />
          <Field label="Postal Code" value={customer.postal_code} />
          <Field label="Country" value={customer.country} />
          <Field label="Phone" value={customer.phone} />
          <Field label="Fax" value={customer.fax} />
        </Grid>
      </Paper>

      <CustomerForm
        open={editOpen}
        customer={customer}
        onClose={() => setEditOpen(false)}
        onSuccess={() => { setEditOpen(false); load(); }}
      />
    </Box>
  );
}
```

### 4.11 `front/src/components/CustomerTable.tsx` (`'use client'`)

MUI Table with sortable headers, pagination, and row actions:

```tsx
'use client';

import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TableSortLabel, Paper, IconButton, Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Customer } from '@/types/customer';

interface Props {
  customers: Customer[];
  total: number;
  page: number;
  perPage: number;
  orderBy?: string;
  orderDir: 'ASC' | 'DESC';
  onSort: (col: string) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onEdit: (c: Customer) => void;
  onDelete: (c: Customer) => void;
}

const SORTABLE_COLS = [
  { id: 'CompanyName', label: 'Company Name' },
  { id: 'ContactName', label: 'Contact Name' },
  { id: 'City', label: 'City' },
  { id: 'Country', label: 'Country' },
];

export default function CustomerTable({
  customers, total, page, perPage, orderBy, orderDir,
  onSort, onPageChange, onPerPageChange, onEdit, onDelete,
}: Props) {
  return (
    <Paper>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {SORTABLE_COLS.map(col => (
                <TableCell key={col.id}>
                  <TableSortLabel
                    active={orderBy === col.id}
                    direction={orderBy === col.id ? orderDir.toLowerCase() as 'asc' | 'desc' : 'asc'}
                    onClick={() => onSort(col.id)}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell>Phone</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map(c => (
              <TableRow key={c.customer_id} hover>
                <TableCell>{c.company_name}</TableCell>
                <TableCell>{c.contact_name ?? '—'}</TableCell>
                <TableCell>{c.city ?? '—'}</TableCell>
                <TableCell>{c.country ?? '—'}</TableCell>
                <TableCell>{c.phone ?? '—'}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => onEdit(c)}><EditIcon fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => onDelete(c)}><DeleteIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">No customers found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page - 1}
        rowsPerPage={perPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPageChange={(_, p) => onPageChange(p + 1)}
        onRowsPerPageChange={e => onPerPageChange(parseInt(e.target.value, 10))}
      />
    </Paper>
  );
}
```

### 4.12 `front/src/components/CustomerForm.tsx` (`'use client'`)

MUI Dialog with react-hook-form for create and edit:

```tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid,
} from '@mui/material';
import { api } from '@/lib/api';
import { Customer } from '@/types/customer';

interface Props {
  open: boolean;
  customer?: Customer;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export default function CustomerForm({ open, customer, onClose, onSuccess }: Props) {
  const isEdit = !!customer;
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Customer>({
    defaultValues: customer ?? {},
  });

  useEffect(() => { reset(customer ?? {}); }, [customer, reset]);

  const onSubmit = async (data: Customer) => {
    try {
      if (isEdit && customer) {
        await api.updateCustomer(customer.customer_id, data);
        onSuccess(`"${data.company_name}" updated successfully.`);
      } else {
        await api.createCustomer(data);
        onSuccess(`"${data.company_name}" created successfully.`);
      }
    } catch {
      onSuccess('Operation failed. Please try again.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{isEdit ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Customer ID *"
                fullWidth
                disabled={isEdit}
                {...register('customer_id', { required: !isEdit })}
                error={!!errors.customer_id}
                helperText={errors.customer_id ? 'Required' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Company Name *"
                fullWidth
                {...register('company_name', { required: true })}
                error={!!errors.company_name}
                helperText={errors.company_name ? 'Required' : ''}
              />
            </Grid>
            {([
              ['contact_name', 'Contact Name'],
              ['contact_title', 'Contact Title'],
              ['address', 'Address'],
              ['city', 'City'],
              ['region', 'Region'],
              ['postal_code', 'Postal Code'],
              ['country', 'Country'],
              ['phone', 'Phone'],
              ['fax', 'Fax'],
            ] as [keyof Customer, string][]).map(([field, label]) => (
              <Grid item xs={12} sm={6} key={field}>
                <TextField label={label} fullWidth {...register(field)} />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
```

### 4.13 `front/src/components/ConfirmDialog.tsx` (`'use client'`)

```tsx
'use client';

import {
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button,
} from '@mui/material';

interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">Delete</Button>
      </DialogActions>
    </Dialog>
  );
}
```

---

## 5. Running the Project

### Backend
```bash
cd back
# Place northwind.db in the back/ directory first
cargo run
# API available at http://localhost:8001
```

### Frontend
```bash
cd front
npm install
cp .env.example .env.local
npm run dev
# UI available at http://localhost:3000
```

---

## 6. Verification Checklist

Use `back/test.http` to verify all API endpoints, then exercise the UI:

- [ ] `GET http://localhost:8001/customers` → JSON with `{ data, total, page, per_page }`
- [ ] `GET http://localhost:8001/customers?page=2&per_page=5` → correct page slice
- [ ] `GET http://localhost:8001/customers?name_filter=Demo` → filtered results
- [ ] `GET http://localhost:8001/customers?order_by=CompanyName&order_direction=DESC` → sorted DESC
- [ ] `GET http://localhost:8001/customers?page=1&per_page=5&name_filter=a&order_by=CompanyName&order_direction=ASC` → combined filters
- [ ] `POST http://localhost:8001/customers` (test.http payload) → creates DEMO1
- [ ] `PUT http://localhost:8001/customers/DEMO1` → updates DEMO1
- [ ] `DELETE http://localhost:8001/customers/DEMO1` → deletes DEMO1
- [ ] `GET http://localhost:8001/customers/NONEXISTENT` → 404
- [ ] Frontend list loads and paginates correctly
- [ ] Search by company name filters the list
- [ ] Column header click sorts ASC → DESC → ASC
- [ ] "Add Customer" dialog creates a record and list refreshes
- [ ] "Edit" dialog pre-fills all fields and updates the record
- [ ] "Delete" confirm dialog removes the record and list refreshes

---

## 7. Implementation Order for Claude Code

```
1.  mkdir plans/  →  write this file
2.  back/Cargo.toml
3.  back/Rocket.toml
4.  back/src/models.rs
5.  back/src/db.rs
6.  back/src/routes.rs
7.  back/src/main.rs
8.  cd back && cargo build  (fix any compile errors before continuing)
9.  front/package.json
10. front/tsconfig.json
11. front/next.config.mjs  ← NOT .ts (unsupported in Next.js 14.x)
12. front/.env.example  +  front/.env.local
13. front/src/types/customer.ts
14. front/src/lib/api.ts
15. front/src/app/layout.tsx
16. front/src/app/page.tsx
17. front/src/app/customers/page.tsx
18. front/src/app/customers/[id]/page.tsx
19. front/src/components/CustomerTable.tsx
20. front/src/components/CustomerForm.tsx
21. front/src/components/ConfirmDialog.tsx
22. cd front && npm install && npm run build  (fix any type errors)
```
