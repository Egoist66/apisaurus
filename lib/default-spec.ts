import { OpenAPISpec } from '@/types';

export function getDefaultSpec(): OpenAPISpec {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Мой API',
      version: '1.0.0',
      description: 'Описание API',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Локальный сервер',
      },
    ],
    paths: {},
    components: {
      schemas: {},
    },
  };
}
