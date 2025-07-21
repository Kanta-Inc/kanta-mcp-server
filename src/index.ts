#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { KantaClient } from './kanta-client.js';
import { createCustomerTools, handleCustomerTool } from './tools/customers.js';
import { createUserTools, handleUserTool } from './tools/users.js';
import { createPersonTools, handlePersonTool } from './tools/persons.js';
import { createMiscTools, handleMiscTool } from './tools/misc.js';

class KantaMCPServer {
  private server: Server;
  private kantaClient: KantaClient;

  constructor() {
    this.server = new Server(
      {
        name: 'kanta-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Vérifier que la clé API est fournie
    const apiKey = process.env.KANTA_API_KEY;
    
    // Debug: afficher les variables d'environnement disponibles
    console.error('Variables d\'environnement disponibles:', Object.keys(process.env).filter(k => k.includes('KANTA')));
    console.error('KANTA_API_KEY trouvée:', apiKey ? 'OUI' : 'NON');
    console.error('Longueur de la clé:', apiKey ? apiKey.length : 0);
    
    if (!apiKey) {
      throw new Error(
        'KANTA_API_KEY environment variable is required. ' +
        'Please set it to your Kanta API key.'
      );
    }

    this.kantaClient = new KantaClient({
      apiKey,
      ...(process.env.KANTA_API_URL && { baseUrl: process.env.KANTA_API_URL }), // URL optionnelle personnalisée
    });

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const customerTools = createCustomerTools(this.kantaClient);
      const userTools = createUserTools(this.kantaClient);
      const personTools = createPersonTools(this.kantaClient);
      const miscTools = createMiscTools(this.kantaClient);

      return {
        tools: [
          ...customerTools,
          ...userTools,
          ...personTools,
          ...miscTools,
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result;

        // Router vers le bon handler basé sur le nom de l'outil
        if (name.startsWith('get_customers') || 
            name.startsWith('get_customer') || 
            name.startsWith('create_customer') || 
            name.startsWith('update_customer') || 
            name.startsWith('search_customers') || 
            name.startsWith('assign_customers') || 
            name.includes('customer')) {
          result = await handleCustomerTool(this.kantaClient, name, args);
        } else if (name.startsWith('get_users') || 
                   name.startsWith('get_user') || 
                   name.startsWith('create_user') || 
                   name.startsWith('delete_user') || 
                   name.includes('user')) {
          result = await handleUserTool(this.kantaClient, name, args);
        } else if (name.startsWith('get_persons') || 
                   name.startsWith('get_person') || 
                   name.startsWith('upload_person') || 
                   name.includes('person')) {
          result = await handlePersonTool(this.kantaClient, name, args);
        } else if (name.startsWith('get_firms') || 
                   name.startsWith('get_structure') || 
                   name.startsWith('download_file') || 
                   name.includes('firm') || 
                   name.includes('structure') || 
                   name.includes('file')) {
          result = await handleMiscTool(this.kantaClient, name, args);
        } else {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Outil inconnu: ${name}`
          );
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        
        // Log l'erreur pour le débogage
        console.error(`Erreur lors de l'exécution de l'outil ${name}:`, error);

        return {
          content: [
            {
              type: 'text',
              text: `Erreur lors de l'exécution de l'outil ${name}: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Log de démarrage
    console.error('Serveur MCP Kanta démarré et connecté via stdio');
  }
}

// Point d'entrée principal
async function main(): Promise<void> {
  try {
    const server = new KantaMCPServer();
    await server.run();
  } catch (error) {
    console.error('Erreur fatale lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Gestion gracieuse de l'arrêt
process.on('SIGINT', () => {
  console.error('Signal SIGINT reçu, arrêt du serveur...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Signal SIGTERM reçu, arrêt du serveur...');
  process.exit(0);
});

// Démarrer le serveur si ce fichier est exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Erreur non gérée:', error);
    process.exit(1);
  });
}