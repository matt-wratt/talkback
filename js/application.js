window.onload = connect;
window.onbeforeunload = disconnect;

var socket;
var log = logger(renderer());
var __splice = Array.prototype.splice;

function connect() {
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
  socket.onmessage = handleMessage(response.users, response.channels);
}

function handleMessage(users, channels) {
  return function handler(event) {
    var data = JSON.parse(event.data);
    if(data.type === 'message') {
      var channel = channels.filter(channel => channel.id === data.channel)[0] || {name: 'Direct Message'};
      var user = users.filter(user => user.id === data.user)[0];
      var message = [channel.name, user.real_name, data.text].join(', ');
      log('Message', message);
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
    }
  };
}

function disconnect() {
  if(socket) {
    socket.close();
    socket = null;
  }
}

function token() {
  return location.search.substr(1).split(/&/).reduce((params, param) => {
    param = param.split(/=/);
    params[param[0]] = param[1];
    return params;
  }, {}).token || prompt('Please provide your slack api token (https://api.slack.com/web#auth)');
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

  return {
    add: (title, log) => {
      logs.push({title: title, text: log});
      render();
    }
  };

  function render() {
    React.render((
      <div className="container">{logs.map(log => (<div className="alert alert-info"><strong>{log.title}</strong> {log.text}</div>))}</div>
    ), document.body);
  }
}
