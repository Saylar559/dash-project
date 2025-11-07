export enum UserRole {
  ADMIN = 'ADMIN',
  DEVELOPER = 'DEVELOPER',
  DASHBOARD_USER = 'DASHBOARD_USER',
  ACCOUNTANT = 'ACCOUNTANT',
  USER = 'USER',
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Dashboard {
  id: number;
  title: string;
  description?: string;
  sql_query: string;
  config?: string;
  created_by: number;
  is_published: boolean;
  created_at: string;
}

export interface SQLResult {
  columns: string[];
  data: any[];
  row_count: number;
}

export interface DashboardConfig {
  visualizationType: 'table' | 'line' | 'bar' | 'pie' | 'area' | 'card';
  xAxis?: string;
  yAxis?: string[];
  cardValue?: string;
  cardLabel?: string;
  colors?: string[];
}
