const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
  }
};
initializeDbAndServer();

const localToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

// getting players details

app.get("/players/", async (request, response) => {
  const playersQuery = `
        SELECT * 
        FROM player_details;`;
  const playersDetails = await db.all(playersQuery);
  response.send(
    playersDetails.map((eachPlayer) => localToResponseObject(eachPlayer))
  );
});

// getting particular player Details

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `
        SELECT * 
        FROM player_details
        WHERE player_id = ${playerId}`;
  const singlePlayerDetails = await db.get(playerQuery);
  response.send(localToResponseObject(singlePlayerDetails));
});

// updating Player Name

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { player_id, playerName } = request.body;
  const playerUpdateQuery = `
        UPDATE player_details 
        SET 
           player_name = '${playerName}'
        WHERE player_id = ${playerId};`;
  await db.run(playerUpdateQuery);
  response.send("Player Details Updated");
});

const localToResponseObjectTwo = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//getting Particular match Details

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `
        SELECT *  
        FROM match_details
        WHERE match_id = ${matchId};`;
  const matchDetails = await db.get(matchQuery);
  response.send(localToResponseObjectTwo(matchDetails));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const matchQuery = `
        SELECT 
             *
        FROM match_details JOIN player_match_score
            ON match_details.match_id = player_match_score.match_id
        WHERE player_match_score.player_id = ${playerId};`;
  const matchDetails = await db.all(matchQuery);
  response.send(
    matchDetails.map((eachMatch) => localToResponseObjectTwo(eachMatch))
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `
        SELECT *
        FROM player_details JOIN player_match_score
            ON player_details.player_id = player_match_score.player_id
        WHERE player_match_score.match_id = ${matchId};`;
  const matchDetails = await db.all(matchQuery);
  response.send(
    matchDetails.map((eachPlayer) => localToResponseObject(eachPlayer))
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playersFullDetailsQuery = `
        SELECT 
            player_id AS playerId,
            player_name AS playerName,
            SUM(score)  AS score,
            SUM(fours) AS fours,
            SUM(sixes) AS sixes
        FROM player_details JOIN player_match_score
        ON player_details.player_id = player_match_score.player_id
            
        WHERE player_details.player_id = ${playerId};`;
  const playerFullDetails = await db.get(playersFullDetailsQuery);
  response.send(playerFullDetails);
});

module.exports = app;
