import { z } from 'zod';
import { KantaClient } from '../kanta-client.js';
import { CreateUserRequestSchema } from '../types.js';

export interface McpTool {
  name: string;
  description: string;
  inputSchema?: Record<string, z.ZodType<any>>;
}

export function createUserTools(client: KantaClient): McpTool[] {
  return [
    {
      name: 'get_users',
      description: 'Récupère la liste des utilisateurs avec pagination optionnelle',
      inputSchema: {
        per_page: z.number().min(1).max(100).optional().describe('Nombre d\'éléments par page (1-100)'),
        page: z.number().min(1).optional().describe('Numéro de page'),
      },
    },
    {
      name: 'get_user',
      description: 'Récupère les détails d\'un utilisateur spécifique par son ID',
      inputSchema: {
        id: z.string().uuid().describe('ID UUID de l\'utilisateur'),
      },
    },
    {
      name: 'create_user',
      description: 'Crée un nouvel utilisateur',
      inputSchema: {
        firstname: z.string().describe('Prénom de l\'utilisateur'),
        lastname: z.string().describe('Nom de famille de l\'utilisateur'),
        email: z.string().email().describe('Email de l\'utilisateur'),
        role: z.enum(['certified accountant', 'controller', 'collaborator']).describe('Rôle de l\'utilisateur'),
        default_supervisor: z.string().uuid().optional().describe('ID du superviseur par défaut'),
        default_contributor: z.string().uuid().optional().describe('ID du contributeur par défaut'),
        firms: z.array(z.string().uuid()).optional().describe('Liste des IDs des cabinets de l\'utilisateur'),
        trigram: z.string().optional().describe('Trigramme de l\'utilisateur'),
      },
    },
    {
      name: 'delete_user',
      description: 'Supprime un utilisateur',
      inputSchema: {
        id: z.string().uuid().describe('ID UUID de l\'utilisateur à supprimer'),
      },
    },
  ];
}

export async function handleUserTool(
  client: KantaClient,
  name: string,
  args: any
): Promise<any> {
  switch (name) {
    case 'get_users': {
      const params = args as { per_page?: number; page?: number };
      return await client.getUsers(params);
    }
    
    case 'get_user': {
      const { id } = z.object({ id: z.string().uuid() }).parse(args);
      return await client.getUser(id);
    }
    
    case 'create_user': {
      const data = CreateUserRequestSchema.parse(args);
      return await client.createUser(data);
    }
    
    case 'delete_user': {
      const { id } = z.object({ id: z.string().uuid() }).parse(args);
      return await client.deleteUser(id);
    }
    
    default:
      throw new Error(`Outil utilisateur inconnu: ${name}`);
  }
}