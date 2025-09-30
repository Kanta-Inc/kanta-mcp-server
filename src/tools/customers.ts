import { z } from 'zod';
import { KantaClient } from '../kanta-client.js';
import {
  CreateCustomerRequestSchema,
  UpdateCustomerRequestSchema,
  AssignmentRequestSchema,
} from '../types.js';

export interface McpTool {
  name: string;
  description: string;
  inputSchema?: Record<string, z.ZodType<any>>;
}

export function createCustomerTools(client: KantaClient): McpTool[] {
  return [
    {
      name: 'get_customers',
      description: 'Récupère la liste des clients avec pagination optionnelle',
      inputSchema: {
        per_page: z.number().min(1).max(100).optional().describe('Nombre d\'éléments par page (1-100)'),
        page: z.number().min(1).optional().describe('Numéro de page'),
      },
    },
    {
      name: 'get_customer',
      description: 'Récupère les détails d\'un client spécifique par son ID',
      inputSchema: {
        id: z.string().uuid().describe('ID UUID du client'),
      },
    },
    {
      name: 'create_customer',
      description: 'Crée un nouveau client avec son numéro d\'entreprise (SIREN/SIRET)',
      inputSchema: {
        company_number: z.string().describe('Numéro d\'entreprise (SIREN ou SIRET)'),
        supervisor: z.string().uuid().optional().describe('ID du superviseur'),
        contributors: z.array(z.string().uuid()).optional().describe('Liste des IDs des contributeurs'),
        firm: z.string().uuid().optional().describe('ID du cabinet'),
        fiscal_year_end_date: z.string().optional().describe('Date de fin d\'exercice fiscal (YYYY-MM-DD)'),
        turnover: z.number().optional().describe('Chiffre d\'affaires'),
        bypass_RBE: z.boolean().optional().describe('Contourner RBE'),
        documents_auto_get: z.boolean().optional().describe('Récupération automatique des documents'),
      },
    },
    {
      name: 'update_customer',
      description: 'Met à jour les informations d\'un client existant',
      inputSchema: {
        id: z.string().uuid().describe('ID UUID du client à mettre à jour'),
        company_number: z.string().optional().describe('Numéro d\'entreprise (SIREN ou SIRET)'),
        code: z.string().optional().describe('Code client'),
        name: z.string().optional().describe('Nom'),
        firstname: z.string().optional().describe('Prénom'),
        lastname: z.string().optional().describe('Nom de famille'),
        creation_date: z.string().optional().describe('Date de création (YYYY-MM-DD)'),
        fiscal_year_end_date: z.string().optional().describe('Date de fin d\'exercice fiscal (YYYY-MM-DD)'),
        turnover: z.number().optional().describe('Chiffre d\'affaires'),
        contact_email: z.string().email().optional().describe('Email de contact'),
        contact_name: z.string().optional().describe('Nom du contact'),
        contact_phone: z.string().optional().describe('Téléphone du contact'),
      },
    },
    {
      name: 'search_customers',
      description: 'Recherche des clients par numéro d\'entreprise, nom d\'entreprise ou code',
      inputSchema: {
        company_number: z.string().optional().describe('Numéro d\'entreprise à rechercher'),
        company_name: z.string().optional().describe('Nom d\'entreprise à rechercher'),
        code: z.string().optional().describe('Code client à rechercher'),
        per_page: z.number().min(1).max(100).optional().describe('Nombre d\'éléments par page (1-100)'),
        page: z.number().min(1).optional().describe('Numéro de page'),
      },
    },
    {
      name: 'assign_customers',
      description: 'Assigne des superviseurs, contributeurs et cabinet à des clients',
      inputSchema: {
        customers: z.array(z.string().uuid()).min(1).describe('Liste des IDs des clients à assigner'),
        supervisor: z.string().uuid().optional().describe('ID du superviseur à assigner (null pour désassigner)'),
        contributors: z.array(z.string().uuid()).optional().describe('Liste des IDs des contributeurs (tableau vide pour désassigner tous)'),
        firm: z.string().uuid().optional().describe('ID du cabinet à assigner (null pour désassigner)'),
      },
    },
    {
      name: 'get_customer_risk_summary',
      description: 'Récupère le résumé des risques d\'un client',
      inputSchema: {
        id: z.string().uuid().describe('ID UUID du client'),
      },
    },
    // {
    //   name: 'download_customer_risk_report',
    //   description: 'Télécharge le rapport de risque d\'un client (PDF ou ZIP)',
    //   inputSchema: {
    //     type: 'object',
    //     properties: {
    //       id: {
    //         type: 'string',
    //         format: 'uuid',
    //         description: 'ID UUID du client',
    //       },
    //       include_documents: {
    //         type: 'boolean',
    //         description: 'Inclure les documents (false=PDF, true=ZIP avec PDF et documents)',
    //         default: false,
    //       },
    //     },
    //     required: ['id'],
    //   },
    // },
  ];
}

export async function handleCustomerTool(
  client: KantaClient,
  name: string,
  args: any
): Promise<any> {
  switch (name) {
    case 'get_customers': {
      const params = z.object({
        per_page: z.number().min(1).max(100).optional(),
        page: z.number().min(1).optional(),
      }).parse(args);
      
      // Filter out undefined values
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined)
      ) as { per_page?: number; page?: number };
      
      return await client.getCustomers(filteredParams);
    }
    
    case 'get_customer': {
      const { id } = z.object({ id: z.string().uuid() }).parse(args);
      return await client.getCustomer(id);
    }
    
    case 'create_customer': {
      const data = CreateCustomerRequestSchema.parse(args);
      return await client.createCustomer(data);
    }
    
    case 'update_customer': {
      const { id, ...updateData } = z.object({
        id: z.string().uuid(),
      }).extend(UpdateCustomerRequestSchema.shape).parse(args);
      return await client.updateCustomer(id, updateData);
    }
    
    case 'search_customers': {
      const params = z.object({
        company_number: z.string().optional(),
        company_name: z.string().optional(),
        code: z.string().optional(),
        per_page: z.number().min(1).max(100).optional(),
        page: z.number().min(1).optional(),
      }).parse(args);
      
      // Filtrer les valeurs undefined pour éviter les problèmes avec exactOptionalPropertyTypes
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined)
      ) as {
        company_number?: string;
        company_name?: string;
        code?: string;
        per_page?: number;
        page?: number;
      };
      
      return await client.searchCustomers(filteredParams);
    }
    
    case 'assign_customers': {
      const data = AssignmentRequestSchema.parse(args);
      return await client.assignCustomers(data);
    }
    
    case 'get_customer_risk_summary': {
      const { id } = z.object({ id: z.string().uuid() }).parse(args);
      return await client.getCustomerRiskSummary(id);
    }
    
    // case 'download_customer_risk_report': {
    //   const { id, include_documents } = z.object({
    //     id: z.string().uuid(),
    //     include_documents: z.boolean().optional(),
    //   }).parse(args);
    //   
    //   const blob = await client.downloadCustomerRiskReport(id, include_documents);
    //   
    //   // Pour les fichiers binaires, on retourne une représentation textuelle
    //   return {
    //     message: `Rapport de risque téléchargé pour le client ${id}`,
    //     contentType: blob.type,
    //     size: blob.size,
    //     note: 'Le fichier binaire a été téléchargé avec succès. Dans un vrai contexte, il serait sauvegardé ou retourné au client.',
    //   };
    // }
    
    default:
      throw new Error(`Outil client inconnu: ${name}`);
  }
}