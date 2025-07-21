import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { KantaClient } from '../kanta-client.js';
import { CreateUserRequestSchema } from '../types.js';

export function createUserTools(client: KantaClient): Tool[] {
  return [
    {
      name: 'get_users',
      description: 'Récupère la liste des utilisateurs avec pagination optionnelle',
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
      name: 'get_user',
      description: 'Récupère les détails d\'un utilisateur spécifique par son ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'ID UUID de l\'utilisateur',
          },
        },
        required: ['id'],
      },
    },
    {
      name: 'create_user',
      description: 'Crée un nouvel utilisateur',
      inputSchema: {
        type: 'object',
        properties: {
          firstname: {
            type: 'string',
            description: 'Prénom de l\'utilisateur',
          },
          lastname: {
            type: 'string',
            description: 'Nom de famille de l\'utilisateur',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email de l\'utilisateur',
          },
          role: {
            type: 'string',
            enum: ['certified accountant', 'controller', 'collaborator'],
            description: 'Rôle de l\'utilisateur',
          },
          default_supervisor: {
            type: 'string',
            format: 'uuid',
            description: 'ID du superviseur par défaut',
          },
          default_contributor: {
            type: 'string',
            format: 'uuid',
            description: 'ID du contributeur par défaut',
          },
          firms: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uuid',
            },
            description: 'Liste des IDs des cabinets de l\'utilisateur',
          },
          trigram: {
            type: 'string',
            description: 'Trigramme de l\'utilisateur',
          },
        },
        required: ['firstname', 'lastname', 'email', 'role'],
      },
    },
    {
      name: 'delete_user',
      description: 'Supprime un utilisateur',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'ID UUID de l\'utilisateur à supprimer',
          },
        },
        required: ['id'],
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