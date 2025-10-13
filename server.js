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

// Servir les fichiers statiques (pour swagger.html)
app.use('/public', express.static(path.join(__dirname, 'public')));

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

// Route alternative avec HTML statique (fonctionne mieux sur Vercel)
app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'swagger.html'));
});

// Route pour Swagger UI (version swagger-ui-express)
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

// Page d'accueil avec liens vers la documentation
app.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Zerve Mock Server</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          padding: 50px;
          max-width: 800px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
          color: #667eea;
          font-size: 3em;
          margin-bottom: 10px;
          text-align: center;
        }
        .subtitle {
          color: #666;
          text-align: center;
          margin-bottom: 40px;
          font-size: 1.2em;
        }
        .card {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 25px;
          margin-bottom: 20px;
          border-left: 4px solid #667eea;
        }
        .card h2 {
          color: #333;
          margin-bottom: 15px;
          font-size: 1.5em;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 30px;
          border-radius: 8px;
          text-decoration: none;
          margin: 5px;
          font-weight: 600;
          transition: transform 0.2s;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
          margin-top: 30px;
        }
        .stat {
          text-align: center;
          padding: 20px;
          background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
          border-radius: 10px;
        }
        .stat-number {
          font-size: 2.5em;
          font-weight: bold;
          color: #667eea;
        }
        .stat-label {
          color: #666;
          margin-top: 5px;
        }
        .endpoint-list {
          background: white;
          border-radius: 8px;
          padding: 15px;
          margin-top: 15px;
        }
        .endpoint {
          font-family: 'Courier New', monospace;
          padding: 8px;
          margin: 5px 0;
          background: #f0f0f0;
          border-radius: 4px;
          font-size: 0.9em;
        }
        .method {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: bold;
          margin-right: 10px;
          font-size: 0.85em;
        }
        .get { background: #61affe; color: white; }
        .post { background: #49cc90; color: white; }
        .put { background: #fca130; color: white; }
        .delete { background: #f93e3e; color: white; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎉 Zerve Mock Server</h1>
        <p class="subtitle">API REST mockée pour le développement</p>
        
        <div class="card">
          <h2>📚 Documentation Interactive</h2>
          <p>Explorez et testez tous les endpoints de l'API avec Swagger UI :</p>
          <div style="margin-top: 15px;">
            <a href="/docs" class="btn">📖 Swagger UI (Recommandé)</a>
            <a href="/api-docs" class="btn">📘 Alternative</a>
          </div>
        </div>

        <div class="stats">
          <div class="stat">
            <div class="stat-number">${routeCount}</div>
            <div class="stat-label">Routes</div>
          </div>
          <div class="stat">
            <div class="stat-number">30+</div>
            <div class="stat-label">Endpoints</div>
          </div>
          <div class="stat">
            <div class="stat-number">9</div>
            <div class="stat-label">Entités</div>
          </div>
        </div>

        <div class="card">
          <h2>🚀 Endpoints Principaux</h2>
          <div class="endpoint-list">
            <div class="endpoint"><span class="method get">GET</span> ${baseUrl}/nightclubs</div>
            <div class="endpoint"><span class="method get">GET</span> ${baseUrl}/nightclubs/{id}/tables</div>
            <div class="endpoint"><span class="method get">GET</span> ${baseUrl}/users/me</div>
            <div class="endpoint"><span class="method get">GET</span> ${baseUrl}/reservations</div>
            <div class="endpoint"><span class="method post">POST</span> ${baseUrl}/reservations</div>
            <div class="endpoint"><span class="method get">GET</span> ${baseUrl}/nightclubs/{id}/products</div>
            <div class="endpoint"><span class="method get">GET</span> ${baseUrl}/orders/{id}</div>
            <div class="endpoint"><span class="method get">GET</span> ${baseUrl}/dashboard/reservations</div>
          </div>
        </div>

        <div class="card">
          <h2>🔗 Liens Utiles</h2>
          <a href="/health" class="btn">💚 Health Check</a>
          <a href="/api-spec.json" class="btn">📄 OpenAPI Spec (JSON)</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

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
  console.log(`🏠 Page d'accueil: http://localhost:${port}/`);
  console.log(`📚 Documentation Swagger: http://localhost:${port}/docs (Recommandé pour Vercel)`);
  console.log(`📘 Swagger alternatif: http://localhost:${port}/api-docs`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`\n💡 Exemples d'endpoints:`);
  console.log(`   GET  http://localhost:${port}/auth/ping`);
  console.log(`   GET  http://localhost:${port}/nightclubs`);
  console.log(`   GET  http://localhost:${port}/nightclubs/1`);
  console.log(`   GET  http://localhost:${port}/nightclubs/1/tables`);
  console.log(`   GET  http://localhost:${port}/users/me`);
  console.log(`   GET  http://localhost:${port}/reservations`);
});

