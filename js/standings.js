/**
 * Standings Calculator - IHF/EHF Standard Rules
 * 
 * Official Handball Ranking Criteria (in order):
 * 1. Points (Win=2, Draw=1, Loss=0)
 * 2. Goal Difference (Goals For - Goals Against)
 * 3. Goals For (total goals scored)
 * 4. Head-to-Head points between tied teams
 * 5. Head-to-Head goal difference between tied teams
 * 
 * Supports:
 * - Single league format
 * - Multiple groups (A, B, C...)
 * - Form tracking (last 5 matches: W-L-D)
 * - Automatic tiebreaker resolution
 * 
 * @example
 * // Get standings for a stage
 * const standings = StandingsCalculator.getStandingsForDisplay(competitionId, stageId);
 * 
 * // Returns either:
 * // { type: 'league', standings: [...] }
 * // { type: 'group', groups: { A: [...], B: [...] } }
 */

const StandingsCalculator = {
  /**
   * Calculate standings for a competition stage
   * @param {string} competitionId - Competition ID
   * @param {string} stageId - Stage ID (optional, omit for all stages)
   * @returns {Object} - Grouped standings by group
   */
  calculateStandings(competitionId, stageId = null) {
    const matches = MatchesStore.getAll().filter(m => m.competitionId === competitionId);
    
    // Filter by stage if provided
    const stageMatches = stageId 
      ? matches.filter(m => m.stageId === stageId)
      : matches;
    
    // Only include finished matches
    const finishedMatches = stageMatches.filter(m => m.status === 'finished' && m.homeScore !== null && m.awayScore !== null);
    
    // Get all teams from matches
    const teamStats = new Map();
    
    finishedMatches.forEach(match => {
      // Initialize teams if not exists
      if (!teamStats.has(match.homeTeamId)) {
        teamStats.set(match.homeTeamId, this.createTeamStats(match.homeTeamId));
      }
      if (!teamStats.has(match.awayTeamId)) {
        teamStats.set(match.awayTeamId, this.createTeamStats(match.awayTeamId));
      }
      
      const home = teamStats.get(match.homeTeamId);
      const away = teamStats.get(match.awayTeamId);
      
      // Update matches played
      home.played++;
      away.played++;
      
      // Update goals
      home.goalsFor += match.homeScore;
      home.goalsAgainst += match.awayScore;
      away.goalsFor += match.awayScore;
      away.goalsAgainst += match.homeScore;
      
      // Update points and W/D/L
      if (match.homeScore > match.awayScore) {
        // Home win
        home.won++;
        home.points += 2;
        away.lost++;
      } else if (match.homeScore < match.awayScore) {
        // Away win
        away.won++;
        away.points += 2;
        home.lost++;
      } else {
        // Draw
        home.drawn++;
        home.points += 1;
        away.drawn++;
        away.points += 1;
      }
      
      // Store head-to-head data
      this.updateHeadToHead(home, away, match);
    });
    
    // Calculate goal difference
    teamStats.forEach(stats => {
      stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
    });
    
    // Convert to array and sort
    let standings = Array.from(teamStats.values());
    standings = this.sortStandings(standings, finishedMatches);
    
    // Group by group if applicable
    return this.groupByGroup(standings, competitionId, stageId);
  },
  
  /**
   * Create initial team stats object
   */
  createTeamStats(teamId) {
    const team = TeamsStore.getById(teamId);
    return {
      teamId,
      teamName: team ? team.name : 'Unknown Team',
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      headToHead: new Map() // teamId -> { points, goalDiff, goalsFor }
    };
  },
  
  /**
   * Update head-to-head stats between two teams
   */
  updateHeadToHead(home, away, match) {
    // Initialize head-to-head records if not exists
    if (!home.headToHead.has(away.teamId)) {
      home.headToHead.set(away.teamId, { points: 0, goalDiff: 0, goalsFor: 0 });
    }
    if (!away.headToHead.has(home.teamId)) {
      away.headToHead.set(home.teamId, { points: 0, goalDiff: 0, goalsFor: 0 });
    }
    
    const homeH2H = home.headToHead.get(away.teamId);
    const awayH2H = away.headToHead.get(home.teamId);
    
    // Update goals
    homeH2H.goalsFor += match.homeScore;
    homeH2H.goalDiff += (match.homeScore - match.awayScore);
    awayH2H.goalsFor += match.awayScore;
    awayH2H.goalDiff += (match.awayScore - match.homeScore);
    
    // Update points
    if (match.homeScore > match.awayScore) {
      homeH2H.points += 2;
    } else if (match.homeScore < match.awayScore) {
      awayH2H.points += 2;
    } else {
      homeH2H.points += 1;
      awayH2H.points += 1;
    }
  },
  
  /**
   * Sort standings according to IHF/EHF rules
   */
  sortStandings(standings, allMatches) {
    return standings.sort((a, b) => {
      // 1. Points (descending)
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      
      // 2. Goal Difference (descending)
      if (b.goalDifference !== a.goalDifference) {
        return b.goalDifference - a.goalDifference;
      }
      
      // 3. Goals For (descending)
      if (b.goalsFor !== a.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }
      
      // 4. Head-to-Head points
      const h2h = a.headToHead.get(b.teamId);
      if (h2h) {
        const bH2H = b.headToHead.get(a.teamId);
        if (bH2H && h2h.points !== bH2H.points) {
          return bH2H.points - h2h.points;
        }
      }
      
      // 5. Head-to-Head goal difference
      if (h2h) {
        const bH2H = b.headToHead.get(a.teamId);
        if (bH2H && h2h.goalDiff !== bH2H.goalDiff) {
          return bH2H.goalDiff - h2h.goalDiff;
        }
      }
      
      // 6. Alphabetical (fallback)
      return a.teamName.localeCompare(b.teamName);
    });
  },
  
  /**
   * Group standings by group (A, B, C, etc.)
   */
  groupByGroup(standings, competitionId, stageId) {
    const groups = {};
    
    // Get stage info to determine groups
    if (stageId) {
      const stage = CompetitionStagesStore.getById(stageId);
      if (stage && stage.format === 'group_stage') {
        const numberOfGroups = stage.numberOfGroups || 1;
        
        // Initialize groups
        for (let i = 0; i < numberOfGroups; i++) {
          const groupName = String.fromCharCode(65 + i); // A, B, C...
          groups[groupName] = [];
        }
        
        // Assign teams to groups based on match data
        const matches = MatchesStore.getAll().filter(m => 
          m.competitionId === competitionId && 
          m.stageId === stageId
        );
        
        const teamGroups = new Map();
        matches.forEach(match => {
          if (match.group && !teamGroups.has(match.homeTeamId)) {
            teamGroups.set(match.homeTeamId, match.group);
          }
          if (match.group && !teamGroups.has(match.awayTeamId)) {
            teamGroups.set(match.awayTeamId, match.group);
          }
        });
        
        // Distribute standings into groups
        standings.forEach(team => {
          const group = teamGroups.get(team.teamId) || 'A';
          if (!groups[group]) {
            groups[group] = [];
          }
          groups[group].push(team);
        });
        
        // Sort each group
        Object.keys(groups).forEach(groupName => {
          groups[groupName].sort((a, b) => b.points - a.points);
        });
        
        return { type: 'group', groups };
      }
    }
    
    // Single group/league format
    return { type: 'league', standings };
  },
  
  /**
   * Get standings formatted for display
   */
  getStandingsForDisplay(competitionId, stageId = null) {
    const result = this.calculateStandings(competitionId, stageId);
    
    if (result.type === 'group') {
      const display = {};
      Object.keys(result.groups).forEach(groupName => {
        display[groupName] = result.groups[groupName].map((team, index) => ({
          position: index + 1,
          ...team,
          form: this.getTeamForm(team.teamId, competitionId, stageId)
        }));
      });
      return display;
    } else {
      return result.standings.map((team, index) => ({
        position: index + 1,
        ...team,
        form: this.getTeamForm(team.teamId, competitionId, stageId)
      }));
    }
  },
  
  /**
   * Get team's last 5 matches form
   */
  getTeamForm(teamId, competitionId, stageId) {
    const matches = MatchesStore.getAll()
      .filter(m => m.competitionId === competitionId && m.status === 'finished')
      .filter(m => m.homeTeamId === teamId || m.awayTeamId === teamId)
      .slice(-5);
    
    return matches.map(match => {
      const isHome = match.homeTeamId === teamId;
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const opponentScore = isHome ? match.awayScore : match.homeScore;
      
      if (teamScore > opponentScore) return 'W';
      if (teamScore < opponentScore) return 'L';
      return 'D';
    }).join('');
  }
};
