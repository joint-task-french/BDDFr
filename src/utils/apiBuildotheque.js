/**
 * Service pour interagir avec l'API Buildotheque.
 */

class ApiBuildotheque {
  constructor() {
    this.baseUrl = localStorage.getItem('buildLibraryApiUrl_override') || null;
    this.token = localStorage.getItem('buildLibrary_token') || null;
    this.initialLoadPromise = null;
    this.cachedInitialData = null;
    this.userLikes = []; // IDs des builds likés par l'utilisateur

    try {
      const rawUser = localStorage.getItem('buildLibrary_user');
      // Protection contre les vieilles données corrompues dans le cache
      if (rawUser && rawUser !== 'undefined' && rawUser !== '[object Object]') {
        this.user = JSON.parse(rawUser);
      } else {
        this.user = null;
      }
    } catch (e) {
      console.warn("Données utilisateur invalides nettoyées.");
      this.user = null;
      localStorage.removeItem('buildLibrary_user');
    }

    // Si le token est présent mais l'utilisateur est vide, on force le décodage du JWT.
    if (this.token && !this.user) {
      this.decodeAndSetUser(this.token);
    }
  }

  decodeAndSetUser(token) {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return false;

      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4;
      if (pad) {
        base64 += new Array(5 - pad).join('=');
      }

      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const userData = JSON.parse(jsonPayload);

      this.user = {
        id: userData.sub,
        username: userData.username,
        avatar: userData.avatar
      };

      localStorage.setItem('buildLibrary_user', JSON.stringify(this.user));
      return true;
    } catch (e) {
      console.error("Erreur critique lors du décodage du JWT:", e);
      this.user = null;
      return false;
    }
  }

  setBaseUrl(url, metadataBaseUrl) {
    this.baseUrl = url || metadataBaseUrl;
  }

  getBaseUrl(metadataBaseUrl) {
    return this.baseUrl || metadataBaseUrl;
  }

  /**
   * Précharge les builds "top" et "recent" pour une navigation plus rapide.
   */
  async preloadInitialBuilds(metadataBaseUrl) {
    if (this.initialLoadPromise) return this.initialLoadPromise;

    const url = this.getBaseUrl(metadataBaseUrl);
    if (!url) return null;

    this.initialLoadPromise = (async () => {
      try {
        console.log("Preloading initial builds...");
        const [top, recent] = await Promise.all([
          this.fetchTopBuilds({ limit: 6 }, url),
          this.fetchRecentBuilds({ limit: 6 }, url)
        ]);

        let likes = [];
        if (this.isAuthenticated()) {
          likes = await this.fetchUserLikes(url);
          this.userLikes = likes;
        }

        this.cachedInitialData = { top, recent, likes };
        return this.cachedInitialData;
      } catch (e) {
        console.error("Preload Error:", e);
        this.initialLoadPromise = null;
        this.cachedInitialData = null;
        return null;
      }
    })();

    return this.initialLoadPromise;
  }

  async fetchBuilds(params = {}, metadataBaseUrl) {
    const url = this.getBaseUrl(metadataBaseUrl);
    const queryParams = new URLSearchParams();
    if (params.text) queryParams.append('text', params.text);
    if (params.tags) queryParams.append('tags', Array.isArray(params.tags) ? params.tags.join(',') : params.tags);
    if (params.auteurId) queryParams.append('auteurId', params.auteurId);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);
    if (params.random !== undefined) queryParams.append('random', params.random);

    const queryString = queryParams.toString();
    const fullUrl = `${url}/builds${queryString ? `?${queryString}` : ''}`;

    try {
      console.log(`Fetching builds from: ${fullUrl}`);
      const response = await fetch(fullUrl, {
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
      return data;
    } catch (e) {
      console.error("API Fetch Error:", e);
      return { builds: [], total: 0 };
    }
  }

  async fetchRecentBuilds(params = {}, metadataBaseUrl) {
    const url = this.getBaseUrl(metadataBaseUrl);
    const queryParams = new URLSearchParams();
    if (params.text) queryParams.append('text', params.text);
    if (params.tags) queryParams.append('tags', Array.isArray(params.tags) ? params.tags.join(',') : params.tags);
    if (params.auteurId) queryParams.append('auteurId', params.auteurId);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);

    const queryString = queryParams.toString();
    const fullUrl = `${url}/builds/recent${queryString ? `?${queryString}` : ''}`;

    try {
      console.log(`Fetching recent builds from: ${fullUrl}`);
      const response = await fetch(fullUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Erreur API Recent');
      return await response.json();
    } catch (e) {
      console.error("API Recent Error:", e);
      return { builds: [], total: 0 };
    }
  }

  async fetchTopBuilds(params = {}, metadataBaseUrl) {
    const url = this.getBaseUrl(metadataBaseUrl);
    const queryParams = new URLSearchParams();
    if (params.text) queryParams.append('text', params.text);
    if (params.tags) queryParams.append('tags', Array.isArray(params.tags) ? params.tags.join(',') : params.tags);
    if (params.auteurId) queryParams.append('auteurId', params.auteurId);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);

    const queryString = queryParams.toString();
    const fullUrl = `${url}/builds/top${queryString ? `?${queryString}` : ''}`;

    try {
      console.log(`Fetching top builds from: ${fullUrl}`);
      const response = await fetch(fullUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Erreur API Top');
      return await response.json();
    } catch (e) {
      console.error("API Top Error:", e);
      return { builds: [], total: 0 };
    }
  }

  async fetchBuildById(buildId, metadataBaseUrl) {
    const url = this.getBaseUrl(metadataBaseUrl);
    try {
      console.log(`Fetching build by id: ${url}/builds/${buildId}`);
      const response = await fetch(`${url}/builds/${buildId}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        throw new Error('Erreur lors de la récupération du build');
      }
      return await response.json();
    } catch (e) {
      console.error("API Fetch By ID Error:", e);
      return null;
    }
  }

  async loginDiscord(metadataBaseUrl) {
    const url = this.getBaseUrl(metadataBaseUrl);
    console.log(`Redirecting to Discord login at: ${url}/auth/discord`);
    window.location.href = `${url}/auth/discord`;
  }

  handleAuthCallback(token) {
    console.log("Handling auth callback...", { hasToken: !!token });
    if (token) {
      this.token = token;
      localStorage.setItem('buildLibrary_token', token);
      this.decodeAndSetUser(token);
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
      const data = await response.json();
      
      // Mise à jour locale du cache des likes
      if (data && data.isLiked !== undefined) {
        if (data.isLiked) {
          if (!this.userLikes.includes(buildId)) this.userLikes.push(buildId);
        } else {
          this.userLikes = this.userLikes.filter(id => id !== buildId);
        }
      }
      
      return data;
    } catch (e) {
      console.error("API Like Error:", e);
      return null;
    }
  }

  async fetchUserLikes(metadataBaseUrl) {
    if (!this.token) return [];
    const url = this.getBaseUrl(metadataBaseUrl);
    try {
      console.log(`Fetching user likes from: ${url}/likes`);
      const response = await fetch(`${url}/likes`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Erreur API Likes');
      const likes = await response.json(); // On suppose que c'est un tableau d'IDs
      this.userLikes = Array.isArray(likes) ? likes : [];
      return this.userLikes;
    } catch (e) {
      console.error("API User Likes Error:", e);
      return [];
    }
  }

  getUserLikes() {
    return this.userLikes;
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

  async updateBuild(buildId, buildData, metadataBaseUrl) {
    if (!this.token) return null;
    const url = this.getBaseUrl(metadataBaseUrl);
    try {
      const response = await fetch(`${url}/builds/${buildId}`, {
        method: 'PATCH',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(buildData)
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour du build');
      return await response.json();
    } catch (e) {
      console.error("API Update Error:", e);
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