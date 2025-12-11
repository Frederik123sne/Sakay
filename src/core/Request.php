<?php
class Request
{
    // Request method (GET, POST, PUT, DELETE, etc.)
    private $method;

    // Request URI path (e.g., /users, /products/1)
    private $uri;

    // Route parameters (e.g., /users/{id})
    private $params;

    // Query parameters ($_GET)
    private $query;

    // Request body ($_POST or JSON payload)
    private $body;

    // HTTP request headers
    private $headers;

    // Uploaded files ($_FILES)
    private $files;

    // Cookies ($_COOKIE)
    private $cookies;

    // All server variables ($_SERVER)
    private $server;

    /**
     * Constructor
     * Initializes the request object and populates properties
     */
    public function __construct()
    {
        $this->method = $_SERVER['REQUEST_METHOD']; // GET, POST, etc.
        $this->uri = $this->parseUri(); // Get URI path
        $this->params = []; // Route params are empty by default
        $this->query = $_GET; // Query parameters from URL
        $this->body = $this->parseBody(); // Parse request body
        $this->headers = $this->parseHeaders(); // Parse headers from $_SERVER
        $this->files = $_FILES; // Uploaded files
        $this->cookies = $_COOKIE; // Cookies
        $this->server = $_SERVER; // Server info
    }

    /**
     * Parse the URI path from $_SERVER['REQUEST_URI']
     */
    private function parseUri(): string
    {
        $uri = $_SERVER['REQUEST_URI'];
        $uri = parse_url($uri, PHP_URL_PATH); // Remove query string
        return rtrim($uri, '/') ?: '/'; // Ensure '/' if empty
    }

    /**
     * Parse request body
     * Supports JSON payloads and regular form POST
     * FIXED: Better JSON detection and error handling
     */
    private function parseBody(): array
    {
        // Get content type
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        
        // Remove charset and other parameters from content type
        $contentType = strtok($contentType, ';');
        $contentType = trim($contentType);
        
        // If JSON, decode it
        if ($contentType === 'application/json') {
            $input = file_get_contents('php://input'); // Get raw body
            
            if (empty($input)) {
                error_log("Request: Empty JSON input received");
                return [];
            }
            
            $decoded = json_decode($input, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log("Request: JSON decode error - " . json_last_error_msg());
                error_log("Request: Raw input (first 500 chars): " . substr($input, 0, 500));
                return [];
            }
            
            if (!is_array($decoded)) {
                error_log("Request: Decoded JSON is not an array");
                return [];
            }
            
            error_log("Request: Successfully parsed JSON body with " . count($decoded) . " fields");
            return $decoded;
        }

        // Default: standard form POST data
        return $_POST;
    }

    /**
     * Parse HTTP headers from $_SERVER
     */
    private function parseHeaders(): array
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (strpos($key, 'HTTP_') === 0) { // Headers start with HTTP_
                $header = str_replace('HTTP_', '', $key);
                $header = str_replace('_', '-', $header); // Convert underscores to dashes
                $header = ucwords(strtolower($header), '-'); // Normalize capitalization
                $headers[$header] = $value;
            }
        }
        
        // Also include CONTENT_TYPE and CONTENT_LENGTH if present
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['Content-Type'] = $_SERVER['CONTENT_TYPE'];
        }
        if (isset($_SERVER['CONTENT_LENGTH'])) {
            $headers['Content-Length'] = $_SERVER['CONTENT_LENGTH'];
        }
        
        return $headers;
    }

    /** Get request method */
    public function getMethod(): string
    {
        return $this->method;
    }

    /** Get request URI */
    public function getUri(): string
    {
        return $this->uri;
    }

    /** Set route parameters (e.g., /users/{id}) */
    public function setParams(array $params): void
    {
        $this->params = $params;
    }

    /** Get a route parameter or default */
    public function param(string $key, $default = null)
    {
        return $this->params[$key] ?? $default;
    }

    /**
     * Get query parameters
     * - No key: returns all query params
     * - With key: returns specific value or default
     */
    public function query($key = null, $default = null)
    {
        if ($key === null) {
            return $this->query;
        }
        return $this->query[$key] ?? $default;
    }

    /**
     * Get input from request body
     * - No key: returns all body data
     * - With key: returns specific value or default
     */
    public function input($key = null, $default = null)
    {
        if ($key === null) {
            return $this->body;
        }
        return $this->body[$key] ?? $default;
    }

    /** Get all input (query + body) */
    public function all(): array
    {
        return array_merge($this->query, $this->body);
    }

    /** Check if a key exists in query or body */
    public function has(string $key): bool
    {
        return isset($this->body[$key]) || isset($this->query[$key]);
    }

    /** Get uploaded file by key */
    public function file(string $key)
    {
        return $this->files[$key] ?? null;
    }

    /** Check if a file exists and was uploaded successfully */
    public function hasFile(string $key): bool
    {
        return isset($this->files[$key]) && $this->files[$key]['error'] === UPLOAD_ERR_OK;
    }

    /** Get cookie by key */
    public function cookie(string $key, $default = null)
    {
        return $this->cookies[$key] ?? $default;
    }

    /** Get HTTP header by key */
    public function header(string $key, $default = null)
    {
        $key = ucwords(strtolower($key), '-'); // Normalize key
        return $this->headers[$key] ?? $default;
    }

    /** Get bearer token from Authorization header */
    public function bearerToken(): ?string
    {
        $header = $this->header('Authorization');
        if ($header && preg_match('/Bearer\s+(.*)$/i', $header, $matches)) {
            return $matches[1];
        }
        return null;
    }

    /** Get client IP address */
    public function ip(): string
    {
        return $_SERVER['REMOTE_ADDR'];
    }

    /** Get user agent */
    public function userAgent(): string
    {
        return $_SERVER['HTTP_USER_AGENT'] ?? '';
    }

    /** Check if request content type is JSON */
    public function isJson(): bool
    {
        $contentType = $this->header('Content-Type', '');
        // Remove charset and other parameters
        $contentType = strtok($contentType, ';');
        $contentType = trim($contentType);
        return $contentType === 'application/json';
    }

    /** Check if request is AJAX */
    public function isAjax(): bool
    {
        return strtolower($this->header('X-Requested-With', '')) === 'xmlhttprequest';
    }

    /** Check if request method matches */
    public function isMethod(string $method): bool
    {
        return strtoupper($this->method) === strtoupper($method);
    }
    
    /** Get raw request body */
    public function raw(): string
    {
        return file_get_contents('php://input');
    }
    
    /** Debug: Get parsed body */
    public function getBody(): array
    {
        return $this->body;
    }
}
?>