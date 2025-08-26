/**
 * Security utilities for the AI Chat Interface
 * Includes iframe detection, security header validation, and security-related helpers
 */

/**
 * Check if the current window is embedded in an iframe
 */
export const isEmbeddedInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch (e) {
    // This error occurs when same-origin policy prevents access to window.top
    return true;
  }
};

/**
 * Get the referrer information safely
 */
export const getSafeReferrer = (): string => {
  try {
    return document.referrer || 'unknown';
  } catch (e) {
    return 'unknown';
  }
};

/**
 * Validate if a URL is safe for embedding
 */
export const isValidEmbedUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    const allowedProtocols = ['https:', 'http:'];
    const allowedHosts = [
      'localhost',
      '127.0.0.1',
      '[::1]' // IPv6 localhost
    ];
    
    // Allow local development and HTTPS in production
    return allowedProtocols.includes(parsedUrl.protocol) && 
           (process.env.NODE_ENV === 'development' || 
            parsedUrl.protocol === 'https:' ||
            allowedHosts.includes(parsedUrl.hostname));
  } catch (e) {
    return false;
  }
};

/**
 * Security header validation utilities
 */
export const SecurityHeaders = {
  /**
   * Validate CSP header format
   */
  validateCSP: (csp: string): boolean => {
    const requiredDirectives = ['default-src', 'script-src', 'style-src'];
    const directives = csp.split(';').map(d => d.trim().split(' ')[0]);
    return requiredDirectives.every(dir => directives.includes(dir));
  },

  /**
   * Generate a nonce for CSP
   */
  generateNonce: (): string => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
};

/**
 * Security event logging
 */
export const SecurityLogger = {
  logSecurityEvent: (event: string, details: Record<string, unknown> = {}): void => {
    console.log(`[Security] ${event}`, {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      embedded: isEmbeddedInIframe(),
      referrer: getSafeReferrer(),
      ...details
    });
  },

  logIframeAttempt: (): void => {
    if (isEmbeddedInIframe()) {
      SecurityLogger.logSecurityEvent('Iframe embedding detected', {
        parentUrl: getSafeReferrer()
      });
    }
  }
};

/**
 * Initialize security monitoring
 */
export const initSecurityMonitoring = (): void => {
  // Log iframe attempts on load
  SecurityLogger.logIframeAttempt();

  // Monitor for security-related events
  window.addEventListener('securitypolicyviolation', (event) => {
    SecurityLogger.logSecurityEvent('CSP Violation', {
      violatedDirective: event.violatedDirective,
      blockedURI: event.blockedURI,
      originalPolicy: event.originalPolicy
    });
  });

  // Monitor for potential XSS attempts
  window.addEventListener('error', (event) => {
    if (event.error && event.error.stack) {
      const stack = event.error.stack.toString();
      if (stack.includes('eval') || stack.includes('Function')) {
        SecurityLogger.logSecurityEvent('Potential XSS attempt detected', {
          error: event.error.message,
          filename: event.filename
        });
      }
    }
  });
};

// Export default security utilities
export default {
  isEmbeddedInIframe,
  getSafeReferrer,
  isValidEmbedUrl,
  SecurityHeaders,
  SecurityLogger,
  initSecurityMonitoring
};
