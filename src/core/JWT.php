<?php

/**
 * JWT Handler for PHP
 * This class creates and verifies JWT tokens that work with both PHP and Node.js
 */
class JWT
{
    // Secret key - MUST match the one in Node.js .env file
    private static $secret = 'sakaybravo';

    // Token expiration time (30 minutes = 1800 seconds)
    private static $expiration = 1800;

    /**
     * Create a JWT token
     * 
     * @param array $payload User data to encode in token
     * @return string JWT token
     */
    public static function encode($payload)
    {
        // Add expiration time to payload
        $payload['iat'] = time(); // Issued at
        $payload['exp'] = time() + self::$expiration; // Expires at

        // Create header (describes token type and algorithm)
        $header = json_encode([
            'typ' => 'JWT',
            'alg' => 'HS256' // HMAC SHA256
        ]);

        // Encode payload
        $payload = json_encode($payload);

        // Base64 encode header and payload
        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode($payload);

        // Create signature
        $signature = hash_hmac(
            'sha256',
            $base64UrlHeader . "." . $base64UrlPayload,
            self::$secret,
            true
        );
        $base64UrlSignature = self::base64UrlEncode($signature);

        // Combine all parts with dots
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    /**
     * Verify and decode a JWT token
     * 
     * @param string $token JWT token to verify
     * @return array|false Decoded payload or false if invalid
     */
    public static function decode($token)
    {
        // Split token into parts
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            return false; // Invalid token format
        }

        list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;

        // Verify signature
        $signature = self::base64UrlDecode($base64UrlSignature);
        $expectedSignature = hash_hmac(
            'sha256',
            $base64UrlHeader . "." . $base64UrlPayload,
            self::$secret,
            true
        );

        if (!hash_equals($signature, $expectedSignature)) {
            return false; // Invalid signature
        }

        // Decode payload
        $payload = json_decode(self::base64UrlDecode($base64UrlPayload), true);

        // Check if token expired
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false; // Token expired
        }

        return $payload;
    }

    /**
     * Get token from HTTP request
     * Checks Authorization header and cookies
     * 
     * @return string|null Token or null if not found
     */
    public static function getTokenFromRequest()
    {
        // Check Authorization header first
        $headers = getallheaders();
        if (isset($headers['Authorization'])) {
            // Format: "Bearer token_here"
            $auth = $headers['Authorization'];
            if (preg_match('/Bearer\s+(.+)/', $auth, $matches)) {
                return $matches[1];
            }
        }

        // Check cookie as fallback
        if (isset($_COOKIE['auth_token'])) {
            return $_COOKIE['auth_token'];
        }

        return null;
    }

    /**
     * Set JWT token as cookie
     * FIXED: No script output - JavaScript handles localStorage
     * 
     * @param string $token JWT token
     */
    public static function setTokenCookie($token)
    {
        setcookie(
            'auth_token',
            $token,
            [
                'expires' => time() + self::$expiration,
                'path' => '/',      // Available on all paths
                'domain' => '',     // Current domain
                'secure' => false,  // Set true in production with HTTPS
                'httponly' => false, // Allow JavaScript access
                'samesite' => 'Lax' // CSRF protection
            ]
        );

        // DON'T output script here - it breaks JSON responses
        // Frontend JavaScript will handle localStorage
    }

    /**
     * Remove authentication cookie
     */
    public static function removeTokenCookie()
    {
        setcookie(
            'auth_token',
            '',
            time() - 3600, // Set expiration to past
            '/',
            '',
            false,
            false
        );
    }

    /**
     * Base64 URL encode (JWT standard)
     */
    private static function base64UrlEncode($data)
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL decode (JWT standard)
     */
    private static function base64UrlDecode($data)
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Create token from user data (helper method)
     * 
     * @param array $userData User information from database
     * @return string JWT token
     */
    public static function createTokenFromUser($userData)
    {
        $payload = [
            'user_id' => $userData['user_id'],
            'user_type' => $userData['user_type'],
            'email' => $userData['email'],
            'firstName' => $userData['firstName'] ?? '',
            'lastName' => $userData['lastName'] ?? ''
        ];

        return self::encode($payload);
    }

    /**
     * Verify token and return user data
     * 
     * @return array|false User data or false if invalid
     */
    public static function verifyRequest()
    {
        $token = self::getTokenFromRequest();

        if (!$token) {
            return false;
        }

        return self::decode($token);
    }
}
