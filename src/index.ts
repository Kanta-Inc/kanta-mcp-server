#!/usr/bin/env node

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { KantaClient } from './kanta-client.js';
import { createCustomerTools, handleCustomerTool } from './tools/customers.js';
import { createUserTools, handleUserTool } from './tools/users.js';
import { createPersonTools, handlePersonTool } from './tools/persons.js';
import { createMiscTools, handleMiscTool } from './tools/misc.js';

class KantaMCPServer {
  private server: Server;
  private kantaClient: KantaClient;
  private isShuttingDown: boolean = false;

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
      // Check if server is shutting down
      if (this.isShuttingDown) {
        throw new McpError(ErrorCode.InternalError, 'Server is shutting down');
      }

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
        // Log l'erreur pour le débogage
        console.error(`Erreur lors de l'exécution de l'outil ${name}:`, error);

        // Re-throw MCP errors directly
        if (error instanceof McpError) {
          throw error;
        }

        // Handle Zod validation errors
        if (error instanceof z.ZodError) {
          const issues = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
          throw new McpError(ErrorCode.InvalidParams, `Erreurs de validation: ${issues}`);
        }

        // Handle different error types with appropriate MCP error codes
        if (error instanceof Error) {
          // Check for common API error patterns
          if (error.message.includes('HTTP 400') || error.message.includes('Bad Request')) {
            throw new McpError(ErrorCode.InvalidParams, `Paramètres invalides: ${error.message}`);
          }
          
          if (error.message.includes('HTTP 401') || error.message.includes('Unauthorized')) {
            throw new McpError(ErrorCode.InvalidRequest, `Non autorisé: Vérifiez votre clé API`);
          }
          
          if (error.message.includes('HTTP 403') || error.message.includes('Forbidden')) {
            throw new McpError(ErrorCode.InvalidRequest, `Accès refusé: ${error.message}`);
          }
          
          if (error.message.includes('HTTP 404') || error.message.includes('Not Found')) {
            throw new McpError(ErrorCode.InvalidRequest, `Ressource non trouvée: ${error.message}`);
          }
          
          if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
            throw new McpError(ErrorCode.InternalError, `Timeout de requête: ${error.message}`);
          }
          
          // Generic error fallback
          throw new McpError(ErrorCode.InternalError, `Erreur lors de l'exécution: ${error.message}`);
        }

        // Unknown error type
        throw new McpError(ErrorCode.InternalError, `Erreur inconnue lors de l'exécution de l'outil ${name}`);
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Log de démarrage
    console.error('Serveur MCP Kanta démarré et connecté via stdio');
  }

  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    console.error('Arrêt en cours du serveur MCP Kanta...');
    
    try {
      await this.server.close();
      console.error('Serveur MCP Kanta arrêté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'arrêt du serveur:', error);
      throw error;
    }
  }
}

// Global server instance for graceful shutdown
let serverInstance: KantaMCPServer | null = null;

// Point d'entrée principal
async function main(): Promise<void> {
  try {
    serverInstance = new KantaMCPServer();
    await serverInstance.run();
  } catch (error) {
    console.error('Erreur fatale lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Gestion gracieuse de l'arrêt
async function gracefulShutdown(signal: string): Promise<void> {
  console.error(`Signal ${signal} reçu, arrêt gracieux du serveur...`);
  
  if (serverInstance) {
    try {
      await serverInstance.shutdown();
      process.exit(0);
    } catch (error) {
      console.error('Erreur lors de l\'arrêt gracieux:', error);
      process.exit(1);
    }
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Exception non gérée:', error);
  if (serverInstance) {
    serverInstance.shutdown().finally(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesse rejetée non gérée à:', promise, 'raison:', reason);
  if (serverInstance) {
    serverInstance.shutdown().finally(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Démarrer le serveur si ce fichier est exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Erreur non gérée:', error);
    process.exit(1);
  });
}