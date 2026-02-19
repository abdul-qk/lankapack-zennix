/**
 * OpenAPI 3.0 specification for Lankapack API.
 * Served at /api/openapi and rendered by Swagger UI at /api-docs.
 */
export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Lankapack Zennix API",
    description:
      "API for job cards, stock, sales, material receiving, cutting, printing, and slitting operations.",
    version: "1.0.0",
  },
  servers: [
    { url: "/api", description: "API base path" },
  ],
  tags: [
    { name: "Auth", description: "Login, logout, refresh token" },
    { name: "Health", description: "Health check" },
    { name: "Job", description: "Job cards, customers, colors, etc." },
    { name: "Stock", description: "Stock, bundles, stock-in-hand" },
    { name: "Sales", description: "DO, invoice, returns" },
    { name: "Material", description: "Material receiving notes, items" },
    { name: "Cutting", description: "Cutting operations" },
    { name: "Printing", description: "Printing operations" },
    { name: "Slitting", description: "Slitting operations" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        description: "Returns 200 if DB is reachable, 503 otherwise. For monitoring and load balancer probes.",
        responses: {
          "200": {
            description: "Service healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          "503": {
            description: "Service unhealthy (e.g. DB unreachable)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string", example: "error" } },
                },
              },
            },
          },
        },
      },
    },
    "/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        description: "Authenticate with username and password. Sets httpOnly cookies for access and refresh tokens.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string", description: "User login name" },
                  password: { type: "string", description: "Plain text password (hashed with MD5 server-side)" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Login successful" },
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "integer" },
                        username: { type: "string" },
                        email: { type: "string", nullable: true },
                        fullName: { type: "string", nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Invalid username or password",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { message: { type: "string" } },
                },
              },
            },
          },
          "500": { description: "Internal server error" },
        },
      },
    },
    "/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout",
        description: "Clear auth cookies.",
        responses: {
          "200": { description: "Logged out" },
        },
      },
    },
    "/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token",
        description: "Issue new access token using refresh token cookie.",
        responses: {
          "200": { description: "New access token set in cookie" },
          "401": { description: "Invalid or expired refresh token" },
        },
      },
    },
    "/job/jobcard": {
      get: {
        tags: ["Job"],
        summary: "List job cards",
        description: "Fetch all job cards with customer relation.",
        responses: {
          "200": {
            description: "List of job cards",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { type: "object" },
                    },
                  },
                },
              },
            },
          },
          "500": { description: "Server error" },
        },
      },
      delete: {
        tags: ["Job"],
        summary: "Delete job card",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["id"],
                properties: { id: { type: "integer" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Deleted" },
          "400": { description: "Job card ID required" },
          "500": { description: "Server error" },
        },
      },
    },
    "/job/jobcard/new": {
      post: {
        tags: ["Job"],
        summary: "Create job card",
        requestBody: {
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        responses: {
          "200": { description: "Created" },
          "400": { description: "Validation error" },
          "500": { description: "Server error" },
        },
      },
    },
    "/job/jobcard/edit/{id}": {
      put: {
        tags: ["Job"],
        summary: "Update job card",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        responses: {
          "200": { description: "Updated" },
          "500": { description: "Server error" },
        },
      },
    },
    "/stock/stock": {
      get: {
        tags: ["Stock"],
        summary: "List stock with filters",
        description: "Query stock with optional filters: materialId, indatepicker, outdatepicker, size_id, status_id, item_gsm.",
        parameters: [
          { name: "materialId", in: "query", schema: { type: "string" } },
          { name: "indatepicker", in: "query", schema: { type: "string", format: "date" } },
          { name: "outdatepicker", in: "query", schema: { type: "string", format: "date" } },
          { name: "size_id", in: "query", schema: { type: "string" } },
          { name: "status_id", in: "query", schema: { type: "string" } },
          { name: "item_gsm", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Filtered stock data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
          "500": { description: "Server error" },
        },
      },
    },
    "/stock/unique": {
      get: {
        tags: ["Stock"],
        summary: "Unique stock attributes",
        description: "Get distinct values for dropdowns (e.g. sizes, statuses).",
        responses: {
          "200": { description: "Unique values" },
          "500": { description: "Server error" },
        },
      },
    },
    "/sales/do": {
      get: {
        tags: ["Sales"],
        summary: "List delivery orders",
        responses: {
          "200": {
            description: "Sales/DO list with customer names",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
          "500": { description: "Server error" },
        },
      },
    },
    "/sales/invoice": {
      get: {
        tags: ["Sales"],
        summary: "List invoices",
        responses: {
          "200": { description: "Invoice list" },
          "500": { description: "Server error" },
        },
      },
    },
    "/material/material-receiving-note": {
      get: {
        tags: ["Material"],
        summary: "List material receiving notes",
        responses: {
          "200": { description: "List of MRNs" },
          "500": { description: "Server error" },
        },
      },
      post: {
        tags: ["Material"],
        summary: "Create material receiving note",
        requestBody: {
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        responses: {
          "200": { description: "Created" },
          "500": { description: "Server error" },
        },
      },
    },
    "/material/material-receiving-note/add-item": {
      post: {
        tags: ["Material"],
        summary: "Add item to MRN",
        requestBody: {
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        responses: {
          "200": { description: "Item added" },
          "500": { description: "Server error" },
        },
      },
    },
    "/material/material-receiving-note/finalize": {
      post: {
        tags: ["Material"],
        summary: "Finalize MRN",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { id: { type: "integer" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Finalized" },
          "500": { description: "Server error" },
        },
      },
    },
    "/cutting": {
      get: {
        tags: ["Cutting"],
        summary: "List cutting operations",
        responses: {
          "200": { description: "Cutting list" },
          "500": { description: "Server error" },
        },
      },
    },
    "/cutting/{id}": {
      get: {
        tags: ["Cutting"],
        summary: "Get cutting by ID",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Cutting detail" },
          "500": { description: "Server error" },
        },
      },
    },
    "/cutting/add-barcode": {
      post: {
        tags: ["Cutting"],
        summary: "Add barcode to cutting",
        requestBody: {
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        responses: {
          "200": { description: "Barcode added" },
          "500": { description: "Server error" },
        },
      },
    },
    "/printing": {
      get: {
        tags: ["Printing"],
        summary: "List printing operations",
        responses: {
          "200": { description: "Printing list" },
          "500": { description: "Server error" },
        },
      },
    },
    "/printing/{id}": {
      get: {
        tags: ["Printing"],
        summary: "Get printing by ID",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Printing detail" },
          "500": { description: "Server error" },
        },
      },
    },
    "/slitting": {
      get: {
        tags: ["Slitting"],
        summary: "List slitting operations",
        responses: {
          "200": { description: "Slitting list" },
          "500": { description: "Server error" },
        },
      },
    },
    "/slitting/{id}": {
      get: {
        tags: ["Slitting"],
        summary: "Get slitting by ID",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Slitting detail" },
          "500": { description: "Server error" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
        description: "Access token set by POST /api/login",
      },
    },
  },
  security: [{ cookieAuth: [] }],
} as const;
