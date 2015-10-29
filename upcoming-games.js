var EVENTS_URL = 'https://mods.usetopscore.com/api/events';
var TEAMS_URL = 'https://mods.usetopscore.com/api/teams';

function as_json(response) {
  return response.json();
}

function currentEvents() {
  return fetch(EVENTS_URL).then(as_json).then((response) => {
      return Object.keys(response.result).map((eventId) => {
          return response.result[eventId];
      });
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
      return teamData.reduce((all, response) => {
        let teams = response.result;
        return all.concat(Object.keys(teams).map((id) => teams[id]));
      }, []);
    });
  });
}

function createSelect(id, results) {
  let select = document.getElementById(id);
  if (!select) {
    select = document.createElement('select');
    select.id = id;
    document.body.appendChild(select);
  } else {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  }
  for (let result of results) {
    let option = document.createElement('option');
    option.value = result.id;
    option.textContent = result.name;
    select.appendChild(option);
  }
  select.addEventListener('change', (e) => {
    showTeamsFor(e.target.value);
  });
  return select;
}

function showEvents() {
  currentEvents().then((events) => {
    createSelect('event-selector', events);
  })
}


function showTeamsFor(eventId) {
  teamsForEvent(eventId).then((teams) => {
    createSelect('team-selector', teams);
  });
}

showEvents();
