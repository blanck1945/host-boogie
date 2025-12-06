export interface Application {
  id: number;
  appName: string;
  description?: string;
  isActive: boolean;
  url: string;
  createdAt: string; // viene como ISO string desde el backend
  updatedAt: string;
}
