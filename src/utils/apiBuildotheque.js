/**
 * Service pour interagir avec l'API Buildotheque.
 *
 * Gestion des erreurs : chaque `catch` renvoyait `null` ou `[]`, ce qui rendait
 * une panne reseau indistinguable d'un resultat legitimement vide — l'UI
 * affichait « aucun build » aussi bien quand l'API etait tombee que quand la
 * recherche ne donnait rien. Desormais :
 *   - les listes renvoient `{ builds, total, error }` (champ `error` additif :
 *     les appelants existants continuent de lire `.builds` et `.total`) ;
 *   - `lastError` retient la derniere erreur ;
 *   - un evenement `api-error` est emis, pour qu'une banniere s'affiche sans
 *     que chaque appelant ait a gerer le cas.
 */

const TOKEN_KEY = 'buildLibrary_token';
const USER_KEY = 'buildLibrary_user';
const API_URL_OVERRIDE_KEY = 'buildLibraryApiUrl_override';

export const API_ERROR_EVENT = 'api-error';

/** Lecture de localStorage tolerante (navigation privee, quota, stockage bloque). */
function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* stockage indisponible */
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* stockage indisponible */
  }
}

class ApiBuildotheque {
  constructor() {
    this.baseUrl = readStorage(API_URL_OVERRIDE_KEY) || null;
    this.token = readStorage(TOKEN_KEY) || null;
    this.initialLoadPromise = null;
    this.cachedInitialData = null;
    this.userLikes = []; // IDs des builds likés par l'utilisateur
    this.tokenExpiry = null;
    this.lastError = null;

    try {
      const rawUser = readStorage(USER_KEY);
      // Protection contre les vieilles données corrompues dans le cache
      if (rawUser && rawUser !== 'undefined' && rawUser !== '[object Object]') {
        this.user = JSON.parse(rawUser);
      } else {
        this.user = null;
      }
    } catch (e) {
      console.warn('Données utilisateur invalides nettoyées.');
      this.user = null;
      removeStorage(USER_KEY);
    }

    // Le JWT est toujours redecode : le cache localStorage ne contient pas
    // l'expiration, indispensable pour ne pas afficher une session perimee.
    if (this.token) {
      this.decodeAndSetUser(this.token);
      if (this.isTokenExpired()) {
        this.clearSession();
      }
    }
  }

  // --- Session ------------------------------------------------------------

  decodeAndSetUser(token) {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return false;

      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4;
      if (pad) {
        base64 += new Array(5 - pad).join('=');
      }

      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const userData = JSON.parse(jsonPayload);

      this.user = {
        id: userData.sub,
        username: userData.username,
        avatar: userData.avatar,
      };
      // `exp` est exprime en secondes depuis l'epoch (RFC 7519).
      this.tokenExpiry = Number.isFinite(userData.exp) ? userData.exp * 1000 : null;

      writeStorage(USER_KEY, JSON.stringify(this.user));
      return true;
    } catch (e) {
      console.error('Erreur critique lors du décodage du JWT:', e);
      this.user = null;
      return false;
    }
  }

  isTokenExpired() {
    return this.tokenExpiry !== null && Date.now() >= this.tokenExpiry;
  }

  /** Purge la session locale, sans emettre d'evenement. */
  clearSession() {
    this.token = null;
    this.user = null;
    this.tokenExpiry = null;
    this.userLikes = [];
    removeStorage(TOKEN_KEY);
    removeStorage(USER_KEY);
  }

  /**
   * La seule presence d'un token ne suffit pas : sans controle de `exp`, l'UI
   * affichait « connecte » avec un JWT perime et chaque action echouait en
   * silence.
   */
  isAuthenticated() {
    if (!this.token) return false;
    if (this.isTokenExpired()) {
      this.clearSession();
      return false;
    }
    return true;
  }

  loginDiscord(metadataBaseUrl) {
    const url = this.getBaseUrl(metadataBaseUrl);
    if (!url) {
      this.reportFailure('Connexion Discord : aucune URL d API configurée.');
      return;
    }
    window.location.href = `${url}/auth/discord`;
  }

  handleAuthCallback(token) {
    if (token) {
      this.token = token;
      writeStorage(TOKEN_KEY, token);
      this.decodeAndSetUser(token);
    }
    window.dispatchEvent(new CustomEvent('auth-change', { detail: { user: this.user } }));
  }

  async logout() {
    this.clearSession();
    window.dispatchEvent(new CustomEvent('auth-change', { detail: { user: null } }));
  }

  // --- URL de base --------------------------------------------------------

  setBaseUrl(url, metadataBaseUrl) {
    this.baseUrl = url || metadataBaseUrl;
  }

  getBaseUrl(metadataBaseUrl) {
    return this.baseUrl || metadataBaseUrl;
  }

  // --- Socle de requete ---------------------------------------------------

  /** Enregistre l'erreur et previent l'UI. Renvoie toujours le message. */
  reportFailure(message) {
    this.lastError = { message, at: Date.now() };
    console.error('[Buildothèque]', message);
    try {
      window.dispatchEvent(new CustomEvent(API_ERROR_EVENT, { detail: { message } }));
    } catch {
      /* environnement sans DOM */
    }
    return message;
  }

  getLastError() {
    return this.lastError;
  }

  clearLastError() {
    this.lastError = null;
  }

  /**
   * Requete unique partagee par tous les points d'entree.
   * Renvoie `{ data, error }` : jamais d'exception, et jamais d'ambiguite
   * entre « vide » et « en panne ».
   */
  async request(path, { baseUrl, method = 'GET', body, auth = false, label } = {}) {
    if (!baseUrl) {
      return { data: null, error: this.reportFailure(`${label} : aucune URL d API configurée.`) };
    }
    if (auth && !this.isAuthenticated()) {
      return { data: null, error: this.reportFailure(`${label} : session expirée ou absente.`) };
    }

    const headers = { Accept: 'application/json' };
    if (auth) headers.Authorization = `Bearer ${this.token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        mode: 'cors',
        headers,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });

      if (response.status === 401 || response.status === 403) {
        // Le serveur a rejete le token : la session locale est perimee.
        this.clearSession();
        return { data: null, error: this.reportFailure(`${label} : session refusée par le serveur.`) };
      }
      if (!response.ok) {
        return { data: null, error: this.reportFailure(`${label} : erreur serveur (HTTP ${response.status}).`) };
      }
      // Une suppression réussie peut ne rien renvoyer.
      if (response.status === 204) {
        return { data: true, error: null };
      }

      return { data: await response.json(), error: null };
    } catch (e) {
      // TypeError = reseau injoignable ou CORS ; le reste = reponse illisible.
      const cause = e instanceof TypeError ? 'service injoignable' : e.message;
      return { data: null, error: this.reportFailure(`${label} : ${cause}.`) };
    }
  }

  /** Construit la query string commune aux endpoints de liste. */
  buildListQuery(params = {}) {
    const q = new URLSearchParams();
    if (params.text) q.append('text', params.text);
    if (params.tags) q.append('tags', Array.isArray(params.tags) ? params.tags.join(',') : params.tags);
    if (params.auteurId) q.append('auteurId', params.auteurId);
    if (params.limit) q.append('limit', params.limit);
    if (params.offset) q.append('offset', params.offset);
    if (params.random !== undefined) q.append('random', params.random);
    const s = q.toString();
    return s ? `?${s}` : '';
  }

  /**
   * Les trois listes ne differaient que par leur chemin : meme construction de
   * query, meme gestion d'erreur, meme forme de retour.
   */
  async fetchList(path, params, metadataBaseUrl, label) {
    const { data, error } = await this.request(path + this.buildListQuery(params), {
      baseUrl: this.getBaseUrl(metadataBaseUrl),
      label,
    });

    // Forme retro-compatible : `.builds` et `.total` restent lisibles tels
    // quels ; `.error` distingue la panne du resultat vide.
    if (error) return { builds: [], total: 0, error };
    return { builds: data?.builds ?? [], total: data?.total ?? 0, error: null };
  }

  // --- Lectures -----------------------------------------------------------

  async fetchBuilds(params = {}, metadataBaseUrl) {
    return this.fetchList('/builds', params, metadataBaseUrl, 'Recherche de builds');
  }

  async fetchRecentBuilds(params = {}, metadataBaseUrl) {
    return this.fetchList('/builds/recent', params, metadataBaseUrl, 'Builds récents');
  }

  async fetchTopBuilds(params = {}, metadataBaseUrl) {
    return this.fetchList('/builds/top', params, metadataBaseUrl, 'Builds populaires');
  }

  async fetchBuildById(buildId, metadataBaseUrl) {
    const { data } = await this.request(`/builds/${buildId}`, {
      baseUrl: this.getBaseUrl(metadataBaseUrl),
      label: 'Chargement du build',
    });
    return data;
  }

  async fetchUserLikes(metadataBaseUrl) {
    if (!this.isAuthenticated()) return [];
    const { data } = await this.request('/likes', {
      baseUrl: this.getBaseUrl(metadataBaseUrl),
      auth: true,
      label: 'Récupération des favoris',
    });
    this.userLikes = Array.isArray(data) ? data : [];
    return this.userLikes;
  }

  getUserLikes() {
    return this.userLikes;
  }

  /** Précharge les builds "top" et "recent" pour une navigation plus rapide. */
  async preloadInitialBuilds(metadataBaseUrl) {
    if (this.initialLoadPromise) return this.initialLoadPromise;

    const url = this.getBaseUrl(metadataBaseUrl);
    if (!url) return null;

    this.initialLoadPromise = (async () => {
      const [top, recent] = await Promise.all([
        this.fetchTopBuilds({ limit: 6 }, url),
        this.fetchRecentBuilds({ limit: 6 }, url),
      ]);

      // Un prechargement en echec ne doit pas etre mis en cache : sinon la page
      // Buildothèque afficherait durablement un resultat vide apres une panne
      // passagere.
      if (top.error || recent.error) {
        this.initialLoadPromise = null;
        this.cachedInitialData = null;
        return null;
      }

      let likes = [];
      if (this.isAuthenticated()) {
        likes = await this.fetchUserLikes(url);
        this.userLikes = likes;
      }

      this.cachedInitialData = { top, recent, likes };
      return this.cachedInitialData;
    })();

    return this.initialLoadPromise;
  }

  // --- Ecritures ----------------------------------------------------------

  async toggleLike(buildId, metadataBaseUrl) {
    const { data } = await this.request(`/builds/${buildId}/like`, {
      baseUrl: this.getBaseUrl(metadataBaseUrl),
      method: 'POST',
      auth: true,
      label: 'Mise à jour du favori',
    });

    // Mise à jour locale du cache des likes
    if (data && data.isLiked !== undefined) {
      if (data.isLiked) {
        if (!this.userLikes.includes(buildId)) this.userLikes.push(buildId);
      } else {
        this.userLikes = this.userLikes.filter(id => id !== buildId);
      }
    }
    return data;
  }

  async publishBuild(buildData, metadataBaseUrl) {
    const { data } = await this.request('/builds', {
      baseUrl: this.getBaseUrl(metadataBaseUrl),
      method: 'POST',
      body: buildData,
      auth: true,
      label: 'Publication du build',
    });
    return data;
  }

  async updateBuild(buildId, buildData, metadataBaseUrl) {
    const { data } = await this.request(`/builds/${buildId}`, {
      baseUrl: this.getBaseUrl(metadataBaseUrl),
      method: 'PATCH',
      body: buildData,
      auth: true,
      label: 'Mise à jour du build',
    });
    return data;
  }

  async deleteBuild(buildId, metadataBaseUrl) {
    const { error } = await this.request(`/builds/${buildId}`, {
      baseUrl: this.getBaseUrl(metadataBaseUrl),
      method: 'DELETE',
      auth: true,
      label: 'Suppression du build',
    });
    return !error;
  }
}

export const apiBuildotheque = new ApiBuildotheque();
