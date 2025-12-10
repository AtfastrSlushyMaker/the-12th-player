import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import MatchPredictor from './pages/MatchPredictor';
import SeasonRankings from './pages/SeasonRankings';
import TeamStyles from './pages/TeamStyles';
import PlayerScout from './pages/PlayerScout';
import NewsClassifier from './pages/NewsClassifier';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/match-predictor" element={<MatchPredictor />} />
            <Route path="/season-rankings" element={<SeasonRankings />} />
            <Route path="/team-styles" element={<TeamStyles />} />
            <Route path="/player-scout" element={<PlayerScout />} />
            <Route path="/news-classifier" element={<NewsClassifier />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;

