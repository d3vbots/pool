/** API base URL. In dev we use /api (Vite proxy). In production set VITE_API_URL to your API origin (e.g. https://pool-8w66.onrender.com); /api is appended. */
const rawBase = import.meta.env.VITE_API_URL as string | undefined;
const API_BASE = rawBase ? `${rawBase.replace(/\/$/, '')}/api` : '/api';
const AUTH_STORAGE_KEY = 'league-auth';

let token: string | null = null;

export function setAuthToken(t: string | null) {
  token = t;
}

function getToken(): string | null {
  if (token) return token;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { token?: string } };
    const stored = parsed?.state?.token;
    if (stored) {
      token = stored;
      return stored;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const authToken = getToken();
  if (authToken) (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    setAuthToken(null);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('auth:logout'));
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const leagues = {
  list: (opts?: { public?: boolean; q?: string }) => {
    const params = new URLSearchParams();
    if (opts?.public) params.set('public', 'true');
    if (opts?.q?.trim()) params.set('q', opts.q.trim());
    const query = params.toString();
    return api<LeagueResponse[]>(`/leagues${query ? `?${query}` : ''}`);
  },
  get: (id: number, opts?: { public?: boolean }) =>
    api<LeagueResponse>(`/leagues/${id}${opts?.public ? '?public=true' : ''}`),
  create: (body: CreateLeagueRequest) => api<LeagueResponse>('/leagues', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: UpdateLeagueRequest) => api<LeagueResponse>(`/leagues/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  setStatus: (id: number, status: string) => api<void>(`/leagues/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  generateFixtures: (id: number) => api<void>(`/leagues/${id}/generate-fixtures`, { method: 'POST' }),
  regenerateFixtures: (id: number) => api<void>(`/leagues/${id}/regenerate-fixtures`, { method: 'POST' }),
  delete: (id: number) => api<void>(`/leagues/${id}`, { method: 'DELETE' }),
  setHidden: (id: number, isHidden: boolean) =>
    api<void>(`/leagues/${id}/hidden`, { method: 'PUT', body: JSON.stringify({ isHidden }) }),
  restore: (id: number) => api<void>(`/leagues/${id}/restore`, { method: 'POST' }),
};

export const players = {
  list: (opts?: { q?: string }) => {
    const params = new URLSearchParams();
    if (opts?.q?.trim()) params.set('q', opts.q.trim());
    const query = params.toString();
    return api<PlayerResponse[]>(`/players${query ? `?${query}` : ''}`);
  },
  get: (id: number) => api<PlayerResponse>(`/players/${id}`),
  getLeagues: (id: number) => api<PlayerLeagueEntryResponse[]>(`/players/${id}/leagues`),
  getMatches: (id: number, leagueId?: number) =>
    api<MatchResponse[]>(`/players/${id}/matches${leagueId != null ? `?leagueId=${leagueId}` : ''}`),
  create: (body: CreatePlayerRequest) => api<PlayerResponse>('/players', { method: 'POST', body: JSON.stringify(body) }),
  remove: (playerId: number) => api<void>(`/players/${playerId}`, { method: 'DELETE' }),
  listByLeague: (leagueId: number) => api<LeaguePlayerResponse[]>(`/players/leagues/${leagueId}`),
  addToLeague: (leagueId: number, playerId: number) => api<void>(`/players/leagues/${leagueId}`, { method: 'POST', body: JSON.stringify({ playerId }) }),
  removeFromLeague: (leagueId: number, playerId: number) => api<void>(`/players/leagues/${leagueId}/${playerId}`, { method: 'DELETE' }),
  updatePaymentStatus: (leagueId: number, playerId: number, paymentStatus: string) =>
    api<void>(`/players/leagues/${leagueId}/${playerId}/payment`, { method: 'PUT', body: JSON.stringify({ paymentStatus }) }),
};

export const matches = {
  listByLeague: (leagueId: number) => api<MatchResponse[]>(`/matches/leagues/${leagueId}`),
  setResult: (matchId: number, playerAScore: number, playerBScore: number) =>
    api<void>(`/matches/${matchId}/result`, { method: 'PUT', body: JSON.stringify({ playerAScore, playerBScore }) }),
  deleteResult: (matchId: number) => api<void>(`/matches/${matchId}/result`, { method: 'DELETE' }),
  /** Both players forfeit (no-show): each gets a loss, loss points, and games lost = league best-of. */
  abandon: (matchId: number) => api<void>(`/matches/${matchId}/abandon`, { method: 'PUT' }),
};

export const leaderboard = {
  get: (leagueId: number) => api<LeaderboardEntryResponse[]>(`/leaderboard/leagues/${leagueId}`),
};

export const auth = {
  login: (username: string, password: string) =>
    api<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
};

// Types (mirror backend DTOs)
export interface LeagueResponse {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  minPlayers: number;
  maxPlayers: number;
  registrationFee: number;
  matchFormatBestOf: number;
  isDoubleRoundRobin: boolean;
  winPoints: number;
  drawPoints: number;
  lossPoints: number;
  status: string;
  fixturesGenerated: boolean;
  playerCount: number;
  isDeleted?: boolean;
  isHidden?: boolean;
}

export interface CreateLeagueRequest {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  minPlayers: number;
  maxPlayers: number;
  registrationFee: number;
  matchFormatBestOf?: number;
  isDoubleRoundRobin?: boolean;
  winPoints?: number;
  drawPoints?: number;
  lossPoints?: number;
}

export type UpdateLeagueRequest = CreateLeagueRequest;

export interface PlayerResponse {
  id: number;
  name: string;
  phoneNumber: string;
  profileImageUrl?: string;
  isActive: boolean;
}

export interface CreatePlayerRequest {
  name: string;
  phoneNumber: string;
  profileImageUrl?: string;
}

export interface PlayerLeagueEntryResponse {
  leagueId: number;
  leagueName: string;
  leagueStatus: string;
  paymentStatus: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gamesWon: number;
  gamesLost: number;
  goalDifference: number;
  points: number;
}

export interface LeaguePlayerResponse {
  leagueId: number;
  playerId: number;
  playerName: string;
  paymentStatus: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gamesWon: number;
  gamesLost: number;
  goalDifference: number;
  points: number;
}

export interface MatchResponse {
  id: number;
  leagueId: number;
  leagueName?: string | null;
  playerAId: number;
  playerAName: string;
  playerBId: number;
  playerBName: string;
  leg: number;
  /** 1-based week in league span; fixtures are spread across weeks. */
  weekNumber?: number | null;
  status: string;
  playerAScore?: number;
  playerBScore?: number;
  /** When status is Abandoned: games lost per player (league match format). */
  abandonedForfeitGames?: number | null;
}

export interface LeaderboardEntryResponse {
  rank: number;
  playerId: number;
  playerName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gamesWon: number;
  gamesLost: number;
  goalDifference: number;
  points: number;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
}
