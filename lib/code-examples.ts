import { Header, Param } from '@/types';

interface CodeExampleOptions {
  method: string;
  url: string;
  headers: Header[];
  params: Param[];
  body?: string;
  bodyType?: string;
}

export function generateCodeExamples(options: CodeExampleOptions): Record<string, string> {
  return {
    'cURL': generateCurl(options),
    'JavaScript': generateJavaScript(options),
    'Python': generatePython(options),
    'Go': generateGo(options),
  };
}

function buildQueryString(params: Param[]): string {
  const enabled = params.filter(p => p.enabled && p.key);
  if (enabled.length === 0) return '';
  const qs = enabled.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
  return `?${qs}`;
}

function generateCurl({ method, url, headers, params, body, bodyType }: CodeExampleOptions): string {
  const fullUrl = url + buildQueryString(params);
  let cmd = `curl -X ${method.toUpperCase()} '${fullUrl}'`;

  const enabledHeaders = headers.filter(h => h.enabled && h.key);
  for (const header of enabledHeaders) {
    cmd += ` \\\n  -H '${header.key}: ${header.value}'`;
  }

  if (body && bodyType !== 'none') {
    cmd += ` \\\n  -d '${body}'`;
  }

  return cmd;
}

function generateJavaScript({ method, url, headers, params, body, bodyType }: CodeExampleOptions): string {
  const fullUrl = url + buildQueryString(params);
  const enabledHeaders = headers.filter(h => h.enabled && h.key);

  let code = `const response = await fetch('${fullUrl}', {
  method: '${method.toUpperCase()}',`;

  if (enabledHeaders.length > 0) {
    code += `
  headers: {`;
    for (const header of enabledHeaders) {
      code += `
    '${header.key}': '${header.value}',`;
    }
    code += `
  },`;
  }

  if (body && bodyType !== 'none') {
    code += `
  body: ${bodyType === 'json' ? `JSON.stringify(${body})` : `'${body}'`},`;
  }

  code += `
});

const data = await response.json();
console.log(data);`;

  return code;
}

function generatePython({ method, url, headers, params, body, bodyType }: CodeExampleOptions): string {
  const fullUrl = url + buildQueryString(params);
  const enabledHeaders = headers.filter(h => h.enabled && h.key);

  let code = `import requests

url = "${fullUrl}"`;

  if (enabledHeaders.length > 0) {
    code += `
headers = {`;
    for (const header of enabledHeaders) {
      code += `
    "${header.key}": "${header.value}",`;
    }
    code += `
}`;
  }

  if (body && bodyType !== 'none') {
    code += `
payload = ${bodyType === 'json' ? body : `"""${body}"""`}`;
  }

  code += `

response = requests.${method.toLowerCase()}(url`;
  if (enabledHeaders.length > 0) code += `, headers=headers`;
  if (body && bodyType !== 'none') code += bodyType === 'json' ? `, json=payload` : `, data=payload`;
  code += `)

print(response.status_code)
print(response.json())`;

  return code;
}

function generateGo({ method, url, headers, params, body, bodyType }: CodeExampleOptions): string {
  const fullUrl = url + buildQueryString(params);
  const enabledHeaders = headers.filter(h => h.enabled && h.key);

  let code = `package main

import (
	"fmt"
	"io"
	"net/http"
	"strings"
)

func main() {`;

  if (body && bodyType !== 'none') {
    code += `
	payload := strings.NewReader(\`${body}\`)`;
  }

  code += `

	req, _ := http.NewRequest("${method.toUpperCase()}", "${fullUrl}"`;
  if (body && bodyType !== 'none') {
    code += `, payload`;
  } else {
    code += `, nil`;
  }
  code += `)
`;

  for (const header of enabledHeaders) {
    code += `	req.Header.Add("${header.key}", "${header.value}")\n`;
  }

  code += `
	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))
}`;

  return code;
}
