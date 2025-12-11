<?php
class Response {
    private $statusCode = 200;
    private $headers = [];
    private $body = '';
    private $sent = false;
    
    public function __construct() {
        $this->header('Content-Type', 'text/html; charset=UTF-8');
    }
    
    // Set HTTP status code
    public function status($code) {
        $this->statusCode = $code;
        return $this;
    }
    
    // Set response header
    public function header($key, $value) {
        $this->headers[$key] = $value;
        return $this;
    }
    
    // Send JSON response
    public function json($data, $statusCode = 200) {
        $this->statusCode = $statusCode;
        $this->header('Content-Type', 'application/json');
        $this->body = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return $this;
    }
    
    // Send HTML response
    public function html($content, $statusCode = 200) {
        $this->statusCode = $statusCode;
        $this->header('Content-Type', 'text/html; charset=UTF-8');
        $this->body = $content;
        return $this;
    }
    
    // Send plain text response
    public function text($content, $statusCode = 200) {
        $this->statusCode = $statusCode;
        $this->header('Content-Type', 'text/plain; charset=UTF-8');
        $this->body = $content;
        return $this;
    }
    
    // Redirect to another URL
    public function redirect($url, $statusCode = 302) {
        $this->statusCode = $statusCode;
        $this->header('Location', $url);
        return $this;
    }
    
    // Render a view file
    public function view($path, $data = []) {
        extract($data);
        ob_start();
        include $path;
        $this->body = ob_get_clean();
        return $this;
    }
    
    // Success JSON response
    public function success($data = null, $message = 'Success', $statusCode = 200) {
        return $this->json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $statusCode);
    }
    
    // Error JSON response
    public function error($message = 'Error', $errors = null, $statusCode = 400) {
        return $this->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors
        ], $statusCode);
    }
    
    // 404 Not Found response
    public function notFound($message = 'Resource not found') {
        return $this->error($message, null, 404);
    }
    
    // 401 Unauthorized response
    public function unauthorized($message = 'Unauthorized') {
        return $this->error($message, null, 401);
    }
    
    // 403 Forbidden response
    public function forbidden($message = 'Forbidden') {
        return $this->error($message, null, 403);
    }
    
    // 500 Server Error response
    public function serverError($message = 'Internal server error') {
        return $this->error($message, null, 500);
    }
    
    // 422 Validation Error response
    public function validationError($errors, $message = 'Validation failed') {
        return $this->error($message, $errors, 422);
    }
    
    // Set cookie
    public function cookie($name, $value, $options = []) {
        $expires = $options['expires'] ?? 0;
        $path = $options['path'] ?? '/';
        $domain = $options['domain'] ?? '';
        $secure = $options['secure'] ?? false;
        $httponly = $options['httponly'] ?? true;
        $samesite = $options['samesite'] ?? 'Lax';
        
        setcookie($name, $value, [
            'expires' => $expires,
            'path' => $path,
            'domain' => $domain,
            'secure' => $secure,
            'httponly' => $httponly,
            'samesite' => $samesite
        ]);
        
        return $this;
    }
    
    // Delete cookie
    public function deleteCookie($name, $path = '/') {
        setcookie($name, '', [
            'expires' => time() - 3600,
            'path' => $path
        ]);
        return $this;
    }
    
    // Download file
    public function download($filePath, $fileName = null) {
        if (!file_exists($filePath)) {
            return $this->notFound('File not found');
        }
        
        $fileName = $fileName ?? basename($filePath);
        $mimeType = mime_content_type($filePath);
        
        $this->header('Content-Type', $mimeType);
        $this->header('Content-Disposition', 'attachment; filename="' . $fileName . '"');
        $this->header('Content-Length', (string)filesize($filePath));
        $this->body = file_get_contents($filePath);
        
        return $this;
    }
    
    // Send the response
    public function send() {
        if ($this->sent) {
            return;
        }
        
        // Set status code
        http_response_code($this->statusCode);
        
        // Send headers
        foreach ($this->headers as $key => $value) {
            header("$key: $value");
        }
        
        // Send body
        echo $this->body;
        
        $this->sent = true;
    }
}
?>