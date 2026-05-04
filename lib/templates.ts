import { ApiTemplate, OpenAPISpec } from '@/types';

export const apiTemplates: ApiTemplate[] = [
  {
    id: 'rest-api',
    name: 'REST API',
    description: 'Standard RESTful API with common CRUD endpoints',
    type: 'rest',
    icon: '🌐',
    spec: {
      openapi: '3.0.0',
      info: {
        title: 'My REST API',
        version: '1.0.0',
        description: 'A standard RESTful API for managing resources',
      },
      servers: [{ url: 'https://api.example.com/v1', description: 'Production server' }],
      paths: {
        '/items': {
          get: {
            summary: 'List all items',
            description: 'Retrieve a paginated list of all items',
            tags: ['Items'],
            parameters: [
              { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
              { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Items per page' },
            ],
            responses: {
              '200': { description: 'Successful response', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Item' } } } } },
            },
          },
          post: {
            summary: 'Create an item',
            description: 'Create a new item',
            tags: ['Items'],
            requestBody: {
              required: true,
              content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateItem' } } },
            },
            responses: {
              '201': { description: 'Item created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Item' } } } },
            },
          },
        },
        '/items/{id}': {
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          get: {
            summary: 'Get an item',
            description: 'Retrieve a single item by ID',
            tags: ['Items'],
            responses: {
              '200': { description: 'Successful response', content: { 'application/json': { schema: { $ref: '#/components/schemas/Item' } } } },
              '404': { description: 'Item not found' },
            },
          },
          put: {
            summary: 'Update an item',
            description: 'Fully update an existing item',
            tags: ['Items'],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateItem' } } } },
            responses: {
              '200': { description: 'Item updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Item' } } } },
            },
          },
          delete: {
            summary: 'Delete an item',
            description: 'Delete an item by ID',
            tags: ['Items'],
            responses: { '204': { description: 'Item deleted' } },
          },
        },
      },
      components: {
        schemas: {
          Item: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              description: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          CreateItem: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
      },
    },
  },
  {
    id: 'graphql-api',
    name: 'GraphQL API',
    description: 'GraphQL endpoint schema with queries and mutations',
    type: 'graphql',
    icon: '◈',
    spec: {
      openapi: '3.0.0',
      info: {
        title: 'GraphQL API',
        version: '1.0.0',
        description: 'A GraphQL API for flexible data queries',
      },
      servers: [{ url: 'https://api.example.com/graphql', description: 'GraphQL endpoint' }],
      paths: {
        '/graphql': {
          post: {
            summary: 'Execute GraphQL query',
            description: 'Send queries and mutations to the GraphQL endpoint',
            tags: ['GraphQL'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      query: { type: 'string', description: 'GraphQL query string' },
                      variables: { type: 'object', description: 'Query variables' },
                      operationName: { type: 'string', description: 'Operation name' },
                    },
                  },
                  example: {
                    query: 'query GetUser($id: ID!) { user(id: $id) { id name email posts { title } } }',
                    variables: { id: '123' },
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'GraphQL response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        data: { type: 'object' },
                        errors: { type: 'array', items: { type: 'object' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              posts: { type: 'array', items: { $ref: '#/components/schemas/Post' } },
            },
          },
          Post: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              content: { type: 'string' },
              author: { $ref: '#/components/schemas/User' },
            },
          },
        },
      },
    },
  },
  {
    id: 'crud-api',
    name: 'CRUD API',
    description: 'Complete CRUD operations for users and products',
    type: 'crud',
    icon: '📦',
    spec: {
      openapi: '3.0.0',
      info: {
        title: 'CRUD API',
        version: '1.0.0',
        description: 'A complete CRUD API for users and products management',
      },
      servers: [{ url: 'https://api.example.com/v1', description: 'Production' }],
      paths: {
        '/users': {
          get: {
            summary: 'List users',
            tags: ['Users'],
            responses: { '200': { description: 'List of users', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } } },
          },
          post: {
            summary: 'Create user',
            tags: ['Users'],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateUser' } } } },
            responses: { '201': { description: 'User created', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } } },
          },
        },
        '/users/{id}': {
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          get: { summary: 'Get user', tags: ['Users'], responses: { '200': { description: 'User details', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } }, '404': { description: 'Not found' } } },
          put: { summary: 'Update user', tags: ['Users'], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateUser' } } } }, responses: { '200': { description: 'User updated' } } },
          delete: { summary: 'Delete user', tags: ['Users'], responses: { '204': { description: 'User deleted' } } },
        },
        '/products': {
          get: {
            summary: 'List products',
            tags: ['Products'],
            parameters: [
              { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter by category' },
              { name: 'minPrice', in: 'query', schema: { type: 'number' }, description: 'Minimum price' },
              { name: 'maxPrice', in: 'query', schema: { type: 'number' }, description: 'Maximum price' },
            ],
            responses: { '200': { description: 'List of products', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Product' } } } } } },
          },
          post: {
            summary: 'Create product',
            tags: ['Products'],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateProduct' } } } },
            responses: { '201': { description: 'Product created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } } },
          },
        },
        '/products/{id}': {
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          get: { summary: 'Get product', tags: ['Products'], responses: { '200': { description: 'Product details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } } } },
          put: { summary: 'Update product', tags: ['Products'], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateProduct' } } } }, responses: { '200': { description: 'Product updated' } } },
          delete: { summary: 'Delete product', tags: ['Products'], responses: { '204': { description: 'Product deleted' } } },
        },
      },
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: { id: { type: 'string' }, name: { type: 'string' }, email: { type: 'string' }, role: { type: 'string', enum: ['admin', 'user', 'viewer'] }, createdAt: { type: 'string', format: 'date-time' } },
          },
          CreateUser: {
            type: 'object',
            required: ['name', 'email'],
            properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, role: { type: 'string', enum: ['admin', 'user', 'viewer'], default: 'user' } },
          },
          Product: {
            type: 'object',
            properties: { id: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' }, price: { type: 'number' }, category: { type: 'string' }, inStock: { type: 'boolean' } },
          },
          CreateProduct: {
            type: 'object',
            required: ['name', 'price'],
            properties: { name: { type: 'string' }, description: { type: 'string' }, price: { type: 'number' }, category: { type: 'string' }, inStock: { type: 'boolean', default: true } },
          },
        },
      },
    },
  },
];
