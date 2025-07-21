import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { KantaClient } from '../kanta-client.js';

export function createPersonTools(client: KantaClient): Tool[] {
  return [
    {
      name: 'get_persons',
      description: 'Récupère la liste des personnes avec pagination optionnelle',
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
      name: 'get_person',
      description: 'Récupère les détails d\'une personne spécifique par son ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'ID UUID de la personne',
          },
        },
        required: ['id'],
      },
    },
    {
      name: 'upload_person_document',
      description: 'Upload un document d\'identité pour une personne (carte d\'identité, passeport, etc.)',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'ID UUID de la personne',
          },
          type: {
            type: 'string',
            enum: ['id_card', 'passport', 'driver_license', 'residence_permit'],
            description: 'Type de document d\'identité',
          },
          title: {
            type: 'string',
            description: 'Titre du document',
          },
          issue_date: {
            type: 'string',
            format: 'date',
            description: 'Date d\'émission du document (YYYY-MM-DD)',
          },
          expiration_date: {
            type: 'string',
            format: 'date',
            description: 'Date d\'expiration du document (YYYY-MM-DD)',
          },
          comment: {
            type: 'string',
            description: 'Commentaire sur le document',
          },
          file_paths: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Liste des chemins de fichiers à uploader',
            minItems: 1,
            maxItems: 10,
          },
        },
        required: ['id', 'file_paths'],
      },
    },
  ];
}

export async function handlePersonTool(
  client: KantaClient,
  name: string,
  args: any
): Promise<any> {
  switch (name) {
    case 'get_persons': {
      const params = args as { per_page?: number; page?: number };
      return await client.getPersons(params);
    }
    
    case 'get_person': {
      const { id } = z.object({ id: z.string().uuid() }).parse(args);
      return await client.getPerson(id);
    }
    
    case 'upload_person_document': {
      const {
        id,
        type,
        title,
        issue_date,
        expiration_date,
        comment,
        file_paths,
      } = z.object({
        id: z.string().uuid(),
        type: z.enum(['id_card', 'passport', 'driver_license', 'residence_permit']).optional(),
        title: z.string().optional(),
        issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        expiration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        comment: z.string().optional(),
        file_paths: z.array(z.string()).min(1).max(10),
      }).parse(args);
      
      // Dans un vrai serveur MCP, il faudrait lire les fichiers depuis le système de fichiers
      // Pour cet exemple, on simule la création de fichiers File
      const files: File[] = [];
      
      for (const filePath of file_paths) {
        try {
          // Simuler la lecture d'un fichier
          // Dans une vraie implémentation, vous utiliseriez fs.readFile ou similaire
          const filename = filePath.split('/').pop() || 'document';
          const file = new File(['dummy content'], filename, { type: 'application/pdf' });
          files.push(file);
        } catch (error) {
          throw new Error(`Impossible de lire le fichier: ${filePath}`);
        }
      }
      
      // Filtrer les valeurs undefined pour éviter les problèmes avec exactOptionalPropertyTypes
      const uploadData: {
        type?: 'id_card' | 'passport' | 'driver_license' | 'residence_permit';
        title?: string;
        issue_date?: string;
        expiration_date?: string;
        comment?: string;
        files: File[];
      } = { files };
      
      if (type !== undefined) uploadData.type = type;
      if (title !== undefined) uploadData.title = title;
      if (issue_date !== undefined) uploadData.issue_date = issue_date;
      if (expiration_date !== undefined) uploadData.expiration_date = expiration_date;
      if (comment !== undefined) uploadData.comment = comment;
      
      return await client.uploadPersonDocument(id, uploadData);
    }
    
    default:
      throw new Error(`Outil personne inconnu: ${name}`);
  }
}