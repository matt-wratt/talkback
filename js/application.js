window.onload = connect;
window.onbeforeunload = disconnect;

var socket;
var voice = require('./voice-settings');
var log = logger(renderer());
console.log(voice);
var __splice = Array.prototype.splice;

voice.init(renderer());

function connect() {
  log('Connecting', '...');
  var request = new XMLHttpRequest();
  request.open('GET', 'https://slack.com/api/rtm.start?token=' + token(), true);
  request.onload = setupWebSocket;
  request.send(null);
}

function setupWebSocket(event) {
  var response = JSON.parse(event.target.responseText);
  socket = new WebSocket(response.url);
  socket.onopen = log('Connected');
  socket.onclose = log('Disconnected');
  socket.onmessage = handleMessage(find(response.users), find(response.channels));
  speak('Connected')();
}

function handleMessage(users, channels) {
  return function handler(event) {
    var data = JSON.parse(event.data);
    if(data.type === 'message') {
      var channel = channels(data.channel) || {name: 'Direct Message'};
      var user = users(data.user) || {real_name: 'Unknown'};
      var message = [channel.name, username(user), data.text].join(', ');
      message = message.replace(/<@([^>]+)>/g, (match, id) => username(users(id)));
      log('Message', message);
      setTimeout(speak(message), 0);
    }
  };
}

function disconnect() {
  speechSynthesis.cancel();
  speak('Disconnecting')();
  if(socket) {
    socket.close();
    socket = null;
  }
}

function speak(message) {
  return function() {
    speechSynthesis.speak(voice.applySettings(new SpeechSynthesisUtterance(message)));
  };
}

function token() {
  var token = location.search.substr(1).split(/&/).reduce((params, param) => {
    param = param.split(/=/);
    params[param[0]] = param[1];
    return params;
  }, {}).token;
  if(!token) {
    token = prompt('Please provide your slack api token (https://api.slack.com/web#auth)');
    location.search = '?token=' + token;
  }
  return token;
}

function username(user) {
  return user && (user.real_name || user.name) || 'Unknown';
}

function find(collection) {
  return function(id) {
    return collection.filter(x => x.id === id)[0];
  };
}

function logger(renderer) {
  return function log(description) {
    if(arguments.length == 1) {
      return logger;
    } else {
      return logger.apply(this, __splice.call(arguments, 1));
    }

    function logger() {
      renderer.add(description, __splice.call(arguments, 0).map(arg => arg.toString()).join(', '));
      console.log.apply(console, [description].concat(arguments));
    };
  };
}

function renderer(logs) {
  logs = logs || [];

  render();

  return (renderer = () => ({

    add: (title, log) => {
      logs.push({title: title, text: log});
      render();
    },

    render: render

  }))();

  function render() {
    React.render((
      <div className="container">
        {voice.render()}
        {logs.map(log => (
          <div className="alert alert-info"><strong>{log.title}</strong> {log.text}</div>
        ))}
      </div>
    ), document.body);
  }
}
