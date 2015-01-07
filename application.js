(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

window.onload = connect;
window.onbeforeunload = disconnect;

var socket;
var voice = require("./voice-settings");
var log = logger(renderer());
console.log(voice);
var __splice = Array.prototype.splice;

voice.init(renderer());

function connect() {
  log("Connecting", "...");
  var request = new XMLHttpRequest();
  request.open("GET", "https://slack.com/api/rtm.start?token=" + token(), true);
  request.onload = setupWebSocket;
  request.send(null);
}

function setupWebSocket(event) {
  var response = JSON.parse(event.target.responseText);
  socket = new WebSocket(response.url);
  socket.onopen = log("Connected");
  socket.onclose = log("Disconnected");
  socket.onmessage = handleMessage(find(response.users), find(response.channels));
  speak("Connected")();
}

function handleMessage(users, channels) {
  return function handler(event) {
    var data = JSON.parse(event.data);
    if (data.type === "message") {
      var channel = channels(data.channel) || { name: "Direct Message" };
      var user = users(data.user) || { real_name: "Unknown" };
      var message = [channel.name, username(user), data.text].join(", ");
      message = message.replace(/<@([^>]+)>/g, function (match, id) {
        return username(users(id));
      });
      log("Message", message);
      setTimeout(speak(message), 0);
    }
  };
}

function disconnect() {
  speechSynthesis.cancel();
  speak("Disconnecting")();
  if (socket) {
    socket.close();
    socket = null;
  }
}

function speak(message) {
  return function () {
    speechSynthesis.speak(voice.applySettings(new SpeechSynthesisUtterance(message)));
  };
}

function token() {
  var token = location.search.substr(1).split(/&/).reduce(function (params, param) {
    param = param.split(/=/);
    params[param[0]] = param[1];
    return params;
  }, {}).token;
  if (!token) {
    token = prompt("Please provide your slack api token (https://api.slack.com/web#auth)");
    location.search = "?token=" + token;
  }
  return token;
}

function username(user) {
  return user.real_name || user.name;
}

function find(collection) {
  return function (id) {
    return collection.filter(function (x) {
      return x.id === id;
    })[0];
  };
}

function logger(renderer) {
  return function log(description) {
    if (arguments.length == 1) {
      return logger;
    } else {
      return logger.apply(this, __splice.call(arguments, 1));
    }

    function logger() {
      renderer.add(description, __splice.call(arguments, 0).map(function (arg) {
        return arg.toString();
      }).join(", "));
      console.log.apply(console, [description].concat(arguments));
    };
  };
}

function renderer(logs) {
  logs = logs || [];

  render();

  return (renderer = function () {
    return {

      add: function (title, log) {
        logs.push({ title: title, text: log });
        render();
      },

      render: render

    };
  })();

  function render() {
    React.render(React.createElement("div", {
      className: "container"
    }, voice.render(), logs.map(function (log) {
      return React.createElement("div", {
        className: "alert alert-info"
      }, React.createElement("strong", null, log.title), " ", log.text);
    })), document.body);
  }
}

},{"./voice-settings":2}],2:[function(require,module,exports){
"use strict";

var voices = [];
var voice;

function defaultVoice() {
  return voices.filter(function (voice) {
    return voice["default"];
  })[0] || voices[0];
}

function getVoices(renderer) {
  (function run() {
    voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      voice = defaultVoice();
      renderer.render();
    } else {
      setTimeout(run, 100);
    }
  })();
}

function setVoice() {
  voice = voices[this.getDOMNode().value];
}

module.exports = {

  init: getVoices,

  applySettings: function (message) {
    if (voice) message.voice = voice;
    return message;
  },

  render: function () {
    return React.createElement("select", {
      onChange: setVoice
    }, voices.map(function (voice, id) {
      return React.createElement("option", {
        value: id
      }, voice.name);
    }));
  }

};

},{}]},{},[1]);
