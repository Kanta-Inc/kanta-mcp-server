# Kanta MCP Server

Un serveur MCP (Model Context Protocol) pour l'API Kanta, permettant l'intégration avec des modèles de langage comme Claude.

## Description

Ce serveur MCP expose les fonctionnalités de l'API Kanta v1.1 à travers le protocole MCP, permettant aux assistants IA d'interagir avec les données Kanta pour :

- Gérer les clients (création, mise à jour, recherche, assignation)
- Administrer les utilisateurs
- Manipuler les données des personnes
- Accéder aux informations des cabinets et structures
- Télécharger des fichiers et rapports

## Fonctionnalités

### Gestion des Clients
- `get_customers` : Lister les clients avec pagination
- `get_customer` : Récupérer un client par ID
- `create_customer` : Créer un nouveau client
- `update_customer` : Mettre à jour un client existant
- `search_customers` : Rechercher des clients
- `assign_customers` : Assigner superviseurs/contributeurs
- `get_customer_risk_summary` : Récupérer le résumé des risques
- `download_customer_risk_report` : Télécharger le rapport de risque

### Gestion des Utilisateurs
- `get_users` : Lister les utilisateurs
- `get_user` : Récupérer un utilisateur par ID
- `create_user` : Créer un nouvel utilisateur
- `delete_user` : Supprimer un utilisateur

### Gestion des Personnes
- `get_persons` : Lister les personnes
- `get_person` : Récupérer une personne par ID
- `upload_person_document` : Uploader un document d'identité

### Autres Fonctionnalités
- `get_firms` : Lister les cabinets
- `get_structure` : Récupérer les informations de structure
- `download_file` : Télécharger un fichier par ID

## Installation

1. Cloner le repository :
```bash
git clone <repository-url>
cd kanta-mcp-server
```

2. Installer les dépendances :
```bash
npm install
```

3. Compiler le TypeScript :
```bash
npm run build
```

## Configuration

### Variables d'environnement requises

- `KANTA_API_KEY` : Votre clé API Kanta (obligatoire)
- `KANTA_API_URL` : URL de base de l'API (optionnel, défaut: https://app.kanta.fr/api/v1)

### Obtention de la clé API

Pour obtenir votre clé API Kanta :
1. Connectez-vous à https://app.kanta.fr
2. Allez dans "Gestion du cabinet"
3. Sélectionnez "Clés API"
4. Générez ou copiez votre clé API

## Utilisation

### Lancement du serveur

```bash
# Avec npm
KANTA_API_KEY=your_api_key npm start

# Ou avec tsx pour le développement
KANTA_API_KEY=your_api_key npm run dev
```

### Configuration MCP

Ajoutez cette configuration à votre client MCP (comme Claude Desktop) :

```json
{
  "mcpServers": {
    "kanta": {
      "command": "node",
      "args": ["/chemin/vers/kanta-mcp-server/dist/index.js"],
      "env": {
        "KANTA_API_KEY": "votre_cle_api_ici"
      }
    }
  }
}
```

## Développement

### Scripts disponibles

- `npm run build` : Compile le TypeScript
- `npm start` : Lance le serveur compilé
- `npm run dev` : Lance en mode développement avec tsx
- `npm run watch` : Lance en mode watch pour le développement

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

- Les uploads de fichiers pour les documents de personnes sont simplifiés dans cette implémentation
- Les téléchargements de fichiers binaires retournent des métadonnées plutôt que les fichiers eux-mêmes
- Toutes les opérations nécessitent une clé API valide Kanta

## Licence

MIT

## Support

Pour les questions relatives à l'API Kanta, consultez la documentation officielle Kanta.
Pour les problèmes liés à ce serveur MCP, créez une issue dans ce repository.