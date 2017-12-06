/**
 ****************************************************************************
 * Copyright 2017 IBM
 *
 *   TJBot Node.JS Simulator
 *
 *   By JeanCarl Bisson (@dothewww)
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 ****************************************************************************
*/

function TJBot(hardware, configuration, credentials) {
  this.hardware = hardware;
  this.configuration = configuration;
  this.credentials = credentials;
  this._conversationContext = {};
  this._sttStream = null;
  this._ttsVoices = [];
  if(this.hardware.indexOf("camera") !== -1) {
    this._setupCamera = new Promise((resolve, reject) => {
        var v = document.getElementById("videoElement");
        if(!v) {
          $("#cameratab").append('<video autoplay id="videoElement" width="100" height="75"></video><canvas id="canvas" width="200" height="150" style="display:none"></canvas>');
          var v = document.getElementById("videoElement");
          v.ready = false;
          // check for getUserMedia support
          //navigator.getUserMedia = navigator.mediaDevices.getUserMedia;// || navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;


          if (navigator.mediaDevices.getUserMedia) {
              // get webcam feed if available
              navigator.mediaDevices.getUserMedia({video: true,audio:false}).then((stream) => {
              // if found attach feed to video element
                v.src = window.URL.createObjectURL(stream);
                setTimeout(() => {
                  resolve();
                },500);

            }).catch(e => {
              // no webcam found - do something
              console.log(e);
            });
          }
          else
          {
            reject("browser not support");
          }
        } else {
          resolve();
        }
      });
  }

  var self = this;

  if(this.hardware.indexOf("camera") != -1) {
    this._setupCamera;
  }
}

TJBot.prototype._assertCapability = function(capability) {
  switch (capability) {
    case "analyze_tone":
      if(!this.credentials.tone_analyzer) {
        throw new Error(
          "TJBot is not configured to analyze tone. " +
          "Please check that you included credentials for the Watson Tone Analyzer service.");
        }
    break;
    case "converse":
      if(!this.credentials.conversation) {
        throw new Error("TJBot is not configured to converse. Please check that you included credentials for the Watson \"conversation\" service in the TJBot constructor.");
      }
    break;
    case "listen":
      if(this.hardware.indexOf("microphone") == -1) {
        throw new Error("TJBot is not configured to listen. Please check you included the \"microphone\" hardware in the TJBot constructor.");
      }

      if(!this.credentials.speech_to_text) {
        throw new Error("TJBot is not configured to listen. Please check that you included credentials for the Watson \"speech_to_text\" service in the TJBot constructor.");
      }
    break;
    case "see":
      if(this.hardware.indexOf("camera") == -1) {
        throw new Error("TJBot is not configured to see. Please check you included the \"camera\" hardware in the TJBot constructor.");
      }

      if(!this.credentials.visual_recognition) {
        throw new Error("TJBot is not configured to see. Please check you included credentials for the Watson \"visual_recognition\" service in the TJBot constructor.");
      }
    break;
    case "shine":
      if(this.hardware.indexOf("led") == -1) {
        throw new Error("TJBot is not configured with an LED. Please check you included the \"led\" hardware in the TJBot constructor.");
      }
    break;
    case "speak":
      if(this.hardware.indexOf("speaker") == -1) {
        throw new Error("TJBot is not configured to speak. Please check you incldued the \"speaker\" hardware in the TJBot constructor.");
      }

      if(!this.credentials.text_to_speech) {
        throw new Error("TJBot is not configured to speak. Please check you included credentials for the Watson \"text_to_speech\" service in the TJBot constructor.");
      }
    break;

    case "translate":
      if(!this.credentials.language_translator) {
        throw new Error("TJBot is not configured to translate. Please check you included credentials for the Watson \"language_translator\" service in the TJBot constructor.");
      }
    break;

    case "wave":
      if(this.hardware.indexOf("servo") == -1) {
        throw new Error("TJBot is not configured with an arm. Please check you included the \"servo\" hardware in the TJBot constructor.");
      }
    break;
  }
}

TJBot.prototype.analyzeTone = function(text) {
  this._assertCapability("analyze_tone");

  return $.post({
    url: "/api/analyze_tone",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      creds: {
        username: this.credentials.tone_analyzer.username,
        password: this.credentials.tone_analyzer.password
      },
      text: text
    })
  })
}

TJBot.prototype.raiseArm = function(text) {
  this._assertCapability("wave");
}

TJBot.prototype.lowerArm = function(text) {
  this._assertCapability("wave");
}

TJBot.prototype.converse = function(workspaceId, message, callback) {
  this._assertCapability("converse");

  // capture context
  var self = this;
  var context = (self._conversationContext[workspaceId] != undefined) ? self._conversationContext[workspaceId] : {};

  $.post({
    url: "/api/converse",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      creds: {
        username: this.credentials.conversation.username,
        password: this.credentials.conversation.password
      },
      workspace_id: workspaceId,
      input: {
          "text": message
      },
      context: context
    })
  }).then(function(conversationResponseObject) {
    self._conversationContext[workspaceId] = conversationResponseObject.context;

    if(conversationResponseObject.err) {
      callback(conversationResponseObject);
    } else {
      // return the response object and response text
      var responseText = conversationResponseObject.output.text.length > 0 ? conversationResponseObject.output.text[0] : "";
      var response = {
          "object": conversationResponseObject,
          "description": responseText
      };
      callback(response);
    }

  });
}

TJBot.prototype.identifyLanguage = function(text) {
  this._assertCapability("translate");

  return $.post({
    url: "/api/identifyLanguage",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      creds: {
        username: this.credentials.language_translator.username,
        password: this.credentials.language_translator.password
      },
      text: text
    })
  })
}

TJBot.prototype.listen = function(cb) {
  this._assertCapability("listen");
  
  var self = this;

  function run() {
    // If already listening, stop this stream before we create a new one.
    if(self._sttStream) {
      self._sttStream.stop();
    }

    self._sttStream = WatsonSpeech.SpeechToText.recognizeMicrophone({
      token: self.credentials.speech_to_text.token,
      object_mode: false
    });

    self._sttStream.on("data", function(data) {
      if(self._sttStream) {
        cb(data.toString());
      }
    });

    self._sttStream.on("error", function(err) {
        throw err;
    });
  }

  if(self.credentials.speech_to_text.token == undefined) {
    $.post({
      url: "/api/get_token",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        type: "stt",
        creds: {
          username: self.credentials.speech_to_text.username,
          password: self.credentials.speech_to_text.password
        }
      })
    }).then(function(response) {
      self.credentials.speech_to_text.token = response.stt;
      run();
    })
  } else {
    run();
  }
}

TJBot.prototype.shine = function(color) {
  this._assertCapability("shine");
}

TJBot.prototype.speak = function(text) {
  this._assertCapability("speak");

  var self = this;

  return new Promise((resolve, reject) => {
    function run() {
      var voice = "en-US_MichaelVoice";

      // check to see if the user has specified a voice
      if (self.configuration.speak.voice != undefined) {
        voice = self.configuration.speak.voice;
      } else {
        // choose a voice based on robot.gender and speak.language
        // do this each time just in case the user changes robot.gender or
        // speak.language during execution
        for (var i in self._ttsVoices) {
          if (self._ttsVoices[i]["language"] == self.configuration.speak.language &&
            self._ttsVoices[i]["gender"] == self.configuration.robot.gender) {
            voice = self._ttsVoices[i]["name"];
            break;
          }
        }
      }

      var audioelement = WatsonSpeech.TextToSpeech.synthesize({
        text: text,
        token: self.credentials.text_to_speech.token,
        voice: voice
      });

      audioelement.onended = function() {
          resolve();
      }
    }

    if(self.credentials.text_to_speech.token == undefined) {
      $.post({
        url: "/api/get_token",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
          type: "tts",
          creds: {
            username: self.credentials.text_to_speech.username,
            password: self.credentials.text_to_speech.password
          }
        })
      }).then(function(response) {
        self.credentials.text_to_speech.token = response.tts;
        self._ttsVoices = response.voices.voices;
        run();
      })
    } else {
      run();
    }
  });
}

TJBot.prototype.takePhoto = function(cb) {
  var v = document.getElementById("videoElement");

  canvas = document.getElementById("canvas");
  context = canvas.getContext("2d");
  w = canvas.width;
  h = canvas.height;

  if(v.paused || v.ended)
    throw new Error("TJBot: Cannot capture photo using webcam");

  context.drawImage(v,0,0,w,h);
  var uri = canvas.toDataURL("image/png");
  $("#cameratab").append('<img src="'+uri+'" />');
  cb(uri);
}


TJBot.prototype.see = function(cb) {
  this._assertCapability("see");

  this._setupCamera.then(() => {
    var v = document.getElementById("videoElement");
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
    w = canvas.width;
    h = canvas.height;

    context.drawImage(v,0,0,w,h);
    var uri = canvas.toDataURL("image/png");
    return $.post({
      url: "/api/see",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        creds: {
          api_key: this.credentials.visual_recognition.api_key
        },
        image: uri
      })
    }).done(cb);
  });
}

TJBot.prototype.shineColors = function() {
    return ["red", "green", "blue"];
}

TJBot.prototype.stopListening = function() {
  this._assertCapability("listen");

  if(!this._sttStream) return;
  this._sttStream.stop();
  this._sttStream = null;
}

TJBot.prototype.translate = function(text, sourceLanguage, targetLanguage) {
    this._assertCapability("translate");
    return $.post({
      url: "/api/translate",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        creds: {
          username: this.credentials.language_translator.username,
          password: this.credentials.language_translator.password
        },
        text: text,
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage
      })
    })
}

TJBot.prototype.wave = function() {
  this._assertCapability("wave");
}
