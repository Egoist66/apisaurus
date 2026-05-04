export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  spec: OpenAPISpec;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string;
  requests: CollectionRequest[];
  createdAt: string;
  updatedAt: string;
}

export interface CollectionRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Header[];
  params: Param[];
  body?: string;
  bodyType?: 'json' | 'form-data' | 'x-www-form-urlencoded' | 'xml' | 'text' | 'none';
  description?: string;
  createdAt: string;
}

export interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

export interface Param {
  key: string;
  value: string;
  enabled: boolean;
}

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
    contact?: {
      name?: string;
      email?: string;
      url?: string;
    };
    license?: {
      name: string;
      url?: string;
    };
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, Schema>;
    securitySchemes?: Record<string, SecurityScheme>;
  };
  security?: Array<Record<string, string[]>>;
  tags?: Tag[];
}

export interface PathItem {
  summary?: string;
  description?: string;
  get?: Operation;
  post?: Operation;
  put?: Operation;
  patch?: Operation;
  delete?: Operation;
  options?: Operation;
  head?: Operation;
  trace?: Operation;
  parameters?: Parameter[];
  servers?: Array<{ url: string; description?: string }>;
}

export interface Operation {
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
  security?: Array<Record<string, string[]>>;
  deprecated?: boolean;
}

export interface Parameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: Schema;
  example?: string;
}

export interface RequestBody {
  description?: string;
  required?: boolean;
  content?: Record<string, MediaType>;
}

export interface Response {
  description: string;
  content?: Record<string, MediaType>;
  headers?: Record<string, Header>;
}

export interface MediaType {
  schema?: Schema;
  example?: any;
  examples?: Record<string, { value: any; summary?: string }>;
}

export interface Schema {
  type?: string;
  format?: string;
  description?: string;
  properties?: Record<string, Schema>;
  items?: Schema;
  required?: string[];
  enum?: string[];
  default?: any;
  example?: any;
  allOf?: Schema[];
  oneOf?: Schema[];
  anyOf?: Schema[];
  nullable?: boolean;
  $ref?: string;
}

export interface SecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  name?: string;
  in?: 'header' | 'query' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlows;
  openIdConnectUrl?: string;
}

export interface OAuthFlows {
  implicit?: OAuthFlow;
  password?: OAuthFlow;
  clientCredentials?: OAuthFlow;
  authorizationCode?: OAuthFlow;
}

export interface OAuthFlow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export interface Tag {
  name: string;
  description?: string;
}

export interface TestResult {
  requestId: string;
  method: string;
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
  timestamp: string;
  error?: string;
}

export interface AuthSession {
  user: Omit<User, 'password'>;
  token: string;
}

export interface HistoryEntry {
  id: string;
  method: string;
  url: string;
  headers: Header[];
  params: Param[];
  body?: string;
  bodyType?: string;
  status?: number;
  statusText?: string;
  duration?: number;
  timestamp: string;
  error?: string;
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvVariable[];
  isActive: boolean;
}

export interface EnvVariable {
  key: string;
  value: string;
  enabled: boolean;
}

export interface ApiTemplate {
  id: string;
  name: string;
  description: string;
  type: 'rest' | 'graphql' | 'crud';
  icon: string;
  spec: OpenAPISpec;
}

export interface ResponseStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsByStatus: Record<string, number>;
  requestsByMethod: Record<string, number>;
}

export type Theme = 'dark' | 'light';
