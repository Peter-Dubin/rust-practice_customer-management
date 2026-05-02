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
