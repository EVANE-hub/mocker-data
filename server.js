const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const YAML = require('yamljs');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(bodyParser.json());

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

const openapiPath = path.join(__dirname, 'zerve-openapi.yaml');
const apiDoc = YAML.load(openapiPath);

// Route pour servir la spécification OpenAPI en JSON
app.get('/api-spec', (req, res) => {
  res.json(apiDoc);
});

// Route pour la documentation API (Swagger UI)
app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'api-docs.html'));
});

// Rediriger la racine vers /api-docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});


/**
 * Charge un fichier de mock depuis le dossier mock-data
 */
function loadMockData(endpointName) {
  const filePath = path.join(__dirname, 'mock-data', `${endpointName}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return { message: `Aucun mock trouvé pour ${endpointName}` };
}

/**
 * Convertit un chemin OpenAPI en nom de fichier
 */
function routeToMockFileName(route) {
  return route
    .replace(/^\//, '')                   
    .replace(/\//g, '_')                   
    .replace(/{(\w+)}/g, '_$1');          
}

/**
 * Génère une réponse pour les méthodes DELETE
 */
function handleDelete(req, res) {
  res.status(204).send();
}

/**
 * Génère une réponse pour les méthodes PUT/POST
 */
function handleMutation(method, route, req, res) {
  const mockFileName = routeToMockFileName(route);
  const data = loadMockData(mockFileName);
  
  if (method === 'post') {
    res.status(201).json(data);
  } else {
    res.json(data);
  }
}

// Enregistrement des routes depuis OpenAPI
for (const [route, methods] of Object.entries(apiDoc.paths)) {
  for (const [method, def] of Object.entries(methods)) {
    const expressRoute = route.replace(/{(\w+)}/g, ':$1');
    const mockFileName = routeToMockFileName(route);
    
    if (method === 'delete') {
      app[method](expressRoute, handleDelete);
    } else if (method === 'put' || method === 'post') {
      app[method](expressRoute, (req, res) => handleMutation(method, route, req, res));
    } else if (method === 'get') {
      app[method](expressRoute, (req, res) => {
        const data = loadMockData(mockFileName);
        res.json(data);
      });
    }
  }
}

// Pour le développement local
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`🚀 Zerve API Docs disponible sur http://localhost:${port}/api-docs`);
  });
}

// Export pour Vercel
module.exports = app;