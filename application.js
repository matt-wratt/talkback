(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

window.onload = connect;
window.onbeforeunload = disconnect;

var socket;
var log = logger(renderer());
var __splice = Array.prototype.splice;

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
      var message = [channel.name, user.real_name, data.text].join(", ");
      message = message.replace(/<@([^>]+)>/g, function (match, id) {
        return users(id).real_name;
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
    speechSynthesis.speak(new SpeechSynthesisUtterance(message));
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

  return {
    add: function (title, log) {
      logs.push({ title: title, text: log });
      render();
    }
  };

  function render() {
    React.render(React.createElement("div", {
      className: "container"
    }, logs.map(function (log) {
      return React.createElement("div", {
        className: "alert alert-info"
      }, React.createElement("strong", null, log.title), " ", log.text);
    })), document.body);
  }
}

},{}]},{},[1]);
