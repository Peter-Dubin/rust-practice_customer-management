# Add Suppliers Table CRUD — Implementation Plan

## Context

The app already has a fully working Customers CRUD (Next.js 14 + MUI frontend, Rocket/Rust backend, SQLite northwind.db).
The Suppliers table in northwind.db has 29 records and a nearly identical schema to Customers, with two differences:
- `SupplierID` is an `int` (not a user-supplied string like `CustomerID`)
- There is an extra `HomePage` field (`TEXT NULL`)

The goal is to add full CRUD for Suppliers and expose it via two top navigation tabs ("Customers" / "Suppliers"), reusing every existing pattern with minimal new code.

---

## Suppliers Table Schema (reference)

```
SupplierID   INT  NOT NULL  (PK, sequential 1–29)
CompanyName  TEXT NOT NULL
ContactName  TEXT NULL
ContactTitle TEXT NULL
Address      TEXT NULL
City         TEXT NULL
Region       TEXT NULL
PostalCode   TEXT NULL
Country      TEXT NULL
Phone        TEXT NULL
Fax          TEXT NULL
HomePage     TEXT NULL      ← extra vs Customers
```

---

## Backend Changes  (`back/src/`)

### 1. `models.rs` — add Supplier structs

```rust
// Read model
pub struct Supplier {
    pub supplier_id: i32,
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
    pub home_page: Option<String>,
}

// Create request — no supplier_id (auto-generated server-side as MAX+1)
pub struct CreateSupplierRequest { /* all fields except supplier_id */ }

// Update request — no supplier_id (comes from URL)
pub struct UpdateSupplierRequest { /* same fields */ }

// Query params (mirrors CustomerQuery)
pub struct SupplierQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub name_filter: Option<String>,
    pub order_by: Option<String>,
    pub order_direction: Option<String>,
}
```

`SupplierID` auto-generation strategy: `SELECT COALESCE(MAX(SupplierID), 0) + 1 FROM Suppliers` inside `create_supplier`, within the same locked connection.

### 2. `db.rs` — add five Supplier methods on `impl Db`

| Method | SQL note |
|---|---|
| `list_suppliers(page, per_page, name_filter, order_by, order_dir)` | Mirror `list_customers`; allowed sort cols: `["CompanyName","ContactName","City","Country","SupplierID"]` |
| `get_supplier(id: i32)` | SELECT all 12 cols WHERE SupplierID = ?1 |
| `create_supplier(req)` | MAX(SupplierID)+1, then INSERT all 12 cols |
| `update_supplier(id: i32, req)` | UPDATE 11 editable cols WHERE SupplierID = ?12 |
| `delete_supplier(id: i32)` | DELETE WHERE SupplierID = ?1 |

### 3. `routes.rs` — add five supplier route handlers

Mirror the customer handlers exactly; swap types and paths:

```
GET    /suppliers?<query..>   → list_suppliers
GET    /suppliers/<id>        → get_supplier     (id: i32)
POST   /suppliers             → create_supplier
PUT    /suppliers/<id>        → update_supplier  (id: i32)
DELETE /suppliers/<id>        → delete_supplier  (id: i32)
```

### 4. `main.rs` — register the five new routes

Add to the `routes![...]` macro call alongside the customer routes.

---

## Frontend Changes  (`front/src/`)

### 5. `types/supplier.ts` — NEW file

```ts
export interface Supplier {
  supplier_id: number;          // i32
  company_name: string;
  contact_name: string | null;
  contact_title: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  fax: string | null;
  home_page: string | null;     // extra field
}

export interface CreateSupplierRequest { /* all except supplier_id */ }
export interface UpdateSupplierRequest { /* same */ }
export interface SupplierQueryParams { page, per_page, name_filter, order_by, order_direction }
export interface PaginatedSuppliersResponse { data: Supplier[]; total: number; page: number; per_page: number; }
```

### 6. `lib/api.ts` — add supplier functions

Append five functions mirroring the existing customer functions:
`listSuppliers`, `getSupplier`, `createSupplier`, `updateSupplier`, `deleteSupplier`
— same fetch patterns, just `/suppliers` base path, and `id` is `number`.

### 7. `components/NavigationTabs.tsx` — NEW client component

```tsx
'use client';
// Uses MUI Tabs + usePathname() to highlight active tab
// Two tabs: href="/customers" label="Customers", href="/suppliers" label="Suppliers"
// Sits below the AppBar, full-width, same blue theme
```

### 8. `app/layout.tsx` — add `<NavigationTabs />` below `<AppBar>`

Single insertion; no other changes to the layout. The tabs will appear on every page.

### 9. `components/SupplierTable.tsx` — NEW (adapted from `CustomerTable.tsx`)

Differences from CustomerTable:
- Columns: Company Name, Contact Name, City, Country, Phone, Home Page (6 cols vs 5)
- ID column is `number` (`supplier_id`)
- "Home Page" rendered as a clickable link when non-null

### 10. `components/SupplierForm.tsx` — NEW (adapted from `CustomerForm.tsx`)

Differences from CustomerForm:
- No "Supplier ID" input field (auto-generated; show as read-only text in edit mode)
- Add "Home Page" text field in the Contact section
- react-hook-form default values updated accordingly

### 11. `app/suppliers/page.tsx` — NEW (adapted from `app/customers/page.tsx`)

Reuse `ConfirmDialog` as-is (already generic).
Replace CustomerTable → SupplierTable, CustomerForm → SupplierForm, api.* calls → supplier api calls.
Header title: "Suppliers" / "Manage your supplier database".

---

## File Summary

| File | Action |
|---|---|
| `back/src/models.rs` | Modify — add Supplier structs |
| `back/src/db.rs` | Modify — add 5 supplier DB methods |
| `back/src/routes.rs` | Modify — add 5 supplier route handlers |
| `back/src/main.rs` | Modify — register supplier routes |
| `front/src/types/supplier.ts` | **Create** |
| `front/src/lib/api.ts` | Modify — add 5 supplier API functions |
| `front/src/components/NavigationTabs.tsx` | **Create** |
| `front/src/app/layout.tsx` | Modify — add NavigationTabs |
| `front/src/components/SupplierTable.tsx` | **Create** |
| `front/src/components/SupplierForm.tsx` | **Create** |
| `front/src/app/suppliers/page.tsx` | **Create** |

`ConfirmDialog.tsx` and `app/page.tsx` require no changes.

---

## Verification

1. **Backend**: `cd back && cargo build` — must compile with zero errors.
2. **Suppliers API smoke test**:
   - `GET http://localhost:8001/suppliers?page=1&per_page=10` → 29 total records
   - `POST /suppliers` with a new supplier → returns created record with auto ID
   - `PUT /suppliers/{id}` → `{"message":"updated"}`
   - `DELETE /suppliers/{id}` → `{"message":"deleted"}`
3. **Frontend**: `cd front && npm run dev` — visit `http://localhost:3000`
   - Both tabs visible; clicking "Suppliers" navigates to `/suppliers`
   - Suppliers table loads 29 records with pagination
   - Create modal opens without Supplier ID field; new row appears after save
   - Edit modal pre-fills all fields including Home Page
   - Delete confirmation removes the row
   - Switching back to "Customers" tab works without regression
