import rateLimit from 'express-rate-limit';

// Basic rate limiting configuration
const limiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 15 minutes window
  max: 10, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP address',
    retryAfter: '1 minute',
    // documentation: 'https://api.example.com/docs/rate-limits'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests from this IP, please try again later',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000 - Date.now() / 1000) + ' seconds',
    });
  }
});

export default limiter;