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
