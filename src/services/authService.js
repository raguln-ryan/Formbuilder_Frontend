class AuthService {
  constructor() {
    this.setupTokenRefresh();
  }

  // Auto-refresh token before expiration
  setupTokenRefresh() {
    setInterval(() => {
      const token = localStorage.getItem('token');
      const tokenExpiry = localStorage.getItem('tokenExpiry');
      
      if (token && tokenExpiry) {
        const now = new Date().getTime();
        const expiry = new Date(tokenExpiry).getTime();
        const timeUntilExpiry = expiry - now;
        
        // Refresh if less than 5 minutes remaining
        if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
          this.refreshToken();
        }
      }
    }, 60000); // Check every minute
  }

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.accessToken, data.refreshToken);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  }

  setTokens(accessToken, refreshToken) {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    // Store expiry time (1 hour from now)
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 1);
    localStorage.setItem('tokenExpiry', expiryTime.toISOString());
  }
}

export default new AuthService();