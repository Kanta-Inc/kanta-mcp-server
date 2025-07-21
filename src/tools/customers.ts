import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { KantaClient } from '../kanta-client.js';
import {
  CreateCustomerRequestSchema,
  UpdateCustomerRequestSchema,
  AssignmentRequestSchema,
} from '../types.js';

export function createCustomerTools(client: KantaClient): Tool[] {
  return [
    {
      name: 'get_customers',
      description: 'Récupère la liste des clients avec pagination optionnelle',
      inputSchema: {
        type: 'object',
        properties: {
          per_page: {
            type: 'number',
            description: 'Nombre d\'éléments par page (1-100)',
            minimum: 1,
            maximum: 100,
          },
          page: {
            type: 'number',
            description: 'Numéro de page',
            minimum: 1,
          },
        },
      },
    },
    {
      name: 'get_customer',
      description: 'Récupère les détails d\'un client spécifique par son ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'ID UUID du client',
          },
        },
        required: ['id'],
      },
    },
    {
      name: 'create_customer',
      description: 'Crée un nouveau client avec son numéro d\'entreprise (SIREN/SIRET)',
      inputSchema: {
        type: 'object',
        properties: {
          company_number: {
            type: 'string',
            description: 'Numéro d\'entreprise (SIREN ou SIRET)',
          },
          supervisor: {
            type: 'string',
            format: 'uuid',
            description: 'ID du superviseur',
          },
          contributors: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uuid',
            },
            description: 'Liste des IDs des contributeurs',
          },
          firm: {
            type: 'string',
            format: 'uuid',
            description: 'ID du cabinet',
          },
          fiscal_year_end_date: {
            type: 'string',
            format: 'date',
            description: 'Date de fin d\'exercice fiscal (YYYY-MM-DD)',
          },
          turnover: {
            type: 'number',
            description: 'Chiffre d\'affaires',
          },
          bypass_RBE: {
            type: 'boolean',
            description: 'Contourner RBE',
            default: true,
          },
          documents_auto_get: {
            type: 'boolean',
            description: 'Récupération automatique des documents',
            default: true,
          },
        },
        required: ['company_number'],
      },
    },
    {
      name: 'update_customer',
      description: 'Met à jour les informations d\'un client existant',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'ID UUID du client à mettre à jour',
          },
          company_number: {
            type: 'string',
            description: 'Numéro d\'entreprise (SIREN ou SIRET)',
          },
          code: {
            type: 'string',
            description: 'Code client',
          },
          name: {
            type: 'string',
            description: 'Nom',
          },
          firstname: {
            type: 'string',
            description: 'Prénom',
          },
          lastname: {
            type: 'string',
            description: 'Nom de famille',
          },
          creation_date: {
            type: 'string',
            format: 'date',
            description: 'Date de création (YYYY-MM-DD)',
          },
          fiscal_year_end_date: {
            type: 'string',
            format: 'date',
            description: 'Date de fin d\'exercice fiscal (YYYY-MM-DD)',
          },
          turnover: {
            type: 'number',
            description: 'Chiffre d\'affaires',
          },
          contact_email: {
            type: 'string',
            format: 'email',
            description: 'Email de contact',
          },
          contact_name: {
            type: 'string',
            description: 'Nom du contact',
          },
          contact_phone: {
            type: 'string',
            description: 'Téléphone du contact',
          },
        },
        required: ['id'],
      },
    },
    {
      name: 'search_customers',
      description: 'Recherche des clients par numéro d\'entreprise, nom d\'entreprise ou code',
      inputSchema: {
        type: 'object',
        properties: {
          company_number: {
            type: 'string',
            description: 'Numéro d\'entreprise à rechercher',
          },
          company_name: {
            type: 'string',
            description: 'Nom d\'entreprise à rechercher',
          },
          code: {
            type: 'string',
            description: 'Code client à rechercher',
          },
          per_page: {
            type: 'number',
            description: 'Nombre d\'éléments par page (1-100)',
            minimum: 1,
            maximum: 100,
          },
          page: {
            type: 'number',
            description: 'Numéro de page',
            minimum: 1,
          },
        },
      },
    },
    {
      name: 'assign_customers',
      description: 'Assigne des superviseurs, contributeurs et cabinet à des clients',
      inputSchema: {
        type: 'object',
        properties: {
          customers: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uuid',
            },
            description: 'Liste des IDs des clients à assigner',
            minItems: 1,
          },
          supervisor: {
            type: 'string',
            format: 'uuid',
            description: 'ID du superviseur à assigner (null pour désassigner)',
          },
          contributors: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uuid',
            },
            description: 'Liste des IDs des contributeurs (tableau vide pour désassigner tous)',
          },
          firm: {
            type: 'string',
            format: 'uuid',
            description: 'ID du cabinet à assigner (null pour désassigner)',
          },
        },
        required: ['customers'],
      },
    },
    {
      name: 'get_customer_risk_summary',
      description: 'Récupère le résumé des risques d\'un client',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'ID UUID du client',
          },
        },
        required: ['id'],
      },
    },
    {
      name: 'download_customer_risk_report',
      description: 'Télécharge le rapport de risque d\'un client (PDF ou ZIP)',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'ID UUID du client',
          },
          include_documents: {
            type: 'boolean',
            description: 'Inclure les documents (false=PDF, true=ZIP avec PDF et documents)',
            default: false,
          },
        },
        required: ['id'],
      },
    },
  ];
}

export async function handleCustomerTool(
  client: KantaClient,
  name: string,
  args: any
): Promise<any> {
  switch (name) {
    case 'get_customers': {
      const params = args as { per_page?: number; page?: number };
      return await client.getCustomers(params);
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
    
    case 'download_customer_risk_report': {
      const { id, include_documents } = z.object({
        id: z.string().uuid(),
        include_documents: z.boolean().optional(),
      }).parse(args);
      
      const blob = await client.downloadCustomerRiskReport(id, include_documents);
      
      // Pour les fichiers binaires, on retourne une représentation textuelle
      return {
        message: `Rapport de risque téléchargé pour le client ${id}`,
        contentType: blob.type,
        size: blob.size,
        note: 'Le fichier binaire a été téléchargé avec succès. Dans un vrai contexte, il serait sauvegardé ou retourné au client.',
      };
    }
    
    default:
      throw new Error(`Outil client inconnu: ${name}`);
  }
}