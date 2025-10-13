const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const YAML = require('yamljs');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const openapiPath = path.join(__dirname, 'zerve-openapi.yaml');
const apiDoc = YAML.load(openapiPath);

console.log("📘 Chargement du schéma OpenAPI...");
console.log(`→ ${Object.keys(apiDoc.paths).length} endpoints trouvés.`);

// Configuration de Swagger UI avec options améliorées
const swaggerOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Zerve API Documentation',
  swaggerOptions: {
    url: '/api-spec.json',
  }
};

// Servir la spécification OpenAPI en JSON
app.get('/api-spec.json', (req, res) => {
  res.json(apiDoc);
});

// Route pour Swagger UI
app.use('/api-docs', swaggerUi.serveFiles(apiDoc, swaggerOptions), swaggerUi.setup(apiDoc, swaggerOptions));

/**
 * Charge un fichier de mock depuis le dossier mock-data
 * @param {string} endpointName - Nom du fichier (sans extension .json)
 * @returns {object} Données mockées ou message d'erreur
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
 * Exemple: /nightclubs/{id}/tables → nightclubs__id_tables
 * @param {string} route - Route OpenAPI
 * @returns {string} Nom du fichier de mock
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
  console.log(`[DELETE] ${req.path} - Suppression simulée`);
  res.status(204).send();
}

/**
 * Génère une réponse pour les méthodes PUT/POST
 */
function handleMutation(method, route, req, res) {
  const mockFileName = routeToMockFileName(route);
  console.log(`[${method.toUpperCase()}] ${req.path} - Lecture depuis ${mockFileName}.json`);
  
  const data = loadMockData(mockFileName);
  
  if (method === 'post') {
    res.status(201).json(data);
  } else {
    res.json(data);
  }
}


let routeCount = 0;
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
        console.log(`[GET] ${req.path}`);
        const data = loadMockData(mockFileName);
        res.json(data);
      });
    }
    
    routeCount++;
  }
}

console.log(`✅ ${routeCount} routes enregistrées\n`);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    routes: routeCount
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} non définie dans l'API`,
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`🚀 Mock server Zerve démarré sur http://localhost:${port}`);
  console.log(`📚 Documentation Swagger: http://localhost:${port}/api-docs`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`\n💡 Exemples d'endpoints:`);
  console.log(`   GET  http://localhost:${port}/auth/ping`);
  console.log(`   GET  http://localhost:${port}/nightclubs`);
  console.log(`   GET  http://localhost:${port}/nightclubs/1`);
  console.log(`   GET  http://localhost:${port}/nightclubs/1/tables`);
  console.log(`   GET  http://localhost:${port}/users/me`);
  console.log(`   GET  http://localhost:${port}/reservations`);
});

