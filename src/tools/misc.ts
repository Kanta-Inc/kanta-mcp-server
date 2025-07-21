import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { KantaClient } from '../kanta-client.js';

export function createMiscTools(client: KantaClient): Tool[] {
  return [
    {
      name: 'get_firms',
      description: 'Récupère la liste des cabinets',
      inputSchema: {
        type: 'object',
        properties: {
          per_page: {
            type: 'number',
            description: 'Nombre d\'éléments par page (1-100)',
            minimum: 1,
            maximum: 100,
          },
        },
      },
    },
    {
      name: 'get_structure',
      description: 'Récupère les informations de la structure (cabinet)',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'download_file',
      description: 'Télécharge un fichier par son ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'ID UUID du fichier à télécharger',
          },
        },
        required: ['id'],
      },
    },
  ];
}

export async function handleMiscTool(
  client: KantaClient,
  name: string,
  args: any
): Promise<any> {
  switch (name) {
    case 'get_firms': {
      const params = args as { per_page?: number };
      return await client.getFirms(params);
    }
    
    case 'get_structure': {
      return await client.getStructure();
    }
    
    case 'download_file': {
      const { id } = z.object({ id: z.string().uuid() }).parse(args);
      const blob = await client.downloadFile(id);
      
      // Pour les fichiers binaires, on retourne une représentation textuelle
      return {
        message: `Fichier téléchargé avec l'ID ${id}`,
        contentType: blob.type,
        size: blob.size,
        note: 'Le fichier binaire a été téléchargé avec succès. Dans un vrai contexte, il serait sauvegardé ou retourné au client.',
      };
    }
    
    default:
      throw new Error(`Outil divers inconnu: ${name}`);
  }
}