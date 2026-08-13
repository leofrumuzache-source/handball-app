/**
 * ============================================
 * Handball Club Management - Storage Module
 * LocalStorage helpers with namespacing
 * ============================================
 */

const Storage = {
  NAMESPACE: 'handball.',

  /**
   * Get item from LocalStorage
   * @param {string} key - Key name (without namespace)
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} Parsed value or default
   */
  get(key, defaultValue = null) {
    try {
      const fullKey = this.NAMESPACE + key;
      const item = localStorage.getItem(fullKey);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error(`Storage.get error for key "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * Set item in LocalStorage
   * @param {string} key - Key name (without namespace)
   * @param {*} value - Value to store (will be JSON stringified)
   * @returns {boolean} Success status
   */
  set(key, value) {
    try {
      const fullKey = this.NAMESPACE + key;
      localStorage.setItem(fullKey, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Storage.set error for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Remove item from LocalStorage
   * @param {string} key - Key name (without namespace)
   * @returns {boolean} Success status
   */
  remove(key) {
    try {
      const fullKey = this.NAMESPACE + key;
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error(`Storage.remove error for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Clear all handball app data
   * @returns {boolean} Success status
   */
  clear() {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.NAMESPACE));
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Storage.clear error:', error);
      return false;
    }
  },

  /**
   * Check if key exists
   * @param {string} key - Key name (without namespace)
   * @returns {boolean}
   */
  has(key) {
    const fullKey = this.NAMESPACE + key;
    return localStorage.getItem(fullKey) !== null;
  },
};

/**
 * ============================================
 * Clubs Data Access Layer
 * ============================================
 */
const ClubsStore = {
  KEY: 'clubs',

  /**
   * Get all clubs
   * @returns {Array} Array of club objects
   */
  getAll() {
    return Storage.get(this.KEY, []);
  },

  /**
   * Get club by ID
   * @param {string} id - Club ID
   * @returns {Object|null} Club object or null
   */
  getById(id) {
    const clubs = this.getAll();
    return clubs.find(club => club.id === id) || null;
  },

  /**
   * Get club by name
   * @param {string} name - Club name
   * @returns {Object|null} Club object or null
   */
  getByName(name) {
    const clubs = this.getAll();
    return clubs.find(club => club.name === name) || null;
  },

  /**
   * Create new club
   * @param {Object} clubData - Club data (without id)
   * @returns {Object} Created club with id
   */
  create(clubData) {
    const clubs = this.getAll();
    const newClub = {
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...clubData
    };
    clubs.push(newClub);
    Storage.set(this.KEY, clubs);
    return newClub;
  },

  /**
   * Update existing club
   * @param {string} id - Club ID
   * @param {Object} clubData - Updated club data
   * @returns {Object|null} Updated club or null
   */
  update(id, clubData) {
    const clubs = this.getAll();
    const index = clubs.findIndex(club => club.id === id);
    if (index === -1) return null;

    clubs[index] = {
      ...clubs[index],
      ...clubData,
      updatedAt: new Date().toISOString()
    };
    Storage.set(this.KEY, clubs);
    return clubs[index];
  },

  /**
   * Delete club by ID
   * @param {string} id - Club ID
   * @returns {boolean} Success status
   */
  delete(id) {
    const clubs = this.getAll();
    const filtered = clubs.filter(club => club.id !== id);
    if (filtered.length === clubs.length) return false;
    Storage.set(this.KEY, filtered);
    return true;
  },

  /**
   * Get club count
   * @returns {number}
   */
  getCount() {
    return this.getAll().length;
  },

  /**
   * Get recent clubs
   * @param {number} limit - Number of clubs to return
   * @returns {Array}
   */
  getRecent(limit = 5) {
    const clubs = this.getAll();
    return clubs
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  },

  /**
   * Generate unique ID
   * @returns {string}
   */
  generateId() {
    return 'club_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Import clubs from array
   * @param {Array} clubsData - Array of club objects
   * @returns {Object} Import results
   */
  import(clubsData) {
    const clubs = this.getAll();
    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    clubsData.forEach((clubData, index) => {
      // Check for duplicate name
      const existing = clubs.find(c => c.name === clubData.name);
      if (existing) {
        results.skipped++;
        results.errors.push(`Row ${index + 1}: Duplicate club name "${clubData.name}"`);
        return;
      }

      // Create new club
      const newClub = {
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...clubData
      };
      clubs.push(newClub);
      results.imported++;
    });

    Storage.set(this.KEY, clubs);
    return results;
  },

  /**
   * Export all clubs
   * @returns {Array} Clean club data (without internal fields)
   */
  export() {
    const clubs = this.getAll();
    return clubs.map(({ id, createdAt, updatedAt, ...rest }) => rest);
  }
};

/**
 * ============================================
 * Teams Data Access Layer
 * ============================================
 */
const TeamsStore = {
  KEY: 'teams',

  /**
   * Get all teams
   * @returns {Array} Array of team objects
   */
  getAll() {
    return Storage.get(this.KEY, []);
  },

  /**
   * Get team by ID
   * @param {string} id - Team ID
   * @returns {Object|null} Team object or null
   */
  getById(id) {
    const teams = this.getAll();
    return teams.find(team => team.id === id) || null;
  },

  /**
   * Get teams by club name
   * @param {string} clubName - Club name
   * @returns {Array} Array of teams
   */
  getByClubName(clubName) {
    const teams = this.getAll();
    return teams.filter(team => team.clubName === clubName);
  },

  /**
   * Get team by name
   * @param {string} name - Team name
   * @returns {Object|null} Team object or null
   */
  getByName(name) {
    const teams = this.getAll();
    return teams.find(team => team.name === name) || null;
  },

  /**
   * Create new team
   * @param {Object} teamData - Team data (without id)
   * @returns {Object} Created team with id
   */
  create(teamData) {
    const teams = this.getAll();
    const newTeam = {
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...teamData
    };
    teams.push(newTeam);
    Storage.set(this.KEY, teams);
    return newTeam;
  },

  /**
   * Update existing team
   * @param {string} id - Team ID
   * @param {Object} teamData - Updated team data
   * @returns {Object|null} Updated team or null
   */
  update(id, teamData) {
    const teams = this.getAll();
    const index = teams.findIndex(team => team.id === id);
    if (index === -1) return null;

    teams[index] = {
      ...teams[index],
      ...teamData,
      updatedAt: new Date().toISOString()
    };
    Storage.set(this.KEY, teams);
    return teams[index];
  },

  /**
   * Delete team by ID
   * @param {string} id - Team ID
   * @returns {boolean} Success status
   */
  delete(id) {
    const teams = this.getAll();
    const filtered = teams.filter(team => team.id !== id);
    if (filtered.length === teams.length) return false;
    Storage.set(this.KEY, filtered);
    return true;
  },

  /**
   * Get team count
   * @returns {number}
   */
  getCount() {
    return this.getAll().length;
  },

  /**
   * Get recent teams
   * @param {number} limit - Number of teams to return
   * @returns {Array}
   */
  getRecent(limit = 5) {
    const teams = this.getAll();
    return teams
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  },

  /**
   * Generate unique ID
   * @returns {string}
   */
  generateId() {
    return 'team_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Import teams from array
   * @param {Array} teamsData - Array of team objects
   * @returns {Object} Import results
   */
  import(teamsData) {
    const teams = this.getAll();
    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    teamsData.forEach((teamData, index) => {
      // Validate clubName exists
      const club = ClubsStore.getByName(teamData.clubName);
      if (!club) {
        results.skipped++;
        results.errors.push(`Row ${index + 1}: Club "${teamData.clubName}" not found`);
        return;
      }

      // Create new team
      const newTeam = {
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...teamData
      };
      teams.push(newTeam);
      results.imported++;
    });

    Storage.set(this.KEY, teams);
    return results;
  },

  /**
   * Export all teams
   * @returns {Array} Clean team data (without internal fields)
   */
  export() {
    const teams = this.getAll();
    return teams.map(({ id, createdAt, updatedAt, ...rest }) => rest);
  }
};

/**
 * ============================================
 * Authentication Data Access Layer
 * ============================================
 */
const AuthStore = {
  KEY: 'auth',
  MASTER_PIN: '761513',
  VIEW_PIN: '315167',
  SESSION_HOURS: 8,

  /**
   * Get current auth state
   * @returns {Object|null} Auth state or null
   */
  getState() {
    return Storage.get(this.KEY, null);
  },

  /**
   * Check if user is logged in
   * @returns {boolean}
   */
  isLoggedIn() {
    const auth = this.getState();
    if (!auth) return false;

    // Check if session expired
    if (new Date(auth.expiresAt) < new Date()) {
      this.logout();
      return false;
    }

    return true;
  },

  /**
   * Get access level
   * @returns {string|null} 'master', 'view', or null
   */
  getAccessLevel() {
    const auth = this.getState();
    return auth ? auth.accessLevel : null;
  },

  /**
   * Check if user has master access
   * @returns {boolean}
   */
  isMaster() {
    return this.getAccessLevel() === 'master';
  },

  /**
   * Login with PIN
   * @param {string} pin - PIN code
   * @returns {Object} Login result
   */
  login(pin) {
    if (pin === this.MASTER_PIN) {
      const auth = {
        accessLevel: 'master',
        loginTime: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.SESSION_HOURS * 60 * 60 * 1000).toISOString()
      };
      Storage.set(this.KEY, auth);
      return { success: true, accessLevel: 'master' };
    }

    if (pin === this.VIEW_PIN) {
      const auth = {
        accessLevel: 'view',
        loginTime: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.SESSION_HOURS * 60 * 60 * 1000).toISOString()
      };
      Storage.set(this.KEY, auth);
      return { success: true, accessLevel: 'view' };
    }

    return { success: false, error: 'Invalid PIN' };
  },

  /**
   * Logout user
   * @returns {boolean}
   */
  logout() {
    return Storage.remove(this.KEY);
  },

  /**
   * Get user display info
   * @returns {Object}
   */
  getUserInfo() {
    const level = this.getAccessLevel();
    return {
      name: level === 'master' ? 'Administrator' : 'Viewer',
      role: level === 'master' ? 'Full Access' : 'Read Only'
    };
  }
};

/**
 * ============================================
 * Players Data Access Layer
 * ============================================
 */
const PlayersStore = {
  KEY: 'players',

  /**
   * Get all players
   * @returns {Array} Array of player objects
   */
  getAll() {
    return Storage.get(this.KEY, []);
  },

  /**
   * Get player by ID
   * @param {string} id - Player ID
   * @returns {Object|null} Player object or null
   */
  getById(id) {
    const players = this.getAll();
    return players.find(player => player.id === id) || null;
  },

  /**
   * Get players by team ID
   * @param {string} teamId - Team ID
   * @returns {Array} Array of players
   */
  getByTeamId(teamId) {
    const players = this.getAll();
    return players.filter(player => player.teamId === teamId);
  },

  /**
   * Create new player
   * @param {Object} playerData - Player data (without id)
   * @returns {Object} Created player with id
   */
  create(playerData) {
    const players = this.getAll();
    const newPlayer = {
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...playerData
    };
    players.push(newPlayer);
    Storage.set(this.KEY, players);
    return newPlayer;
  },

  /**
   * Update existing player
   * @param {string} id - Player ID
   * @param {Object} playerData - Updated player data
   * @returns {Object|null} Updated player or null
   */
  update(id, playerData) {
    const players = this.getAll();
    const index = players.findIndex(player => player.id === id);
    if (index === -1) return null;

    players[index] = {
      ...players[index],
      ...playerData,
      updatedAt: new Date().toISOString()
    };
    Storage.set(this.KEY, players);
    return players[index];
  },

  /**
   * Delete player by ID
   * @param {string} id - Player ID
   * @returns {boolean} Success status
   */
  delete(id) {
    const players = this.getAll();
    const filtered = players.filter(player => player.id !== id);
    if (filtered.length === players.length) return false;
    Storage.set(this.KEY, filtered);
    return true;
  },

  /**
   * Get player count
   * @returns {number}
   */
  getCount() {
    return this.getAll().length;
  },

  /**
   * Get recent players
   * @param {number} limit - Number of players to return
   * @returns {Array}
   */
  getRecent(limit = 5) {
    const players = this.getAll();
    return players
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  },

  /**
   * Generate unique ID
   * @returns {string}
   */
  generateId() {
    return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Import players from array
   * @param {Array} playersData - Array of player objects
   * @returns {Object} Import results
   */
  import(playersData) {
    const players = this.getAll();
    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    playersData.forEach((playerData, index) => {
      // Validate team exists
      const team = TeamsStore.getById(playerData.teamId) || TeamsStore.getAll().find(t => t.name === playerData.teamName);
      if (!team) {
        results.skipped++;
        results.errors.push(`Row ${index + 1}: Team "${playerData.teamName || playerData.teamId}" not found`);
        return;
      }

      // Use team ID if teamName was provided
      if (playerData.teamName && team) {
        playerData.teamId = team.id;
        delete playerData.teamName;
      }

      // Create new player
      const newPlayer = {
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...playerData
      };
      players.push(newPlayer);
      results.imported++;
    });

    Storage.set(this.KEY, players);
    return results;
  },

  /**
   * Export all players
   * @returns {Array} Clean player data (without internal fields)
   */
  export() {
    const players = this.getAll();
    return players.map(({ id, createdAt, updatedAt, ...rest }) => rest);
  }
};

/**
 * ============================================
 * Competitions Data Access Layer
 * ============================================
 */
const CompetitionsStore = {
  KEY: 'competitions',

  /**
   * Get all competitions
   * @returns {Array} Array of competition objects
   */
  getAll() {
    return Storage.get(this.KEY, []);
  },

  /**
   * Get competition by ID
   * @param {string} id - Competition ID
   * @returns {Object|null} Competition object or null
   */
  getById(id) {
    const competitions = this.getAll();
    return competitions.find(comp => comp.id === id) || null;
  },

  /**
   * Get competition by name
   * @param {string} name - Competition name
   * @returns {Object|null} Competition object or null
   */
  getByName(name) {
    const competitions = this.getAll();
    return competitions.find(comp => comp.name === name) || null;
  },

  /**
   * Create new competition
   * @param {Object} compData - Competition data (without id)
   * @returns {Object} Created competition with id
   */
  create(compData) {
    const competitions = this.getAll();
    const newComp = {
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...compData
    };
    competitions.push(newComp);
    Storage.set(this.KEY, competitions);
    return newComp;
  },

  /**
   * Update existing competition
   * @param {string} id - Competition ID
   * @param {Object} compData - Updated competition data
   * @returns {Object|null} Updated competition or null
   */
  update(id, compData) {
    const competitions = this.getAll();
    const index = competitions.findIndex(comp => comp.id === id);
    if (index === -1) return null;

    competitions[index] = {
      ...competitions[index],
      ...compData,
      updatedAt: new Date().toISOString()
    };
    Storage.set(this.KEY, competitions);
    return competitions[index];
  },

  /**
   * Delete competition by ID
   * @param {string} id - Competition ID
   * @returns {boolean} Success status
   */
  delete(id) {
    const competitions = this.getAll();
    const filtered = competitions.filter(comp => comp.id !== id);
    if (filtered.length === competitions.length) return false;
    Storage.set(this.KEY, filtered);
    return true;
  },

  /**
   * Get competition count
   * @returns {number}
   */
  getCount() {
    return this.getAll().length;
  },

  /**
   * Get recent competitions
   * @param {number} limit - Number of competitions to return
   * @returns {Array}
   */
  getRecent(limit = 5) {
    const competitions = this.getAll();
    return competitions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  },

  /**
   * Generate unique ID
   * @returns {string}
   */
  generateId() {
    return 'comp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Import competitions from array
   * @param {Array} compData - Array of competition objects
   * @returns {Object} Import results
   */
  import(compData) {
    const competitions = this.getAll();
    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    compData.forEach((item, index) => {
      // Check for duplicate name
      const existing = competitions.find(c => c.name === item.name);
      if (existing) {
        results.skipped++;
        results.errors.push(`Row ${index + 1}: Duplicate competition name "${item.name}"`);
        return;
      }

      // Create new competition
      const newComp = {
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...item
      };
      competitions.push(newComp);
      results.imported++;
    });

    Storage.set(this.KEY, competitions);
    return results;
  },

  /**
   * Export all competitions
   * @returns {Array} Clean competition data (without internal fields)
   */
  export() {
    const competitions = this.getAll();
    return competitions.map(({ id, createdAt, updatedAt, ...rest }) => rest);
  }
};

/**
 * ============================================
 * Competition Stages Data Access Layer
 * ============================================
 */
const CompetitionStagesStore = {
  KEY: 'competition_stages',

  /**
   * Get all stages
   * @returns {Array} Array of stage objects
   */
  getAll() {
    return Storage.get(this.KEY, []);
  },

  /**
   * Get stage by ID
   * @param {string} id - Stage ID
   * @returns {Object|null} Stage object or null
   */
  getById(id) {
    const stages = this.getAll();
    return stages.find(stage => stage.id === id) || null;
  },

  /**
   * Get stages by competition ID
   * @param {string} competitionId - Competition ID
   * @returns {Array} Array of stages
   */
  getByCompetitionId(competitionId) {
    const stages = this.getAll();
    return stages.filter(stage => stage.competitionId === competitionId)
      .sort((a, b) => a.order - b.order);
  },

  /**
   * Create new stage
   * @param {Object} stageData - Stage data (without id)
   * @returns {Object} Created stage with id
   */
  create(stageData) {
    const stages = this.getAll();
    const newStage = {
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...stageData
    };
    stages.push(newStage);
    Storage.set(this.KEY, stages);
    return newStage;
  },

  /**
   * Update existing stage
   * @param {string} id - Stage ID
   * @param {Object} stageData - Updated stage data
   * @returns {Object|null} Updated stage or null
   */
  update(id, stageData) {
    const stages = this.getAll();
    const index = stages.findIndex(stage => stage.id === id);
    if (index === -1) return null;

    stages[index] = {
      ...stages[index],
      ...stageData,
      updatedAt: new Date().toISOString()
    };
    Storage.set(this.KEY, stages);
    return stages[index];
  },

  /**
   * Delete stage by ID
   * @param {string} id - Stage ID
   * @returns {boolean} Success status
   */
  delete(id) {
    const stages = this.getAll();
    const filtered = stages.filter(stage => stage.id !== id);
    if (filtered.length === stages.length) return false;
    Storage.set(this.KEY, filtered);
    return true;
  },

  /**
   * Delete all stages for a competition
   * @param {string} competitionId - Competition ID
   * @returns {number} Number of stages deleted
   */
  deleteByCompetitionId(competitionId) {
    const stages = this.getAll();
    const filtered = stages.filter(stage => stage.competitionId !== competitionId);
    const deletedCount = stages.length - filtered.length;
    Storage.set(this.KEY, filtered);
    return deletedCount;
  },

  /**
   * Generate unique ID
   * @returns {string}
   */
  generateId() {
    return 'stage_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Export all stages
   * @returns {Array} Clean stage data
   */
  export() {
    const stages = this.getAll();
    return stages.map(({ id, createdAt, updatedAt, ...rest }) => rest);
  }
};

/**
 * ============================================
 * Matches Data Access Layer
 * ============================================
 */
const MatchesStore = {
  KEY: 'matches',

  /**
   * Get all matches
   * @returns {Array} Array of match objects
   */
  getAll() {
    return Storage.get(this.KEY, []);
  },

  /**
   * Get match by ID
   * @param {string} id - Match ID
   * @returns {Object|null} Match object or null
   */
  getById(id) {
    const matches = this.getAll();
    return matches.find(match => match.id === id) || null;
  },

  /**
   * Get matches by competition ID
   * @param {string} competitionId - Competition ID
   * @returns {Array} Array of matches
   */
  getByCompetitionId(competitionId) {
    const matches = this.getAll();
    return matches.filter(match => match.competitionId === competitionId);
  },

  /**
   * Get matches by stage ID
   * @param {string} stageId - Stage ID
   * @returns {Array} Array of matches
   */
  getByStageId(stageId) {
    const matches = this.getAll();
    return matches.filter(match => match.stageId === stageId);
  },

  /**
   * Get matches by team ID
   * @param {string} teamId - Team ID
   * @returns {Array} Array of matches
   */
  getByTeamId(teamId) {
    const matches = this.getAll();
    return matches.filter(match => match.homeTeamId === teamId || match.awayTeamId === teamId);
  },

  /**
   * Create new match
   * @param {Object} matchData - Match data (without id)
   * @returns {Object} Created match with id
   */
  create(matchData) {
    const matches = this.getAll();
    const newMatch = {
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...matchData
    };
    matches.push(newMatch);
    Storage.set(this.KEY, matches);
    return newMatch;
  },

  /**
   * Update existing match
   * @param {string} id - Match ID
   * @param {Object} matchData - Updated match data
   * @returns {Object|null} Updated match or null
   */
  update(id, matchData) {
    const matches = this.getAll();
    const index = matches.findIndex(match => match.id === id);
    if (index === -1) return null;

    matches[index] = {
      ...matches[index],
      ...matchData,
      updatedAt: new Date().toISOString()
    };
    Storage.set(this.KEY, matches);
    return matches[index];
  },

  /**
   * Delete match by ID
   * @param {string} id - Match ID
   * @returns {boolean} Success status
   */
  delete(id) {
    const matches = this.getAll();
    const filtered = matches.filter(match => match.id !== id);
    if (filtered.length === matches.length) return false;
    Storage.set(this.KEY, filtered);
    return true;
  },

  /**
   * Delete all matches for a competition
   * @param {string} competitionId - Competition ID
   * @returns {number} Number of matches deleted
   */
  deleteByCompetitionId(competitionId) {
    const matches = this.getAll();
    const filtered = matches.filter(match => match.competitionId !== competitionId);
    const deletedCount = matches.length - filtered.length;
    Storage.set(this.KEY, filtered);
    return deletedCount;
  },

  /**
   * Delete all matches for a stage
   * @param {string} stageId - Stage ID
   * @returns {number} Number of matches deleted
   */
  deleteByStageId(stageId) {
    const matches = this.getAll();
    const filtered = matches.filter(match => match.stageId !== stageId);
    const deletedCount = matches.length - filtered.length;
    Storage.set(this.KEY, filtered);
    return deletedCount;
  },

  /**
   * Get match count
   * @returns {number}
   */
  getCount() {
    return this.getAll().length;
  },

  /**
   * Generate unique ID
   * @returns {string}
   */
  generateId() {
    return 'match_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Import matches from array
   * @param {Array} matchData - Array of match objects
   * @returns {Object} Import results
   */
  import(matchData) {
    const matches = this.getAll();
    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    matchData.forEach((item, index) => {
      // Create new match
      const newMatch = {
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...item
      };
      matches.push(newMatch);
      results.imported++;
    });

    Storage.set(this.KEY, matches);
    return results;
  },

  /**
   * Validate match per day limits for a team in a competition
   * @param {string} teamId - Team ID
   * @param {string} competitionId - Competition ID
   * @param {string} date - Match date (YYYY-MM-DD)
   * @param {string} matchId - Current match ID (for updates, to exclude self)
   * @returns {Object} Validation result: { valid, limit, currentCount, canOverride, message }
   */
  validateMatchPerDayLimit(teamId, competitionId, date, matchId = null) {
    const competition = CompetitionsStore.getById(competitionId);
    
    if (!competition) {
      return { valid: true, limit: 1, currentCount: 0, canOverride: false, message: 'Competition not found' };
    }
    
    // Determine limit based on competition type
    const isFriendly = competition.type === 'friendly';
    const limit = isFriendly ? 3 : 1;
    
    // Get all matches for this competition on this date involving this team
    const matches = this.getAll();
    const matchesOnDate = matches.filter(match => {
      // Skip current match when updating
      if (matchId && match.id === matchId) return false;
      
      // Must be same competition and date
      if (match.competitionId !== competitionId) return false;
      if (match.date !== date) return false;
      
      // Must involve this team
      return match.homeTeamId === teamId || match.awayTeamId === teamId;
    });
    
    const currentCount = matchesOnDate.length;
    const valid = currentCount < limit;
    const canOverride = isFriendly; // Only friendlies allow override
    
    let message = '';
    if (!valid) {
      if (isFriendly) {
        message = `⚠️ Warning: This team already has ${currentCount} match(es) on ${date} in this competition. Maximum is ${limit} matches per day for friendly competitions.`;
      } else {
        message = `❌ Error: This team already has ${currentCount} match(es) on ${date}. Official competitions allow only 1 match per day per team.`;
      }
    }
    
    return { valid, limit, currentCount, canOverride, message };
  },

  /**
   * Export all matches
   * @returns {Array} Clean match data
   */
  export() {
    const matches = this.getAll();
    return matches.map(({ id, createdAt, updatedAt, ...rest }) => rest);
  }
};
