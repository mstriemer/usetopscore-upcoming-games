const EVENTS_URL = 'https://mods.usetopscore.com/api/events';
const TEAMS_URL = 'https://mods.usetopscore.com/api/teams';
const GAMES_URL = 'https://mods.usetopscore.com/api/games?order_by=start_date%20desc&min_date=2015-10-29';
const FIELDS_URL = 'https://mods.usetopscore.com/api/fields';

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

function teamsForEvent(eventId) {
  var url = TEAMS_URL + `?event_id=${eventId}`;
  return fetch(url).then(as_json).then((response) => {
    let perPage = Object.keys(response.result).length;
    let count = response.count;
    let pages = count === 0 ? 0 : Math.ceil(count / perPage);
    let teamRequests = [response];
    for (var i = 1; i < pages; i++) {
      teamRequests.push(fetch(url + `&page=${i + 1}`).then(as_json));
    }
    return Promise.all(teamRequests).then((teamData) => {
      return sorted(teamData.reduce((all, response) => {
        let teams = response.result;
        return all.concat(Object.keys(teams).map((id) => teams[id]));
      }, []));
    });
  });
}

function upcomingGamesForTeam(teamId) {
  var url = GAMES_URL + `&team_id=${teamId}`;
  return fetch(url).then(as_json).then((response) => {
    return Object.keys(response.result).map((gameId) => {
        return response.result[gameId];
    });
  });
}

function fieldInfo(eventId, fieldId) {
  var url = FIELDS_URL + `?event_id=${eventId}`;
  return fetch(url).then(as_json).then((response) => {
    return response.result[fieldId];
  });
}

function createSelect({ id, options, changeHandler, selectedValue }) {
  let select = document.getElementById(id);
  if (!select) {
    select = document.createElement('select');
    select.id = id;
    select.addEventListener('change', changeHandler);
    document.body.appendChild(select);
  } else {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  }
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

function showEvents() {
  let selectedId = localStorage.getItem('selected-event');
  currentEvents().then((events) => {
    createSelect({
      id: 'event-selector',
      options: events,
      changeHandler: (e) => {
        localStorage.setItem('selected-event', e.target.value);
        showTeamsFor(e.target.value);
      },
      selectedValue: selectedId,
    });
  });
  if (selectedId) {
    showTeamsFor(selectedId);
  }
}


function showTeamsFor(eventId) {
  let selectedId = localStorage.getItem('selected-team');
  teamsForEvent(eventId).then((teams) => {
    let select = createSelect({
      id: 'team-selector',
      options: teams,
      changeHandler: (e) => {
        localStorage.setItem('selected-team', e.target.value);
        showNextGameFor(e.target.value,
                        e.target.getAttribute('data-event-id'));
      },
      selectedValue: selectedId,
    });
    // Set this on the select so that it can be used in the handler. The
    // handler is only registered once so it would always get the event that
    // was set when it was first registered.
    select.setAttribute('data-event-id', eventId);
  });
  if (selectedId) {
    showNextGameFor(selectedId, eventId);
  }
}

function showNextGameFor(teamId, eventId) {
  upcomingGamesForTeam(teamId).then((games) => {
    let game = games[0];
    let el = document.getElementById('upcoming-games');
    if (game) {
      el.textContent = 'Loading field data...';
      fieldInfo(eventId, game.field_id).then((field) => {
        el.textContent = `Your next game is on ${game.start_date} at ${game.start_time} on ${field.name} - ${game.field_number}`;
      });
    } else {
      el.textContent = 'You have no upcoming games.'
    }
  });
}

showEvents();
