import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LeaguesPage } from './pages/LeaguesPage';
import { LeagueFormPage } from './pages/LeagueFormPage';
import { LeagueDetailPage } from './pages/LeagueDetailPage';
import { LeagueOverview } from './pages/LeagueOverview';
import { LeaguePlayersPage } from './pages/LeaguePlayersPage';
import { LeagueFixturesPage } from './pages/LeagueFixturesPage';
import { LeagueResultsPage } from './pages/LeagueResultsPage';
import { LeagueLeaderboardPage } from './pages/LeagueLeaderboardPage';
import { PlayersPage } from './pages/PlayersPage';
import { PlayerDetailPage } from './pages/PlayerDetailPage';
import { StandingsPage } from './pages/StandingsPage';
import type { LeagueResponse } from './api/client';

type LeagueDetailContext = { league: LeagueResponse; setLeague: (l: LeagueResponse) => void };

function LeagueOverviewRoute() {
  const { league } = useOutletContext<LeagueDetailContext>();
  return <LeagueOverview league={league} />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="standings" element={<StandingsPage />} />
          <Route path="standings/:leagueId" element={<StandingsPage />} />
          <Route path="player/:id" element={<PlayerDetailPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="leagues"
            element={
              <ProtectedRoute>
                <LeaguesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="leagues/new"
            element={
              <ProtectedRoute>
                <LeagueFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="leagues/:id"
            element={
              <ProtectedRoute>
                <LeagueDetailPage />
              </ProtectedRoute>
            }
          >
            <Route index element={<LeagueOverviewRoute />} />
            <Route path="players" element={<LeaguePlayersPage />} />
            <Route path="fixtures" element={<LeagueFixturesPage />} />
            <Route path="results" element={<LeagueResultsPage />} />
            <Route path="leaderboard" element={<LeagueLeaderboardPage />} />
          </Route>
          <Route
            path="players"
            element={
              <ProtectedRoute>
                <PlayersPage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
