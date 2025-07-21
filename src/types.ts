import { z } from 'zod';

// Base schemas
export const UUIDSchema = z.string().uuid();
export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'not_established']);
export const CustomerStateSchema = z.enum(['draft', 'in_progress', 'valid', 'ended', 'to_validate']);
export const UserRoleSchema = z.enum(['certified accountant', 'controller', 'collaborator']);
export const DocumentTypeSchema = z.enum(['id_card', 'passport', 'driver_license', 'residence_permit']);

// Address schemas
export const CountryResourceSchema = z.object({
  label: z.string(),
  risk: RiskLevelSchema,
});

export const AddressAreaResourceSchema = z.object({
  label: z.string(),
  risk: RiskLevelSchema,
});

export const CustomerAddressResourceSchema = z.object({
  street: z.string(),
  zip_code: z.string(),
  city: z.string(),
  country: CountryResourceSchema,
  is_headquarter: z.boolean(),
  address_area: AddressAreaResourceSchema,
  additional_information: z.string().optional(),
});

export const PersonAddressResourceSchema = z.object({
  street: z.string(),
  zip_code: z.string(),
  city: z.string(),
  country: CountryResourceSchema,
  is_main_residence: z.boolean(),
  address_area: AddressAreaResourceSchema,
  additional_information: z.string().optional(),
});

// Activity schema
export const ActivityResourceSchema = z.object({
  code: z.string(),
  label: z.string(),
  is_main_activity: z.boolean(),
  risk: RiskLevelSchema,
});

// Mission schema
export const MissionResourceSchema = z.object({
  label: z.string(),
  description: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  risk: RiskLevelSchema,
});

// Affectation schema
export const AffectationResourceSchema = z.object({
  id: UUIDSchema,
  object: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  is_validator: z.boolean(),
  is_supervisor: z.boolean(),
});

// Diligence schema
export const DiligenceResourceSchema = z.object({
  title: z.string(),
  description: z.string(),
  threat_vulnerability_origin: z.string(),
  threat_vulnerability_description: z.string(),
});

// Document schemas
export const CustomerDocumentResourceSchema = z.object({
  type: z.string(),
  title: z.string(),
  issue_date: DateSchema,
  expiration_date: DateSchema.optional(),
  comment: z.string().optional(),
  file_list: z.array(UUIDSchema),
});

export const PersonDocumentResourceSchema = z.object({
  type: z.string(),
  title: z.string(),
  issue_date: DateSchema,
  expiration_date: DateSchema.optional(),
  comment: z.string().optional(),
  file_list: z.array(UUIDSchema),
  person_id: UUIDSchema,
});

// Person schema
export const CustomerPersonResourceSchema = z.object({
  id: UUIDSchema,
  first_name: z.string(),
  last_name: z.string(),
  person_acting_on_behalf: z.boolean(),
  beneficial_owner: z.boolean(),
  legal_representative: z.boolean(),
  role: z.string(),
  date_of_birth: z.string(),
  city_of_birth: z.string(),
  birth_country: CountryResourceSchema,
  nationality: CountryResourceSchema,
  met_and_certify_identity: z.boolean(),
  address_list: z.array(PersonAddressResourceSchema),
  other_activities: z.string().optional(),
  politically_exposed_person: z.boolean(),
  integrity_reputation_doubts: z.boolean(),
  assets_freeze: z.boolean().optional(),
  observation: z.string().optional(),
  document_list: z.array(PersonDocumentResourceSchema),
});

// Customer schema
export const CustomerResourceSchema = z.object({
  id: UUIDSchema,
  legal_type_code: z.number(),
  legal_type_label: z.string(),
  code: z.string(),
  company_name: z.string(),
  company_number: z.string(),
  company_country: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  creation_date: z.string(),
  fiscal_year_end_date: z.string(),
  activity_list: z.array(ActivityResourceSchema),
  address_list: z.array(CustomerAddressResourceSchema),
  person_list: z.array(CustomerPersonResourceSchema),
  mission_list: z.array(MissionResourceSchema),
  relationship_start_date: z.string(),
  state: CustomerStateSchema,
  relationship_end_date: z.string().optional(),
  accountant_choice_reason: z.string().optional(),
  relationship_description: z.string().optional(),
  vigilance_level: RiskLevelSchema,
  risk_summary: z.object({
    location: RiskLevelSchema,
    activity: RiskLevelSchema,
    mission: RiskLevelSchema,
    customer: RiskLevelSchema,
  }),
  diligences: z.array(DiligenceResourceSchema),
  observation: z.string().optional(),
  turnover: z.number().optional(),
  affectation_list: z.array(AffectationResourceSchema),
  document_list: z.array(CustomerDocumentResourceSchema),
});

// User schema
export const UserResourceSchema = z.object({
  id: UUIDSchema,
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  role: z.string(),
});

// Person schema (standalone)
export const PersonResourceSchema = z.object({
  id: UUIDSchema,
  first_name: z.string(),
  last_name: z.string(),
  date_of_birth: z.string(),
  city_of_birth: z.string(),
  birth_country: CountryResourceSchema,
  nationality: CountryResourceSchema,
  met_and_certify_identity: z.boolean(),
  address_list: z.array(PersonAddressResourceSchema),
  other_activities: z.string().optional(),
  politically_exposed_person: z.boolean(),
  integrity_reputation_doubts: z.boolean(),
  assets_freeze: z.boolean(),
  observation: z.string().optional(),
  linked_customer_list: z.array(z.object({
    id: UUIDSchema,
    company_name: z.string(),
    file_code: z.string(),
    person_acting_on_behalf: z.boolean(),
    beneficial_owner: z.boolean(),
    legal_representative: z.boolean(),
    role: z.string(),
  })),
  document_list: z.array(PersonDocumentResourceSchema),
});

// Firm schema
export const FirmResourceSchema = z.object({
  id: UUIDSchema,
  libelle: z.string(),
  is_main: z.boolean(),
  email: z.string().email(),
  telephone: z.string(),
  type_juridique: z.string(),
  siret: z.string(),
  entite_rattachement: z.string(),
  adresse_entite_rattachement: z.string(),
  numero_tva: z.string(),
  adresse: z.object({
    adresse_1: z.string(),
    adresse_2: z.string().optional(),
    adresse_3: z.string().optional(),
    code_postal: z.string(),
    ville: z.string(),
  }),
});

// Structure schema
export const StructureResourceSchema = z.object({
  name: z.string(),
  remaining_customer_files: z.number(),
  remaining_user: z.number(),
  remaining_validator: z.number(),
  subscription: z.string(),
  subscription_status: z.string(),
});

// Request schemas
export const CreateCustomerRequestSchema = z.object({
  company_number: z.string(),
  supervisor: UUIDSchema.optional(),
  contributors: z.array(UUIDSchema).optional(),
  firm: UUIDSchema.optional(),
  fiscal_year_end_date: DateSchema.optional(),
  turnover: z.number().optional(),
  bypass_RBE: z.boolean().default(true),
  documents_auto_get: z.boolean().default(true),
});

export const UpdateCustomerRequestSchema = z.object({
  company_number: z.string().optional(),
  code: z.string().optional(),
  name: z.string().optional(),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  creation_date: DateSchema.optional(),
  fiscal_year_end_date: DateSchema.optional(),
  turnover: z.number().optional(),
  contact_email: z.string().email().optional(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
});

export const AssignmentRequestSchema = z.object({
  customers: z.array(UUIDSchema),
  supervisor: UUIDSchema.optional(),
  contributors: z.array(UUIDSchema).optional(),
  firm: UUIDSchema.optional(),
});

export const CreateUserRequestSchema = z.object({
  firstname: z.string(),
  lastname: z.string(),
  email: z.string().email(),
  role: UserRoleSchema,
  default_supervisor: UUIDSchema.optional(),
  default_contributor: UUIDSchema.optional(),
  firms: z.array(UUIDSchema).optional(),
  trigram: z.string().optional(),
});

// Response schemas
export const PaginationInfoSchema = z.object({
  total_data: z.number(),
  per_page: z.number(),
  current_page: z.number(),
  total_page: z.number(),
});

export const ApiResponseSchema = z.object({
  url: z.string().url(),
  object: z.string(),
});

export const ApiListResponseSchema = ApiResponseSchema.extend({
  total_data: z.number(),
  per_page: z.number(),
  current_page: z.number(),
  total_page: z.number(),
});

export const CustomerApiResponseSchema = ApiResponseSchema.extend({
  data: CustomerResourceSchema,
});

export const CustomersListApiResponseSchema = ApiListResponseSchema.extend({
  data: z.array(CustomerResourceSchema),
});

export const UserApiResponseSchema = ApiResponseSchema.extend({
  data: UserResourceSchema,
});

export const UsersListApiResponseSchema = ApiListResponseSchema.extend({
  data: z.array(UserResourceSchema),
});

export const PersonApiResponseSchema = ApiResponseSchema.extend({
  data: PersonResourceSchema,
});

export const PersonsListApiResponseSchema = ApiListResponseSchema.extend({
  data: z.array(PersonResourceSchema),
});

export const FirmApiResponseSchema = ApiResponseSchema.extend({
  data: FirmResourceSchema,
});

export const FirmListApiResponseSchema = ApiListResponseSchema.extend({
  data: z.array(FirmApiResponseSchema),
});

export const StructureApiResponseSchema = ApiResponseSchema.extend({
  data: StructureResourceSchema,
});

// Type exports
export type Customer = z.infer<typeof CustomerResourceSchema>;
export type User = z.infer<typeof UserResourceSchema>;
export type Person = z.infer<typeof PersonResourceSchema>;
export type Firm = z.infer<typeof FirmResourceSchema>;
export type Structure = z.infer<typeof StructureResourceSchema>;
export type CreateCustomerRequest = z.infer<typeof CreateCustomerRequestSchema>;
export type UpdateCustomerRequest = z.infer<typeof UpdateCustomerRequestSchema>;
export type AssignmentRequest = z.infer<typeof AssignmentRequestSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;