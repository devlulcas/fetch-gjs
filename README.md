# fetch-gjs

A simple fetch implementation for GJS (GNOME JavaScript) using GNOME Soup 3.0. This package provides a fetch-like API that works in GJS environments where the standard `fetch` function is not available.

## Installation

```bash
npm install fetch-gjs
```

## Quick Start

```javascript
import { makeFetch } from "fetch-gjs";
import Soup from "gi://Soup";

// Create a Soup session
const session = new Soup.Session();

// Create a fetch function
const fetch = makeFetch(session);

// Use it like the standard fetch API
const response = await fetch("https://api.example.com/data");
const data = await response.json();
console.log(data);
```

## Features

- **Fetch-like API**: Familiar interface similar to the standard `fetch` function
- **GJS Compatible**: Works in GNOME JavaScript environments
- **Soup 3.0**: Uses the latest GNOME Soup library for HTTP requests
- **Async/Await Support**: Full support for modern JavaScript async patterns
- **Response Methods**: Supports `.json()`, `.text()`, `.blob()`, and more

## API Reference

### `makeFetch(session)`

Creates a fetch function that uses the provided Soup session.

**Parameters:**

- `session` (Soup.Session): A GNOME Soup session instance

**Returns:**

- `FetchFunction`: A function that mimics the standard fetch API

**Throws:**

- `Error`: If session is not provided

### FetchFunction(url, options)

The returned fetch function accepts the same parameters as the standard fetch API.

**Parameters:**

- `url` (string | URL): The URL to fetch
- `options` (object, optional): Request options
  - `method` (string): HTTP method (default: 'GET')
  - `headers` (object): Request headers
  - `body` (string | Uint8Array): Request body

**Returns:**

- `Promise<Response>`: A promise that resolves to a Response-like object

## Usage Examples

### Basic GET Request

```javascript
import { makeFetch } from "fetch-gjs";
import Soup from "gi://Soup";

const session = new Soup.Session();
const fetch = makeFetch(session);

const response = await fetch("https://jsonplaceholder.typicode.com/posts/1");
const post = await response.json();
console.log(post.title);
```

### POST Request with JSON

```javascript
const response = await fetch("https://api.example.com/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "John Doe",
    email: "john@example.com",
  }),
});

const newUser = await response.json();
```

### Handling Errors

```javascript
try {
  const response = await fetch("https://api.example.com/data");

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
} catch (error) {
  console.error("Fetch failed:", error);
}
```

### Working with Response Methods

```javascript
const response = await fetch("https://api.example.com/file");

// Get as text
const text = await response.text();

// Get as JSON
const json = await response.json();

// Get as blob
const blob = await response.blob();

// Get as array buffer
const buffer = await response.arrayBuffer();
```

## Important Notes

### GJS Environment Requirements

This package is designed for GJS (GNOME JavaScript) environments and requires:

- GNOME Shell or GJS runtime
- GNOME Soup 3.0 library
- GObject Introspection bindings

### Limitations

- **No Streaming**: This implementation does not support streaming request/response bodies
- **No Abort Signals**: AbortController and AbortSignal are not supported
- **No Cookies**: Cookie handling is not implemented
- **Limited Body Types**: Only string and Uint8Array body types are supported

### Performance Considerations

For applications making multiple requests, reuse the same Soup.Session:

```javascript
// Good: Reuse session
const session = new Soup.Session();
const fetch = makeFetch(session);

// Make multiple requests with the same session
const response1 = await fetch("https://api.example.com/endpoint1");
const response2 = await fetch("https://api.example.com/endpoint2");
```

### Error Handling

The implementation may throw different errors than the standard fetch API due to GJS and Soup differences. Always wrap fetch calls in try-catch blocks:

```javascript
try {
  const response = await fetch(url, options);
  // Handle response
} catch (error) {
  // Handle GJS/Soup specific errors
  console.error("Request failed:", error);
}
```

## Development

### Prerequisites

- Node.js 18+
- pnpm (recommended package manager)
- GJS development environment

### Setup

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev
```

### Building

The package is distributed as ES modules and doesn't require a build step.

## License

MIT © Lucas Alves Rego

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Related

- [GJS Guide](https://gjs.guide/) - Comprehensive guide to GJS development
- [GNOME Soup Documentation](https://libsoup.gnome.org/libsoup-3.0/index.html) - Official Soup 3.0 documentation
- [GJS Asynchronous Programming](https://gjs.guide/guides/gjs/asynchronous-programming.html) - Async patterns in GJS
