#!/usr/bin/env node

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
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
          resources: {},
        },
      }
    );

    // Vérifier que la clé API est fournie
    const apiKey = process.env.KANTA_API_KEY;

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

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'kanta://structure/organization',
            name: 'Structure organisationnelle',
            description: 'Informations sur les cabinets, utilisateurs et structure organisationnelle',
            mimeType: 'application/json',
          },
          {
            uri: 'kanta://risk-summaries',
            name: 'Résumés de risques clients',
            description: 'Liste des résumés de risques pour tous les clients',
            mimeType: 'application/json',
          },
          {
            uri: 'kanta://customers/summary',
            name: 'Résumé des clients',
            description: 'Vue d\'ensemble de tous les clients avec informations essentielles',
            mimeType: 'application/json',
          },
          {
            uri: 'kanta://customer/{customer_id}/risk-summary',
            name: 'Résumé de risque client',
            description: 'Résumé de risque pour un client spécifique (remplacer {customer_id} par l\'ID du client)',
            mimeType: 'application/json',
          },
          {
            uri: 'kanta://files/{file_id}',
            name: 'Fichier Kanta',
            description: 'Accès à un fichier spécifique par son ID (remplacer {file_id} par l\'ID du fichier)',
            mimeType: 'application/octet-stream',
          }
        ],
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        if (uri === 'kanta://structure/organization') {
          // Récupérer les informations de structure
          const [firms, users] = await Promise.all([
            this.kantaClient.getFirms(),
            this.kantaClient.getUsers().catch(() => ({ data: [] })) // En cas d'erreur, retourner liste vide
          ]);

          return {
            contents: [
              {
                uri: uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  firms: firms.data,
                  users: users.data,
                  last_updated: new Date().toISOString()
                }, null, 2),
              },
            ],
          };
        }

        if (uri === 'kanta://customers/summary') {
          // Récupérer un résumé des clients
          const customers = await this.kantaClient.getCustomers({ per_page: 100 });

          const summary = customers.data.map(customer => ({
            id: customer.id,
            company_name: customer.company_name,
            state: customer.state,
            vigilance_level: customer.vigilance_level,
            code: customer.code,
            creation_date: customer.creation_date,
            risk_summary: customer.risk_summary
          }));

          return {
            contents: [
              {
                uri: uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  total_customers: customers.total_data,
                  customers: summary,
                  last_updated: new Date().toISOString()
                }, null, 2),
              },
            ],
          };
        }

        if (uri === 'kanta://risk-summaries') {
          // Récupérer les clients et leurs risk summaries
          const customers = await this.kantaClient.getCustomers({ per_page: 50 });
          
          const riskSummaries = await Promise.allSettled(
            customers.data.map(async (customer) => {
              try {
                const riskSummary = await this.kantaClient.getCustomerRiskSummary(customer.id);
                return {
                  customer_id: customer.id,
                  company_name: customer.company_name,
                  vigilance_level: customer.vigilance_level,
                  risk_summary: riskSummary
                };
              } catch (error) {
                return {
                  customer_id: customer.id,
                  company_name: customer.company_name,
                  vigilance_level: customer.vigilance_level,
                  error: 'Unable to fetch risk summary'
                };
              }
            })
          );

          const successfulSummaries = riskSummaries
            .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
            .map(result => result.value);

          return {
            contents: [
              {
                uri: uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  total_summaries: successfulSummaries.length,
                  risk_summaries: successfulSummaries,
                  last_updated: new Date().toISOString()
                }, null, 2),
              },
            ],
          };
        }

        // Handle dynamic URIs for individual customer risk summaries
        const customerRiskMatch = uri.match(/^kanta:\/\/customer\/([^\/]+)\/risk-summary$/);
        if (customerRiskMatch && customerRiskMatch[1]) {
          const customerId = customerRiskMatch[1];
          
          // Validate UUID format
          if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(customerId)) {
            throw new McpError(ErrorCode.InvalidParams, `ID client invalide: ${customerId}`);
          }

          const riskSummary = await this.kantaClient.getCustomerRiskSummary(customerId);
          const customer = await this.kantaClient.getCustomer(customerId);

          return {
            contents: [
              {
                uri: uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  customer: {
                    id: customer.id,
                    company_name: customer.company_name,
                    vigilance_level: customer.vigilance_level,
                    state: customer.state,
                  },
                  risk_summary: riskSummary,
                  last_updated: new Date().toISOString()
                }, null, 2),
              },
            ],
          };
        }

        // Handle dynamic URIs for files
        const fileMatch = uri.match(/^kanta:\/\/files\/([^\/]+)$/);
        if (fileMatch && fileMatch[1]) {
          const fileId = fileMatch[1];
          
          // Note: File download returns binary data which would need special handling
          // For now, we return metadata about the file access
          return {
            contents: [
              {
                uri: uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  message: `File access for ID: ${fileId}`,
                  note: 'File binary download is handled via tools, not resources',
                  available_tool: 'download_file',
                  last_updated: new Date().toISOString()
                }, null, 2),
              },
            ],
          };
        }

        throw new McpError(ErrorCode.InvalidRequest, `Resource non trouvée: ${uri}`);
      } catch (error) {
        console.error(`Erreur lors de la lecture de la ressource ${uri}:`, error);

        if (error instanceof McpError) {
          throw error;
        }

        if (error instanceof z.ZodError) {
          throw new McpError(ErrorCode.InternalError, `Erreur de validation pour la ressource: ${error.message}`);
        }

        if (error instanceof Error) {
          throw new McpError(ErrorCode.InternalError, `Erreur lors de la lecture de la ressource: ${error.message}`);
        }

        throw new McpError(ErrorCode.InternalError, `Erreur inconnue lors de la lecture de la ressource ${uri}`);
      }
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