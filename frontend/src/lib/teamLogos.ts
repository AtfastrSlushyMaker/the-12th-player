// Premier League team logos from public sources
// Using logo URLs from reliable CDN sources

// League logos
export const leagueLogos: Record<string, string> = {
  'Premier League': 'https://resources.premierleague.com/premierleague/competitions/competition_1_small.png',
  'La Liga': 'https://assets.laliga.com/assets/logos/laliga-v/laliga-v-300x300.png',
  'Bundesliga': 'https://www.bundesliga.com/assets/favicons/apple-touch-icon-180x180.png',
  'Serie A': 'https://img.legaseriea.it/vimages/6319ea33/logo-lega-serie-a.png',
  'Ligue 1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Ligue1.svg/200px-Ligue1.svg.png',
};

export function getLeagueLogo(league: string): string {
  if (!league) return '';
  for (const [key, value] of Object.entries(leagueLogos)) {
    if (league.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(league.toLowerCase())) {
      return value;
    }
  }
  return '';
}

export const teamLogos: Record<string, string> = {
  // Current Premier League teams
  'Arsenal': 'https://resources.premierleague.com/premierleague/badges/50/t3.png',
  'Aston Villa': 'https://resources.premierleague.com/premierleague/badges/50/t7.png',
  'Bournemouth': 'https://resources.premierleague.com/premierleague/badges/50/t91.png',
  'Brentford': 'https://resources.premierleague.com/premierleague/badges/50/t94.png',
  'Brighton': 'https://resources.premierleague.com/premierleague/badges/50/t36.png',
  'Brighton & Hove Albion': 'https://resources.premierleague.com/premierleague/badges/50/t36.png',
  'Chelsea': 'https://resources.premierleague.com/premierleague/badges/50/t8.png',
  'Crystal Palace': 'https://resources.premierleague.com/premierleague/badges/50/t31.png',
  'Everton': 'https://resources.premierleague.com/premierleague/badges/50/t11.png',
  'Fulham': 'https://resources.premierleague.com/premierleague/badges/50/t54.png',
  'Ipswich': 'https://resources.premierleague.com/premierleague/badges/50/t40.png',
  'Ipswich Town': 'https://resources.premierleague.com/premierleague/badges/50/t40.png',
  'Leicester': 'https://resources.premierleague.com/premierleague/badges/50/t13.png',
  'Leicester City': 'https://resources.premierleague.com/premierleague/badges/50/t13.png',
  'Liverpool': 'https://resources.premierleague.com/premierleague/badges/50/t14.png',
  'Man City': 'https://resources.premierleague.com/premierleague/badges/50/t43.png',
  'Manchester City': 'https://resources.premierleague.com/premierleague/badges/50/t43.png',
  'Man United': 'https://resources.premierleague.com/premierleague/badges/50/t1.png',
  'Manchester United': 'https://resources.premierleague.com/premierleague/badges/50/t1.png',
  'Newcastle': 'https://resources.premierleague.com/premierleague/badges/50/t4.png',
  'Newcastle United': 'https://resources.premierleague.com/premierleague/badges/50/t4.png',
  'Nottingham Forest': 'https://resources.premierleague.com/premierleague/badges/50/t17.png',
  "Nott'm Forest": 'https://resources.premierleague.com/premierleague/badges/50/t17.png',
  'Southampton': 'https://resources.premierleague.com/premierleague/badges/50/t20.png',
  'Tottenham': 'https://resources.premierleague.com/premierleague/badges/50/t6.png',
  'Tottenham Hotspur': 'https://resources.premierleague.com/premierleague/badges/50/t6.png',
  'Spurs': 'https://resources.premierleague.com/premierleague/badges/50/t6.png',
  'West Ham': 'https://resources.premierleague.com/premierleague/badges/50/t21.png',
  'West Ham United': 'https://resources.premierleague.com/premierleague/badges/50/t21.png',
  'Wolves': 'https://resources.premierleague.com/premierleague/badges/50/t39.png',
  'Wolverhampton': 'https://resources.premierleague.com/premierleague/badges/50/t39.png',
  'Wolverhampton Wanderers': 'https://resources.premierleague.com/premierleague/badges/50/t39.png',
  
  // Historic/Relegated teams
  'Burnley': 'https://resources.premierleague.com/premierleague/badges/50/t90.png',
  'Leeds': 'https://resources.premierleague.com/premierleague/badges/50/t2.png',
  'Leeds United': 'https://resources.premierleague.com/premierleague/badges/50/t2.png',
  'Luton': 'https://resources.premierleague.com/premierleague/badges/50/t102.png',
  'Luton Town': 'https://resources.premierleague.com/premierleague/badges/50/t102.png',
  'Sheffield United': 'https://resources.premierleague.com/premierleague/badges/50/t49.png',
  'Sheffield Utd': 'https://resources.premierleague.com/premierleague/badges/50/t49.png',
  'Watford': 'https://resources.premierleague.com/premierleague/badges/50/t57.png',
  'Norwich': 'https://resources.premierleague.com/premierleague/badges/50/t45.png',
  'Norwich City': 'https://resources.premierleague.com/premierleague/badges/50/t45.png',
  'West Brom': 'https://resources.premierleague.com/premierleague/badges/50/t35.png',
  'West Bromwich Albion': 'https://resources.premierleague.com/premierleague/badges/50/t35.png',
  'West Bromwich': 'https://resources.premierleague.com/premierleague/badges/50/t35.png',
  'Stoke': 'https://resources.premierleague.com/premierleague/badges/50/t110.png',
  'Stoke City': 'https://resources.premierleague.com/premierleague/badges/50/t110.png',
  'Swansea': 'https://resources.premierleague.com/premierleague/badges/50/t80.png',
  'Swansea City': 'https://resources.premierleague.com/premierleague/badges/50/t80.png',
  'Sunderland': 'https://resources.premierleague.com/premierleague/badges/50/t56.png',
  'Hull': 'https://resources.premierleague.com/premierleague/badges/50/t88.png',
  'Hull City': 'https://resources.premierleague.com/premierleague/badges/50/t88.png',
  'Middlesbrough': 'https://resources.premierleague.com/premierleague/badges/50/t25.png',
  'QPR': 'https://resources.premierleague.com/premierleague/badges/50/t97.png',
  'Queens Park Rangers': 'https://resources.premierleague.com/premierleague/badges/50/t97.png',
  'Reading': 'https://resources.premierleague.com/premierleague/badges/50/t68.png',
  'Wigan': 'https://resources.premierleague.com/premierleague/badges/50/t44.png',
  'Wigan Athletic': 'https://resources.premierleague.com/premierleague/badges/50/t44.png',
  'Bolton': 'https://resources.premierleague.com/premierleague/badges/50/t30.png',
  'Bolton Wanderers': 'https://resources.premierleague.com/premierleague/badges/50/t30.png',
  'Blackburn': 'https://resources.premierleague.com/premierleague/badges/50/t5.png',
  'Blackburn Rovers': 'https://resources.premierleague.com/premierleague/badges/50/t5.png',
  'Birmingham': 'https://resources.premierleague.com/premierleague/badges/50/t33.png',
  'Birmingham City': 'https://resources.premierleague.com/premierleague/badges/50/t33.png',
  'Portsmouth': 'https://resources.premierleague.com/premierleague/badges/50/t38.png',
  'Derby': 'https://resources.premierleague.com/premierleague/badges/50/t10.png',
  'Derby County': 'https://resources.premierleague.com/premierleague/badges/50/t10.png',
  'Charlton': 'https://resources.premierleague.com/premierleague/badges/50/t9.png',
  'Charlton Athletic': 'https://resources.premierleague.com/premierleague/badges/50/t9.png',
  'Blackpool': 'https://resources.premierleague.com/premierleague/badges/50/t92.png',
  'Cardiff': 'https://resources.premierleague.com/premierleague/badges/50/t95.png',
  'Cardiff City': 'https://resources.premierleague.com/premierleague/badges/50/t95.png',
  'Huddersfield': 'https://resources.premierleague.com/premierleague/badges/50/t26.png',
  'Huddersfield Town': 'https://resources.premierleague.com/premierleague/badges/50/t26.png',
  'Coventry': 'https://resources.premierleague.com/premierleague/badges/50/t18.png',
  'Coventry City': 'https://resources.premierleague.com/premierleague/badges/50/t18.png',
  'Bradford': 'https://resources.premierleague.com/premierleague/badges/50/t96.png',
  'Bradford City': 'https://resources.premierleague.com/premierleague/badges/50/t96.png',
  'Wimbledon': 'https://resources.premierleague.com/premierleague/badges/50/t46.png',
  
  // La Liga teams
  'Real Madrid': 'https://crests.football-data.org/86.png',
  'Barcelona': 'https://crests.football-data.org/81.png',
  'Atletico Madrid': 'https://crests.football-data.org/78.png',
  'Atlético Madrid': 'https://crests.football-data.org/78.png',
  'Sevilla': 'https://crests.football-data.org/559.png',
  'Real Betis': 'https://crests.football-data.org/90.png',
  'Villarreal': 'https://crests.football-data.org/94.png',
  'Real Sociedad': 'https://crests.football-data.org/92.png',
  'Athletic Bilbao': 'https://crests.football-data.org/77.png',
  'Athletic Club': 'https://crests.football-data.org/77.png',
  'Valencia': 'https://crests.football-data.org/95.png',
  'Celta Vigo': 'https://crests.football-data.org/558.png',
  'Espanyol': 'https://crests.football-data.org/80.png',
  'Getafe': 'https://crests.football-data.org/82.png',
  'Osasuna': 'https://crests.football-data.org/79.png',
  'Mallorca': 'https://crests.football-data.org/89.png',
  'Rayo Vallecano': 'https://crests.football-data.org/87.png',
  'Girona': 'https://crests.football-data.org/298.png',
  'Las Palmas': 'https://crests.football-data.org/275.png',
  'Alaves': 'https://crests.football-data.org/263.png',
  'Alavés': 'https://crests.football-data.org/263.png',
  'Leganes': 'https://crests.football-data.org/745.png',
  'Leganés': 'https://crests.football-data.org/745.png',
  'Valladolid': 'https://crests.football-data.org/250.png',
  'Real Valladolid': 'https://crests.football-data.org/250.png',
  
  // Bundesliga teams
  'Bayern Munich': 'https://crests.football-data.org/5.png',
  'Bayern München': 'https://crests.football-data.org/5.png',
  'Borussia Dortmund': 'https://crests.football-data.org/4.png',
  'Dortmund': 'https://crests.football-data.org/4.png',
  'RB Leipzig': 'https://crests.football-data.org/721.png',
  'Leipzig': 'https://crests.football-data.org/721.png',
  'Bayer Leverkusen': 'https://crests.football-data.org/3.png',
  'Leverkusen': 'https://crests.football-data.org/3.png',
  'Eintracht Frankfurt': 'https://crests.football-data.org/19.png',
  'Frankfurt': 'https://crests.football-data.org/19.png',
  'VfB Stuttgart': 'https://crests.football-data.org/10.png',
  'Stuttgart': 'https://crests.football-data.org/10.png',
  'Borussia Monchengladbach': 'https://crests.football-data.org/18.png',
  'Borussia Mönchengladbach': 'https://crests.football-data.org/18.png',
  "M'gladbach": 'https://crests.football-data.org/18.png',
  'Wolfsburg': 'https://crests.football-data.org/11.png',
  'VfL Wolfsburg': 'https://crests.football-data.org/11.png',
  'Freiburg': 'https://crests.football-data.org/17.png',
  'SC Freiburg': 'https://crests.football-data.org/17.png',
  'Hoffenheim': 'https://crests.football-data.org/2.png',
  'TSG Hoffenheim': 'https://crests.football-data.org/2.png',
  'Mainz': 'https://crests.football-data.org/15.png',
  'Mainz 05': 'https://crests.football-data.org/15.png',
  'Union Berlin': 'https://crests.football-data.org/28.png',
  'Augsburg': 'https://crests.football-data.org/16.png',
  'FC Augsburg': 'https://crests.football-data.org/16.png',
  'Werder Bremen': 'https://crests.football-data.org/12.png',
  'Bremen': 'https://crests.football-data.org/12.png',
  'Bochum': 'https://crests.football-data.org/36.png',
  'VfL Bochum': 'https://crests.football-data.org/36.png',
  'Heidenheim': 'https://crests.football-data.org/44.png',
  '1. FC Heidenheim': 'https://crests.football-data.org/44.png',
  'St. Pauli': 'https://crests.football-data.org/20.png',
  'FC St. Pauli': 'https://crests.football-data.org/20.png',
  'Holstein Kiel': 'https://crests.football-data.org/720.png',
  'Kiel': 'https://crests.football-data.org/720.png',
  
  // Serie A teams
  'Inter Milan': 'https://crests.football-data.org/108.png',
  'Inter': 'https://crests.football-data.org/108.png',
  'AC Milan': 'https://crests.football-data.org/98.png',
  'Milan': 'https://crests.football-data.org/98.png',
  'Juventus': 'https://crests.football-data.org/109.png',
  'Napoli': 'https://crests.football-data.org/113.png',
  'Roma': 'https://crests.football-data.org/100.png',
  'AS Roma': 'https://crests.football-data.org/100.png',
  'Lazio': 'https://crests.football-data.org/110.png',
  'SS Lazio': 'https://crests.football-data.org/110.png',
  'Atalanta': 'https://crests.football-data.org/102.png',
  'Fiorentina': 'https://crests.football-data.org/99.png',
  'ACF Fiorentina': 'https://crests.football-data.org/99.png',
  'Bologna': 'https://crests.football-data.org/103.png',
  'Torino': 'https://crests.football-data.org/586.png',
  'Udinese': 'https://crests.football-data.org/115.png',
  'Sassuolo': 'https://crests.football-data.org/471.png',
  'Verona': 'https://crests.football-data.org/450.png',
  'Hellas Verona': 'https://crests.football-data.org/450.png',
  'Empoli': 'https://crests.football-data.org/445.png',
  'Monza': 'https://crests.football-data.org/5911.png',
  'Lecce': 'https://crests.football-data.org/5890.png',
  'Cagliari': 'https://crests.football-data.org/104.png',
  'Genoa': 'https://crests.football-data.org/107.png',
  'Parma': 'https://crests.football-data.org/112.png',
  'Venezia': 'https://crests.football-data.org/454.png',
  'Como': 'https://crests.football-data.org/7397.png',
  
  // Ligue 1 teams
  'Paris Saint-Germain': 'https://crests.football-data.org/524.png',
  'PSG': 'https://crests.football-data.org/524.png',
  'Paris S-G': 'https://crests.football-data.org/524.png',
  'Marseille': 'https://crests.football-data.org/516.png',
  'Olympique Marseille': 'https://crests.football-data.org/516.png',
  'Lyon': 'https://crests.football-data.org/523.png',
  'Olympique Lyon': 'https://crests.football-data.org/523.png',
  'Olympique Lyonnais': 'https://crests.football-data.org/523.png',
  'Monaco': 'https://crests.football-data.org/548.png',
  'AS Monaco': 'https://crests.football-data.org/548.png',
  'Lille': 'https://crests.football-data.org/521.png',
  'LOSC Lille': 'https://crests.football-data.org/521.png',
  'Nice': 'https://crests.football-data.org/522.png',
  'OGC Nice': 'https://crests.football-data.org/522.png',
  'Lens': 'https://crests.football-data.org/546.png',
  'RC Lens': 'https://crests.football-data.org/546.png',
  'Rennes': 'https://crests.football-data.org/529.png',
  'Stade Rennais': 'https://crests.football-data.org/529.png',
  'Strasbourg': 'https://crests.football-data.org/576.png',
  'RC Strasbourg': 'https://crests.football-data.org/576.png',
  'Nantes': 'https://crests.football-data.org/543.png',
  'FC Nantes': 'https://crests.football-data.org/543.png',
  'Montpellier': 'https://crests.football-data.org/518.png',
  'Montpellier HSC': 'https://crests.football-data.org/518.png',
  'Reims': 'https://crests.football-data.org/547.png',
  'Stade de Reims': 'https://crests.football-data.org/547.png',
  'Toulouse': 'https://crests.football-data.org/511.png',
  'Toulouse FC': 'https://crests.football-data.org/511.png',
  'Brest': 'https://crests.football-data.org/512.png',
  'Stade Brestois': 'https://crests.football-data.org/512.png',
  'Lorient': 'https://crests.football-data.org/525.png',
  'FC Lorient': 'https://crests.football-data.org/525.png',
  'Le Havre': 'https://crests.football-data.org/545.png',
  'Auxerre': 'https://crests.football-data.org/519.png',
  'AJ Auxerre': 'https://crests.football-data.org/519.png',
  'Angers': 'https://crests.football-data.org/532.png',
  'Angers SCO': 'https://crests.football-data.org/532.png',
  'Saint-Etienne': 'https://crests.football-data.org/527.png',
  'AS Saint-Étienne': 'https://crests.football-data.org/527.png',
};

// Get team logo URL with fallback
export function getTeamLogo(teamName: string): string {
  // Try exact match first
  if (teamLogos[teamName]) {
    return teamLogos[teamName];
  }
  
  // Try case-insensitive match
  const lowerName = teamName.toLowerCase();
  for (const [key, value] of Object.entries(teamLogos)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(teamLogos)) {
    if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Return placeholder
  return 'https://resources.premierleague.com/premierleague/badges/50/t0.png';
}
