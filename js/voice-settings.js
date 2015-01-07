var voices = [];
var voice;

function defaultVoice() {
  return voices.filter(voice => voice.default)[0] || voices[0];
}

function getVoices(renderer) {
  (function run() {
    voices = speechSynthesis.getVoices();
    if(voices.length > 0) {
      voice = defaultVoice();
      renderer.render();
    } else {
      setTimeout(run, 100);
    }
  }());
}

function setVoice() {
  voice = voices[this.getDOMNode().value];
}

module.exports = {

  init: getVoices,

  applySettings: message => {
    if(voice) message.voice = voice;
    return message;
  },

  render: () => (
    <select onChange={setVoice}>
      {voices.map((voice, id) => (<option value={id}>{voice.name}</option>))}
    </select>
  )

};
