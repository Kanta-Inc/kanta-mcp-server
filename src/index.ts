#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { KantaClient } from './kanta-client.js';
import { createCustomerTools, handleCustomerTool } from './tools/customers.js';
import { createUserTools, handleUserTool } from './tools/users.js';
import { createPersonTools, handlePersonTool } from './tools/persons.js';
import { createMiscTools, handleMiscTool } from './tools/misc.js';

// Configuration schema for Smithery
export const configSchema = z.object({
  apiKey: z.string().describe("The Kanta API key (X-API-Key header)"),
  apiUrl: z.string().optional().describe("Optional base URL for the Kanta API (defaults to https://app.kanta.fr/api/v1)")
});

// Exported server function for Smithery CLI (HTTP transport)
export default function createServer({ config }: { config: z.infer<typeof configSchema> }) {
  const server = new McpServer({
    name: 'kanta-mcp-server',
    version: '1.0.0',
  });

  // Initialize KantaClient with config
  const kantaClient = new KantaClient({
    apiKey: config.apiKey,
    ...(config.apiUrl && { baseUrl: config.apiUrl }),
  });

  // Register resources
  server.registerResource('kanta://structure/organization', 'kanta://structure/organization', {
    name: 'Structure organisationnelle',
    description: 'Informations sur les cabinets, utilisateurs et structure organisationnelle',
    mimeType: 'application/json',
  }, async () => {
    try {
      const [firms, users] = await Promise.all([
        kantaClient.getFirms(),
        kantaClient.getUsers().catch(() => ({ data: [] }))
      ]);

      return {
        contents: [{
          uri: 'kanta://structure/organization',
          mimeType: 'application/json',
          text: JSON.stringify({
            firms: firms.data,
            users: users.data,
            last_updated: new Date().toISOString()
          }, null, 2),
        }],
      };
    } catch (error) {
      throw new McpError(ErrorCode.InternalError, `Erreur lors de la récupération de la structure: ${error}`);
    }
  });

  server.registerResource('kanta://customers/summary', 'kanta://customers/summary', {
    name: 'Résumé des clients',
    description: 'Vue d\'ensemble de tous les clients avec informations essentielles',
    mimeType: 'application/json',
  }, async () => {
    try {
      const customers = await kantaClient.getCustomers({ per_page: 100 });

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
        contents: [{
          uri: 'kanta://customers/summary',
          mimeType: 'application/json',
          text: JSON.stringify({
            total_customers: customers.total_data,
            customers: summary,
            last_updated: new Date().toISOString()
          }, null, 2),
        }],
      };
    } catch (error) {
      throw new McpError(ErrorCode.InternalError, `Erreur lors de la récupération du résumé clients: ${error}`);
    }
  });

  // Note: Dynamic resources with templates will be handled via tools for now

  // Register tools
  const customerTools = createCustomerTools(kantaClient);
  const userTools = createUserTools(kantaClient);
  const personTools = createPersonTools(kantaClient);
  const miscTools = createMiscTools(kantaClient);

  const allTools = [...customerTools, ...userTools, ...personTools, ...miscTools];

  for (const tool of allTools) {
    server.registerTool(tool.name, {
      title: tool.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: tool.description || 'No description available',
      inputSchema: tool.inputSchema || {},
    }, async (args: any, extra: any) => {
      try {
        let result;

        // Route to appropriate handler
        if (tool.name.startsWith('get_customers') ||
            tool.name.startsWith('get_customer') ||
            tool.name.startsWith('create_customer') ||
            tool.name.startsWith('update_customer') ||
            tool.name.startsWith('search_customers') ||
            tool.name.startsWith('assign_customers') ||
            tool.name.includes('customer')) {
          result = await handleCustomerTool(kantaClient, tool.name, args);
        } else if (tool.name.startsWith('get_users') ||
                   tool.name.startsWith('get_user') ||
                   tool.name.startsWith('create_user') ||
                   tool.name.startsWith('delete_user') ||
                   tool.name.includes('user')) {
          result = await handleUserTool(kantaClient, tool.name, args);
        } else if (tool.name.startsWith('get_persons') ||
                   tool.name.startsWith('get_person') ||
                   tool.name.startsWith('upload_person') ||
                   tool.name.includes('person')) {
          result = await handlePersonTool(kantaClient, tool.name, args);
        } else if (tool.name.startsWith('get_firms') ||
                   tool.name.startsWith('get_structure') ||
                   tool.name.startsWith('download_file') ||
                   tool.name.includes('firm') ||
                   tool.name.includes('structure') ||
                   tool.name.includes('file')) {
          result = await handleMiscTool(kantaClient, tool.name, args);
        } else {
          throw new McpError(ErrorCode.MethodNotFound, `Outil inconnu: ${tool.name}`);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        };
      } catch (error) {
        if (error instanceof McpError) throw error;

        if (error instanceof z.ZodError) {
          const issues = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
          throw new McpError(ErrorCode.InvalidParams, `Erreurs de validation: ${issues}`);
        }

        if (error instanceof Error) {
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
          throw new McpError(ErrorCode.InternalError, `Erreur lors de l'exécution: ${error.message}`);
        }

        throw new McpError(ErrorCode.InternalError, `Erreur inconnue lors de l'exécution de l'outil ${tool.name}`);
      }
    });
  }

  return server.server;
}

// For local development with STDIO transport, run with tsx:
// tsx src/index.ts
// Ensure KANTA_API_KEY is set in .env