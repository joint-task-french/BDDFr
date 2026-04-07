
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
      const response = await fetch(`${url}/builds`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des builds');
      return await response.json();
    } catch (e) {
      console.error("API Error:", e);
      return [];
    }
  }

  async loginDiscord(metadataBaseUrl) {
    const url = this.getBaseUrl(metadataBaseUrl);
    // Redirection vers l'auth Discord de l'API
    window.location.href = `${url}/auth/discord`;
  }

  async logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('buildLibrary_token');
    localStorage.removeItem('buildLibrary_user');
  }

  async toggleLike(buildId, metadataBaseUrl) {
    if (!this.token) return null;
    const url = this.getBaseUrl(metadataBaseUrl);
    try {
      const response = await fetch(`${url}/builds/${buildId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      return await response.json();
    } catch (e) {
      console.error("API Error:", e);
      return null;
    }
  }

  async publishBuild(buildData, metadataBaseUrl) {
    if (!this.token) return null;
    const url = this.getBaseUrl(metadataBaseUrl);
    try {
      const response = await fetch(`${url}/builds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(buildData)
      });
      if (!response.ok) throw new Error('Erreur lors de la publication du build');
      return await response.json();
    } catch (e) {
      console.error("API Error:", e);
      return null;
    }
  }

  async deleteBuild(buildId, metadataBaseUrl) {
    if (!this.token) return null;
    const url = this.getBaseUrl(metadataBaseUrl);
    try {
      const response = await fetch(`${url}/builds/${buildId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression du build');
      return true;
    } catch (e) {
      console.error("API Error:", e);
      return false;
    }
  }

  isAuthenticated() {
    return !!this.token;
  }
}

export const apiBuildotheque = new ApiBuildotheque();
