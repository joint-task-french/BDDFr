
/**
 * Service pour interagir avec l'API Buildotheque.
 */

class ApiBuildotheque {
  constructor() {
    this.baseUrl = localStorage.getItem('buildLibraryApiUrl_override') || null;
    this.token = localStorage.getItem('buildLibrary_token') || null;
    this.user = JSON.parse(localStorage.getItem('buildLibrary_user') || 'null');
  }

  setBaseUrl(url, metadataBaseUrl) {
    this.baseUrl = url || metadataBaseUrl;
  }

  getBaseUrl(metadataBaseUrl) {
    return this.baseUrl || metadataBaseUrl;
  }

  async fetchBuilds(metadataBaseUrl) {
    const url = this.getBaseUrl(metadataBaseUrl);
    try {
      console.log(`Fetching builds from: ${url}/builds`);
      const response = await fetch(`${url}/builds`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        throw new Error('Erreur lors de la récupération des builds');
      }
      const data = await response.json();
      // L'API renvoie {"builds": [...], "total": 1, "limit": 50, "offset": 0}
      return data && data.builds ? data.builds : (Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("API Fetch Error:", e);
      return [];
    }
  }

  async hashId(id) {
    if (!id) return null;
    const msgUint8 = new TextEncoder().encode(id);
    const hashBuffer = await crypto.subtle.digest('SHA-512', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async loginDiscord(metadataBaseUrl) {
    const url = this.getBaseUrl(metadataBaseUrl);
    console.log(`Redirecting to Discord login at: ${url}/auth/discord`);
    // Redirection vers l'auth Discord de l'API
    window.location.href = `${url}/auth/discord`;
  }

  handleAuthCallback(token, user) {
    console.log("Handling auth callback...", { hasToken: !!token, hasUser: !!user });
    if (token) {
      this.token = token;
      localStorage.setItem('buildLibrary_token', token);
    }
    if (user) {
      try {
        const decodedUser = decodeURIComponent(user);
        const userData = typeof decodedUser === 'string' ? JSON.parse(decodedUser) : decodedUser;
        this.user = userData;
        localStorage.setItem('buildLibrary_user', JSON.stringify(userData));
        console.log("User data parsed and saved:", userData);
      } catch (e) {
        console.error("Erreur lors du parsing de l'utilisateur:", e, "Raw data:", user);
      }
    }
    console.log("Dispatching auth-change event...");
    window.dispatchEvent(new CustomEvent('auth-change', { detail: { user: this.user } }));
  }

  async logout() {
    console.log("Logging out...");
    this.token = null;
    this.user = null;
    localStorage.removeItem('buildLibrary_token');
    localStorage.removeItem('buildLibrary_user');
    window.dispatchEvent(new CustomEvent('auth-change', { detail: { user: null } }));
  }

  async toggleLike(buildId, metadataBaseUrl) {
    if (!this.token) return null;
    const url = this.getBaseUrl(metadataBaseUrl);
    try {
      const response = await fetch(`${url}/builds/${buildId}/like`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json',
        }
      });
      return await response.json();
    } catch (e) {
      console.error("API Like Error:", e);
      return null;
    }
  }

  async publishBuild(buildData, metadataBaseUrl) {
    if (!this.token) return null;
    const url = this.getBaseUrl(metadataBaseUrl);
    try {
      const response = await fetch(`${url}/builds`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(buildData)
      });
      if (!response.ok) throw new Error('Erreur lors de la publication du build');
      return await response.json();
    } catch (e) {
      console.error("API Publish Error:", e);
      return null;
    }
  }

  async deleteBuild(buildId, metadataBaseUrl) {
    if (!this.token) return null;
    const url = this.getBaseUrl(metadataBaseUrl);
    try {
      const response = await fetch(`${url}/builds/${buildId}`, {
        method: 'DELETE',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression du build');
      return true;
    } catch (e) {
      console.error("API Delete Error:", e);
      return false;
    }
  }

  isAuthenticated() {
    return !!this.token;
  }
}

export const apiBuildotheque = new ApiBuildotheque();
