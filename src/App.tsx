import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { useAuth } from "./lib/auth";
import { ArtistPage } from "./pages/ArtistPage";
import { AuthPage } from "./pages/AuthPage";
import { Chat } from "./pages/Chat";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Chat />
          </RequireAuth>
        }
      />
      <Route
        path="/chat/:threadId"
        element={
          <RequireAuth>
            <Chat />
          </RequireAuth>
        }
      />
      <Route path="/artists/:artistId" element={<ArtistPage />} />
    </Routes>
  );
}

export default App;
