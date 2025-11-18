const { parseOpenAPISpec } = require('./openapi-parser.js');

const specPath = process.argv[2] || './openapi-updated.json';
const entities = parseOpenAPISpec(specPath);
console.log('Available entities (from OpenAPI):');
entities.forEach(e => console.log(`  - ${e.name} (${e.endpoint})`));