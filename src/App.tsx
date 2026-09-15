import { Route, Routes } from "react-router-dom";
import "./App.css";
import { ArtistPage } from "./pages/ArtistPage";
import { Home } from "./pages/Home";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/artists/:artistId" element={<ArtistPage />} />
    </Routes>
  );
}

export default App;
