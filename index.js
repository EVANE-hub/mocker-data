const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const YAML = require('yamljs');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(bodyParser.json());

const openapiPath = path.join(__dirname, 'zerve-openapi.yaml');
const apiDoc = YAML.load(openapiPath);

// Configuration de Swagger UI
const swaggerOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Zerve API Documentation',
};

// Route pour Swagger UI uniquement
app.use('/', swaggerUi.serve, swaggerUi.setup(apiDoc, swaggerOptions));


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

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`🚀 Zerve API Docs disponible sur http://mocker-data-ten.vercel.app/api-docs`);
  });
}

module.exports = app;