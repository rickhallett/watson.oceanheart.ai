import index from "./index.html";

const server = Bun.serve({
  port: 3000,
  fetch(request) {
    const url = new URL(request.url);
    
    // Serve the main HTML file
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(index, {
        headers: {
          "Content-Type": "text/html",
        },
      });
    }
    
    // Handle other routes (SPA routing)
    if (url.pathname.startsWith("/api/")) {
      // Proxy API requests to Django backend
      const backendUrl = `http://localhost:8000${url.pathname}${url.search}`;
      return fetch(backendUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
    }
    
    // For all other routes, serve the index.html (SPA)
    return new Response(index, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Watson Frontend Server running at http://localhost:${server.port}`);
console.log(`🔄 Hot Module Reloading enabled`);
console.log(`🔗 API proxy to Django backend at http://localhost:8000`);
console.log(`🛑 Press Ctrl+C to stop the server`);