import { Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Anime from "./pages/Anime.jsx";
import AnimeDetails from "./pages/AnimeDetails.jsx";
import BluRay from "./pages/BluRay.jsx";
import Chatbot from "./pages/Chatbot.jsx";
import Discover from "./pages/Discover.jsx";
import Home from "./pages/Home.jsx";
import Library from "./pages/Library.jsx";
import Login from "./pages/Login.jsx";
import MovieDetails from "./pages/MovieDetails.jsx";
import Movies from "./pages/Movies.jsx";
import Signup from "./pages/Signup.jsx";
import TVDetails from "./pages/TVDetails.jsx";
import TVShows from "./pages/TVShows.jsx";
import Upcoming from "./pages/Upcoming.jsx";

export default function App() {
  return (
    <div className="min-h-screen text-slate-100">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movies/:movieId" element={<MovieDetails />} />
          <Route path="/tv" element={<TVShows />} />
          <Route path="/tv/:seriesId" element={<TVDetails />} />
          <Route path="/anime" element={<Anime />} />
          <Route path="/anime/:animeId" element={<AnimeDetails />} />
          <Route path="/upcoming" element={<Upcoming />} />
          <Route path="/bluray" element={<Navigate to="/library/bluray" replace />} />
          <Route path="/chat" element={<Chatbot />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/library"
            element={
              <ProtectedRoute>
                <Library />
              </ProtectedRoute>
            }
          />
          <Route
            path="/library/bluray"
            element={
              <ProtectedRoute>
                <BluRay />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<Navigate to="/library" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
