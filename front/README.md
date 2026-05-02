# Frontend — Customer Management UI

Next.js 14 application (App Router) that provides the browser interface for managing customers and suppliers. Communicates with the Rust/Rocket API at `http://localhost:8001`.

**Runs on:** `http://localhost:3000`

---

## Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | 14.2 | React framework + App Router |
| React | 18 | UI runtime |
| TypeScript | 5 | Type safety |
| MUI (Material UI) | v5 | Component library |
| React Hook Form | v7 | Form state and validation |

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — navigation landing page |
| `/customers` | Customer list with search, sort, pagination, add/edit/delete |
| `/customers/[id]` | Customer detail view |
| `/suppliers` | Supplier list with search, sort, pagination, add/edit/delete |

---

## Source Layout

```
src/
├── app/
│   ├── layout.tsx            # Root layout with NavigationTabs
│   ├── page.tsx              # Home page
│   ├── customers/
│   │   ├── page.tsx          # Customer list page
│   │   └── [id]/page.tsx     # Customer detail page
│   └── suppliers/
│       └── page.tsx          # Supplier list page
├── components/
│   ├── CustomerTable.tsx     # MUI DataGrid-style table for customers
│   ├── CustomerForm.tsx      # Create / edit customer dialog
│   ├── SupplierTable.tsx     # MUI DataGrid-style table for suppliers
│   ├── SupplierForm.tsx      # Create / edit supplier dialog
│   ├── ConfirmDialog.tsx     # Generic delete confirmation dialog
│   └── NavigationTabs.tsx    # Top-level tab navigation
├── lib/
│   └── api.ts                # All fetch calls to the backend API
└── types/
    ├── customer.ts           # Customer TypeScript interfaces
    └── supplier.ts           # Supplier TypeScript interfaces
```

---

## Running Locally

```bash
# From the front/ directory
npm install
cp .env.example .env.local    # configure NEXT_PUBLIC_API_URL
npm run dev
```

The backend must be running before starting the frontend. See [../back/README.md](../back/README.md).

### Environment variables

| Variable | Example value | Description |
|----------|---------------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8001` | Backend API base URL |
