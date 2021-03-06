import './bower_components/es6-promise/promise';
import './bower_components/fetch/fetch';
import element from 'virtual-element';
import { render, tree } from 'deku';
import { teamStore, gameStore } from './stores';
import { loadGames, nextGameFor, showEvents } from './upcoming-games';

showEvents();
loadGames();

let TeamSelector = {
  render({ props, state }) {
    return <h1>Upcoming Games</h1>;
  }
}

let UpcomingGame = {
  render({ props, state }) {
    let { team, game } = props;

    function remove() {
      teamStore.dispatch({ type: 'REMOVE', team });
    }

    return <div id={`UpcomingGame-${team.id}`} class="upcoming-game">
      <div class="upcoming-game--team">
        <img src={team.images['40']} width="40" height="40" />
        <h3 title={team.event.name}>{team.name}</h3>
        <button onClick={remove}>Remove</button>
      </div>
    </div>;
  }
}

let UpcomingGames = {
  render({ props, state }) {
    let { teams, games } = props;
    let [game, ...otherGames] = games;
    let gameInfo;
    if (game) {
      gameInfo = <p>Your next game is on {game.start_date} at {game.start_time} on field {game.field_id} {game.field_number}</p>;
    }
    return <div>
      {gameInfo}
      <p>You have {teams.length} teams selected.</p>
      {teams.map((team) => <UpcomingGame team={team} />)}
    </div>;
  }
}

let App = {
  propTypes: {
    games: {source: 'games'},
    teams: {source: 'teams'},
  },
  render({ props, state }) {
    return <div>
      <TeamSelector />
      <UpcomingGames teams={props.teams} games={props.games} />
    </div>;
  }
}

let app = tree(<App />);

app.use(teamStore.plugin);
app.use(gameStore.plugin);

render(app, document.getElementById('app'));
