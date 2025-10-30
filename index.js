const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const YAML = require('yamljs');
const bodyParser = require('body-parser');

const app = express();
const port = parseInt(process.env.PORT || '3002', 10);
const host = process.env.HOST || '0.0.0.0';

// Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.use(cors());
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Charger le fichier OpenAPI
const openapiPath = path.join(__dirname, 'zerve-openapi.yaml');
let apiDoc;

try {
  apiDoc = YAML.load(openapiPath);
  console.log(`✅ OpenAPI spec loaded: ${Object.keys(apiDoc.paths).length} endpoints`);
} catch (error) {
  console.error('❌ Error loading OpenAPI spec:', error);
  process.exit(1);
}

/**
 * Charge un fichier de mock depuis le dossier mock-data
 */
function loadMockData(endpointName) {
  try {
    const filePath = path.join(__dirname, 'mock-data', `${endpointName}.json`);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    console.warn(`⚠️  Mock file not found: ${endpointName}.json`);
    return { message: `Aucun mock trouvé pour ${endpointName}` };
  } catch (error) {
    console.error(`❌ Error loading mock data for ${endpointName}:`, error);
    return { error: 'Internal server error', message: error.message };
  }
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
        const data = loadMockData(mockFileName);
        res.json(data);
      });
    }
    routeCount++;
  }
}
console.log(`✅ ${routeCount} API routes registered`);

// Route pour servir la spec OpenAPI en JSON (optionnel)
app.get('/api-spec', (req, res) => {
  res.json(apiDoc);
});

// Page d'accueil simple
app.get('/', (req, res) => {
  res.json({
    message: 'Zerve Mock API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      spec: '/api-spec',
      documentation: 'See OpenAPI spec at /api-spec'
    },
    totalRoutes: routeCount
  });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(port, host, () => {
  const displayHost = process.env.PUBLIC_URL || (host === '0.0.0.0' ? '0.0.0.0' : host);
  console.log('='.repeat(60));
  console.log(`🚀 Zerve Mock Server`);
  console.log(`� API Base URL: http://${displayHost}:${port}`);
  console.log(`💚 Health Check: http://${displayHost}:${port}/health`);
  console.log(`📄 OpenAPI Spec: http://${displayHost}:${port}/api-spec`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 API Routes: ${routeCount} endpoints`);
  console.log(`🎯 Listening on: ${host}:${port}`);
  console.log('='.repeat(60));
});

process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;