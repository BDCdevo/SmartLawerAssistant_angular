export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: Address;
  nationalId?: string;
  dateOfBirth?: Date;
  notes?: string;
  cases?: string[]; // Array of case IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CreateClientRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: Address;
  nationalId?: string;
  dateOfBirth?: Date;
  notes?: string;
}
