import { z } from 'zod';
import type {
  Customer,
  User,
  Person,
  Firm,
  Structure,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  AssignmentRequest,
  CreateUserRequest,
} from './types.js';
import {
  CustomerApiResponseSchema,
  CustomersListApiResponseSchema,
  UserApiResponseSchema,
  UsersListApiResponseSchema,
  PersonApiResponseSchema,
  PersonsListApiResponseSchema,
  FirmListApiResponseSchema,
  StructureApiResponseSchema,
} from './types.js';

export interface KantaClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export class KantaClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(options: KantaClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || 'https://app.kanta.fr/api/v1';
    this.timeout = options.timeout || 30000; // 30 seconds default
  }

  private async makeRequest<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      schema: z.ZodSchema<T>;
    }
  ): Promise<T> {
    const { method = 'GET', body, schema } = options;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const headers: Record<string, string> = {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      };

      const config: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
      }

      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, config);

      // Clear timeout on successful response
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return schema.parse(data);
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle abort/timeout error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  // Customers endpoints
  async getCustomers(params?: {
    per_page?: number;
    page?: number;
  }): Promise<{ data: Customer[]; total_data: number; per_page: number; current_page: number; total_page: number }> {
    const searchParams = new URLSearchParams();
    if (params?.per_page) searchParams.set('per_page', params.per_page.toString());
    if (params?.page) searchParams.set('page', params.page.toString());
    
    const endpoint = `/customers${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await this.makeRequest(endpoint, {
      schema: CustomersListApiResponseSchema as any,
    }) as any;
    
    return {
      data: response.data,
      total_data: response.total_data,
      per_page: response.per_page,
      current_page: response.current_page,
      total_page: response.total_page,
    };
  }

  async getCustomer(id: string): Promise<Customer> {
    const response = await this.makeRequest(`/customers/${id}`, {
      schema: CustomerApiResponseSchema as any,
    }) as any;
    return response.data;
  }

  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    const response = await this.makeRequest('/customers', {
      method: 'POST',
      body: data,
      schema: CustomerApiResponseSchema as any,
    }) as any;
    return response.data;
  }

  async updateCustomer(id: string, data: UpdateCustomerRequest): Promise<Customer> {
    const response = await this.makeRequest(`/customers/${id}`, {
      method: 'PUT',
      body: data,
      schema: CustomerApiResponseSchema as any,
    }) as any;
    return response.data;
  }

  async searchCustomers(params: {
    company_number?: string;
    company_name?: string;
    code?: string;
    per_page?: number;
    page?: number;
  }): Promise<{ data: Customer[]; total_data: number; per_page: number; current_page: number; total_page: number }> {
    const searchParams = new URLSearchParams();
    if (params.company_number) searchParams.set('company_number', params.company_number);
    if (params.company_name) searchParams.set('company_name', params.company_name);
    if (params.code) searchParams.set('code', params.code);
    if (params.per_page) searchParams.set('per_page', params.per_page.toString());
    if (params.page) searchParams.set('page', params.page.toString());
    
    const response = await this.makeRequest(`/customers/search?${searchParams.toString()}`, {
      schema: CustomersListApiResponseSchema as any,
    }) as any;
    
    return {
      data: response.data,
      total_data: response.total_data,
      per_page: response.per_page,
      current_page: response.current_page,
      total_page: response.total_page,
    };
  }

  async assignCustomers(data: AssignmentRequest): Promise<Customer[]> {
    const response = await this.makeRequest('/customers/assignment', {
      method: 'POST',
      body: data,
      schema: z.object({
        data: z.array(z.any()),
        url: z.string(),
        object: z.string(),
      }),
    });
    return response.data;
  }

  async getCustomerRiskSummary(id: string): Promise<any> {
    const response = await this.makeRequest(`/customers/${id}/risk-summary`, {
      schema: z.object({
        data: z.any(),
        url: z.string(),
        object: z.string(),
      }),
    });
    return response.data;
  }

  // async downloadCustomerRiskReport(id: string, includeDocuments?: boolean): Promise<Blob> {
  //   const searchParams = new URLSearchParams();
  //   if (includeDocuments !== undefined) {
  //     searchParams.set('include_documents', includeDocuments.toString());
  //   }
  //   
  //   const url = `${this.baseUrl}/customers/${id}/risk-report-document${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  //   const response = await fetch(url, {
  //     headers: {
  //       'X-API-Key': this.apiKey,
  //     },
  //   });

  //   if (!response.ok) {
  //     const errorText = await response.text();
  //     throw new Error(`HTTP ${response.status}: ${errorText}`);
  //   }

  //   return response.blob();
  // }

  // Users endpoints
  async getUsers(params?: {
    per_page?: number;
    page?: number;
  }): Promise<{ data: User[]; total_data: number; per_page: number; current_page: number; total_page: number }> {
    const searchParams = new URLSearchParams();
    if (params?.per_page) searchParams.set('per_page', params.per_page.toString());
    if (params?.page) searchParams.set('page', params.page.toString());
    
    const endpoint = `/users${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await this.makeRequest(endpoint, {
      schema: UsersListApiResponseSchema,
    });
    
    return {
      data: response.data,
      total_data: response.total_data,
      per_page: response.per_page,
      current_page: response.current_page,
      total_page: response.total_page,
    };
  }

  async getUser(id: string): Promise<User> {
    const response = await this.makeRequest(`/users/${id}`, {
      schema: UserApiResponseSchema,
    });
    return response.data;
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await this.makeRequest('/users', {
      method: 'POST',
      body: data,
      schema: UserApiResponseSchema,
    });
    return response.data;
  }

  async deleteUser(id: string): Promise<{ id: string; deleted: boolean }> {
    const response = await this.makeRequest(`/users/${id}`, {
      method: 'DELETE',
      schema: z.object({
        data: z.object({
          id: z.string(),
          deleted: z.boolean(),
        }),
        url: z.string(),
        object: z.string(),
      }),
    });
    return response.data;
  }

  // Persons endpoints
  async getPersons(params?: {
    per_page?: number;
    page?: number;
  }): Promise<{ data: Person[]; total_data: number; per_page: number; current_page: number; total_page: number }> {
    const searchParams = new URLSearchParams();
    if (params?.per_page) searchParams.set('per_page', params.per_page.toString());
    if (params?.page) searchParams.set('page', params.page.toString());
    
    const endpoint = `/persons${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await this.makeRequest(endpoint, {
      schema: PersonsListApiResponseSchema,
    });
    
    return {
      data: response.data,
      total_data: response.total_data,
      per_page: response.per_page,
      current_page: response.current_page,
      total_page: response.total_page,
    };
  }

  async getPerson(id: string): Promise<Person> {
    const response = await this.makeRequest(`/persons/${id}`, {
      schema: PersonApiResponseSchema,
    });
    return response.data;
  }

  // async uploadPersonDocument(
  //   id: string,
  //   data: {
  //     type?: 'id_card' | 'passport' | 'driver_license' | 'residence_permit';
  //     title?: string;
  //     issue_date?: string;
  //     expiration_date?: string;
  //     comment?: string;
  //     files: File[];
  //   }
  // ): Promise<Person> {
  //   const formData = new FormData();
  //   
  //   if (data.type) formData.append('type', data.type);
  //   if (data.title) formData.append('title', data.title);
  //   if (data.issue_date) formData.append('issue_date', data.issue_date);
  //   if (data.expiration_date) formData.append('expiration_date', data.expiration_date);
  //   if (data.comment) formData.append('comment', data.comment);
  //   
  //   data.files.forEach((file) => {
  //     formData.append('files[]', file);
  //   });

  //   const url = `${this.baseUrl}/persons/${id}/document`;
  //   const response = await fetch(url, {
  //     method: 'POST',
  //     headers: {
  //       'X-API-Key': this.apiKey,
  //     },
  //     body: formData,
  //   });

  //   if (!response.ok) {
  //     const errorText = await response.text();
  //     throw new Error(`HTTP ${response.status}: ${errorText}`);
  //   }

  //   const responseData = await response.json();
  //   return PersonApiResponseSchema.parse(responseData).data;
  // }

  // Firms endpoints
  async getFirms(params?: {
    per_page?: number;
  }): Promise<{ data: any[]; total_data: number; per_page: number; current_page: number; total_page: number }> {
    const searchParams = new URLSearchParams();
    if (params?.per_page) searchParams.set('per_page', params.per_page.toString());
    
    const endpoint = `/firms${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await this.makeRequest(endpoint, {
      schema: FirmListApiResponseSchema,
    });
    
    return {
      data: response.data,
      total_data: response.total_data,
      per_page: response.per_page,
      current_page: response.current_page,
      total_page: response.total_page,
    };
  }

  // Structure endpoint
  async getStructure(): Promise<Structure> {
    const response = await this.makeRequest('/structure', {
      schema: StructureApiResponseSchema,
    });
    return response.data;
  }

  // Files endpoint
  // async downloadFile(id: string): Promise<Blob> {
  //   const url = `${this.baseUrl}/files/${id}`;
  //   const response = await fetch(url, {
  //     headers: {
  //       'X-API-Key': this.apiKey,
  //     },
  //   });

  //   if (!response.ok) {
  //     const errorText = await response.text();
  //     throw new Error(`HTTP ${response.status}: ${errorText}`);
  //   }

  //   return response.blob();
  // }
}