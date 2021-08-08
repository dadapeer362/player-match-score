const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

module.exports = app;

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

//initializeDBAndServer
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Get players list
app.get("/players/", async (request, response) => {
  const getPlayersList = `
        SELECT 
            player_id as playerId,
            player_name as playerName
        FROM 
            player_details;`;
  const playersList = await db.all(getPlayersList);
  response.send(playersList);
});

// Get player details for the asked id
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `
        SELECT 
            player_id as playerId,
            player_name as playerName
        FROM
            player_details
        WHERE 
            player_id = ${playerId};`;
  const player = await db.get(getPlayer);
  response.send(player);
});

// Put the given details in the player details
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const putPlayerDetails = `
        UPDATE 
            player_details
        SET
            player_name = '${playerName}'
        WHERE 
            player_id = ${playerId};`;
  await db.run(putPlayerDetails);
  response.send("Player Details Updated");
});

//Get match details
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `
        SELECT 
            match_id as matchId,
            match,
            year
        FROM
            match_details
        WHERE 
            match_id = ${matchId};`;
  const matchDetails = await db.get(getMatchDetails);
  response.send(matchDetails);
});

// Get list of matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getAllMatches = `
        SELECT 
            match_id as matchId,
            match,
            year
        FROM
            player_match_score NATURAL JOIN match_details
        WHERE 
            player_id = ${playerId};`;
  const matches = await db.all(getAllMatches);
  response.send(matches);
});

// Get list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getAllThePlayersOfMatch = `
        SELECT 
            player_id as playerId,
            player_name as playerName
        FROM
            (player_match_score NATURAL JOIN player_details) NATURAL JOIN match_details
        WHERE 
            match_id = ${matchId};`;
  const players = await db.all(getAllThePlayersOfMatch);
  response.send(players);
});

// Get statistics of a player
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStats = `
        SELECT 
            player_id as playerId,
            player_name as playerName,
            SUM(score) as totalScore,
            SUM(fours) as totalFours,
            SUM(sixes) as totalSixes
        FROM
            (player_match_score NATURAL JOIN player_details) NATURAL JOIN match_details
        WHERE 
            player_id = ${playerId};`;
  const playerStats = await db.get(getPlayerStats);
  response.send(playerStats);
});
