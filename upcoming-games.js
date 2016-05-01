import { gameStore, teamStore } from './stores';

window.gameStore = gameStore;

// YYYY-MM-DD is the first 10 chars of a ISO date string.
let today = new Date().toISOString().slice(0, 10);

const API_PREFIX = 'https://mods.usetopscore.com/api';
const EVENTS_URL = `${API_PREFIX}/events`;
const TEAMS_URL = `${API_PREFIX}/teams`;
const GAMES_URL = `${API_PREFIX}/games?order_by=start_date%20asc&min_date=${today}&fields[]=Field`;
const FIELDS_URL = `${API_PREFIX}/fields`;

teamStore.subscribe((teams) => {
  loadGames();
});

export function loadGames() {
  upcomingGames(...teamStore.state).then((games) => {
    gameStore.dispatch({type: 'SET', games});
  });
}

function as_json(response) {
  return response.json();
}

function sorted(things) {
  things.sort((a, b) => a.name > b.name ? 1 : -1);
  return things;
}

function currentEvents() {
  return fetch(EVENTS_URL).then(as_json).then((response) => {
    return sorted(Object.keys(response.result).map((eventId) => {
        return response.result[eventId];
    }));
  });
}

function teamsForEvent(event) {
  var url = TEAMS_URL + `?event_id=${event.id}`;
  return fetch(url).then(as_json).then((response) => {
    let perPage = Object.keys(response.result).length;
    let count = response.count;
    let pages = count === 0 ? 0 : Math.ceil(count / perPage);
    let teamRequests = [response];
    for (var i = 1; i < pages; i++) {
      teamRequests.push(fetch(url + `&page=${i + 1}`).then(as_json));
    }
    return Promise.all(teamRequests).then((teamData) => {
      let teams = sorted(teamData.reduce((all, response) => {
        let teams = response.result;
        return all.concat(Object.keys(teams).map((id) => teams[id]));
      }, []));
      teams.forEach((team) => {
        team.eventId = event.id;
        team.event = event;
      });
      return teams;
    });
  });
}

function upcomingGames(...teams) {
  if (teams.length === 0) return new Promise((resolve) => resolve([]));
  var url = GAMES_URL + teams.map((team) => `&team_id[]=${team.id}`).join('');
  return fetch(url).then(as_json).then((response) => {
    return response.result;
  });
}

function fieldInfo(eventId, fieldId) {
  var url = FIELDS_URL + `?event_id=${eventId}`;
  return fetch(url).then(as_json).then((response) => {
    return response.result[fieldId];
  });
}

function createSelect({ id, options, changeHandler, selectedValue }) {
  let oldSelect = document.getElementById(id);
  let select = document.createElement('select');
  if (oldSelect) {
    document.body.insertBefore(select, oldSelect);
    document.body.removeChild(oldSelect);
  } else {
    document.body.appendChild(select);
  }
  select.id = id;
  select.addEventListener('change', changeHandler);
  let option = document.createElement('option');
  option.disabled = true;
  option.selected = true;
  option.textContent = 'Please choose';
  select.appendChild(option);
  for (let result of options) {
    let option = document.createElement('option');
    option.value = result.id;
    option.textContent = result.name;
    if (option.value === selectedValue) {
      option.selected = true;
    }
    select.appendChild(option);
  }
  return select;
}

export function showEvents() {
  currentEvents().then((events) => {
    let label = document.createElement('label');
    label.textContent = 'Add a team: ';
    document.body.appendChild(label);
    createSelect({
      id: 'event-selector',
      options: events,
      changeHandler: (e) => {
        let eventId = parseInt(e.target.value, 10);
        for (let event of events) {
          if (event.id === eventId) {
            showTeamsFor(event);
            return;
          }
        }
      },
    });
  });
}

function showTeamsFor(event) {
  teamsForEvent(event).then((teams) => {
    let select = createSelect({
      id: 'team-selector',
      options: teams,
      changeHandler: (e) => {
        let teamId = parseInt(e.target.value, 10);
        for (let team of teams) {
          if (team.id === teamId) {
            teamStore.dispatch({type: 'SELECT', team});
            return;
          }
        }
      },
    });
  });
}

function nextGameFor({ id, eventId }) {
  upcomingGamesForTeam(id).then((games) => {
    return games[0];
  });
}
