# Kanta MCP Server
[![smithery badge](https://smithery.ai/badge/@Kanta-Inc/kanta-mcp-server)](https://smithery.ai/server/@Kanta-Inc/kanta-mcp-server)

Un serveur MCP (Model Context Protocol) pour l'API Kanta, permettant l'intégration avec des modèles de langage comme Claude.

## Description

Ce serveur MCP expose les fonctionnalités de l'API Kanta v1.1 à travers le protocole MCP, permettant aux assistants IA d'interagir avec les données Kanta pour :

- Gérer les clients (création, mise à jour, recherche, assignation)
- Administrer les utilisateurs
- Consulter les données des personnes
- Accéder aux informations des cabinets et structures
- Récupérer les résumés de risques

## Fonctionnalités

### Gestion des Clients
- `get_customers` : Lister les clients avec pagination
- `get_customer` : Récupérer un client par ID
- `create_customer` : Créer un nouveau client
- `update_customer` : Mettre à jour un client existant
- `search_customers` : Rechercher des clients
- `assign_customers` : Assigner superviseurs/contributeurs
- `get_customer_risk_summary` : Récupérer le résumé des risques

### Gestion des Utilisateurs
- `get_users` : Lister les utilisateurs
- `get_user` : Récupérer un utilisateur par ID
- `create_user` : Créer un nouvel utilisateur
- `delete_user` : Supprimer un utilisateur

### Gestion des Personnes
- `get_persons` : Lister les personnes
- `get_person` : Récupérer une personne par ID

### Autres Fonctionnalités
- `get_firms` : Lister les cabinets
- `get_structure` : Récupérer les informations de structure

## Installation

### Installing via Smithery

To install kanta-mcp-server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@Kanta-Inc/kanta-mcp-server):

```bash
npx -y @smithery/cli install @Kanta-Inc/kanta-mcp-server --client claude
```

### Manual Installation
1. Cloner le repository :
```bash
git clone <repository-url>
cd kanta-mcp-server
```

2. Installer les dépendances :
```bash
npm install
```

3. Construire le serveur pour Smithery :
```bash
npm run build
```

## Configuration

### Configuration Smithery

Le serveur est configuré via Smithery avec les paramètres suivants :

- `apiKey` : Votre clé API Kanta (obligatoire)
- `apiUrl` : URL de base de l'API (optionnel, défaut: https://app.kanta.fr/api/v1)

### Obtention de la clé API

Pour obtenir votre clé API Kanta :
1. Connectez-vous à https://app.kanta.fr
2. Allez dans "Gestion du cabinet"
3. Sélectionnez "Clés API"
4. Générez ou copiez votre clé API

## Utilisation

### Lancement du serveur

```bash
# Lancement du serveur construit
npm start

# Mode développement avec Smithery
npm run dev
```

### Configuration MCP

Pour utiliser avec Claude Desktop, installez via Smithery :

```bash
npx -y @smithery/cli install @Kanta-Inc/kanta-mcp-server --client claude
```

La configuration de l'API key se fait via l'interface Smithery lors de l'installation.

## Développement

### Scripts disponibles

- `npm run build` : Construit le serveur pour le déploiement Smithery
- `npm start` : Lance le serveur construit localement
- `npm run dev` : Lance en mode développement avec Smithery CLI
- `npm run watch` : Lance en mode watch avec tsx

### Structure du projet

```
src/
├── index.ts              # Point d'entrée principal
├── types.ts              # Définitions de types et schémas Zod
├── kanta-client.ts       # Client HTTP pour l'API Kanta
└── tools/
    ├── customers.ts      # Outils pour la gestion des clients
    ├── users.ts          # Outils pour la gestion des utilisateurs
    ├── persons.ts        # Outils pour la gestion des personnes
    └── misc.ts           # Autres outils (cabinets, structure, fichiers)
```

## API Kanta

Ce serveur utilise l'API Kanta v1.1. Pour plus d'informations sur l'API :
- URL de base : https://app.kanta.fr/api/v1
- Authentification : Clé API via l'en-tête `X-API-Key`
- Documentation complète disponible dans le fichier `api-docs.json`

## Limitations

- Les fonctionnalités d'upload/download de fichiers ne sont pas disponibles (limitation MCP)
- Toutes les opérations nécessitent une clé API valide Kanta
- Focus sur les opérations CRUD et la consultation des données JSON

## Licence

MIT

## Support

Pour les questions relatives à l'API Kanta, consultez la documentation officielle Kanta.
Pour les problèmes liés à ce serveur MCP, créez une issue dans ce repository.