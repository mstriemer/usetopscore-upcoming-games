const TEAMS_STORAGE_KEY = 'upcoming-games-selected-teams';
const FIELDS_STORAGE_KEY = 'upcoming-games-fields';

function createStore(dispatcher, name) {
  let store = {
    subscribers: [],
    dispatch(payload) {
      let newState = dispatcher(store.state, payload);
      if (newState !== store.state) {
        store.state = newState;
        store.notify(newState);
      }
    },
    subscribe(listener) {
      store.subscribers.push(listener);
    },
    notify(state) {
      for (let subscriber of store.subscribers) {
        subscriber(state);
      }
    },
    plugin(app) {
      app.set(name, store.state);
      store.subscribe((data) => {
        app.set(name, data);
      });
    },
  };
  store.dispatch({type: 'INIT'});
  return store;
}

function loadJSON(key, notFound) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return notFound;
  }
}

function teams(state=null, action) {
  if (state === null) {
    state = loadJSON(TEAMS_STORAGE_KEY, []);
  }
  switch (action.type) {
  case 'SELECT':
    for (let team of state) {
      if (team.id === action.team.id &&
          team.eventId === action.team.eventId) {
        return;
      }
    }
    return [action.team].concat(state);
  case 'REMOVE':
    let newState = state.filter((team) => {
      return !(team.id === action.team.id &&
               team.eventId === action.team.eventId);
    });
    return newState.length < state.length ? newState : state;
  case 'INIT':
    return state;
  }
}

export let teamStore = createStore(teams, 'teams');
teamStore.subscribe((teams) => {
  localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
});

function games(state=null, action) {
  switch (action.type) {
  case 'SET':
    return action.games;
  case 'INIT':
    return [];
  }
}

export let gameStore = createStore(games, 'games');
