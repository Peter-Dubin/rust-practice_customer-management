import { PaginatedResponse } from '@/types/customer';

export interface Supplier {
  supplier_id: number;
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
  home_page: string | null;
}

export interface CreateSupplierRequest {
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
  home_page: string | null;
}

export interface UpdateSupplierRequest extends CreateSupplierRequest {}

export interface SupplierQuery {
  page?: number;
  per_page?: number;
  name_filter?: string;
  order_by?: string;
  order_direction?: 'ASC' | 'DESC';
}

export type PaginatedSuppliersResponse = PaginatedResponse<Supplier>;
