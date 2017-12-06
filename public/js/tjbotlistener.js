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

function TJBotListener() {
  this.actionPerformed = function(action, data) {
    var myEvent = new CustomEvent(action);
    myEvent.data = data;
    document.body.dispatchEvent(myEvent);
  }

  var tjbotFunctions = {};
  var self = this;

  tjbotFunctions["wave"] = TJBot.prototype.wave;
  TJBot.prototype.wave = function() {
    var result = tjbotFunctions["wave"].call(this, arguments);
    self.actionPerformed("tjbot.wave", {});
    return result;
  }

  tjbotFunctions["raiseArm"] = TJBot.prototype.raiseArm;
  TJBot.prototype.raiseArm = function() {
    var result = tjbotFunctions["raiseArm"].call(this, arguments);
    self.actionPerformed("tjbot.raiseArm", {});
    return result;
  }

  tjbotFunctions["lowerArm"] = TJBot.prototype.lowerArm;
  TJBot.prototype.lowerArm = function() {
    var result = tjbotFunctions["lowerArm"].call(this, arguments);
    self.actionPerformed("tjbot.lowerArm", {});
    return result;
  }  

  tjbotFunctions["listen"] = TJBot.prototype.listen;
  TJBot.prototype.listen = function(cb) {
    var result = tjbotFunctions["listen"].call(this, function(text) {
      self.actionPerformed("tjbot.listen", {text:text});
      cb(text);
    });

    return result;
  }

  tjbotFunctions["shine"] = TJBot.prototype.shine;
  TJBot.prototype.shine = function(color) {
    if(arguments[0] == "off") {
      arguments[0] = "grey";
    }

    var result = tjbotFunctions["shine"].call(this, arguments);
    self.actionPerformed("tjbot.shine", {
      color: color
    });
    return result;
  }

  tjbotFunctions["analyzeTone"] = TJBot.prototype.analyzeTone;
  TJBot.prototype.analyzeTone = function(text) {
    return new Promise((resolve, reject) => {
      tjbotFunctions["analyzeTone"].call(this, text).then(result => {
        self.actionPerformed("tjbot.analyzeTone", {
          text: text,
          response: result
        });

        if(result.err) {
          console.log(result.err);
          reject(result);
        } else {
          resolve(result);
        }
      }).catch(reject);
    })
  }

  tjbotFunctions["translate"] = TJBot.prototype.translate;
  TJBot.prototype.translate = function(text, sourceLanguage, targetLanguage) {
    return new Promise((resolve, reject) => {
      tjbotFunctions["translate"].call(this, text, sourceLanguage, targetLanguage).then(result => {
        self.actionPerformed("tjbot.translate", {
          text: text,
          sourceLanguage: sourceLanguage,
          targetLanguage: targetLanguage,
          response: result
        });

        if(result.err) {
          console.log(result.err);
          reject(result);
        } else {
          resolve(result);
        }
      }).catch(reject);
    })
  }

  tjbotFunctions["identifyLanguage"] = TJBot.prototype.identifyLanguage;
  TJBot.prototype.identifyLanguage = function(text) {
    return new Promise((resolve, reject) => {
      tjbotFunctions["identifyLanguage"].call(this, text).then(result => {
        self.actionPerformed("tjbot.identifyLanguage", {
          text: text,
          response: result
        });

        if(result.err) {
          console.log(result.err);
        } else {
          resolve(result);
        }
      }).catch(reject);
    })
  }

  tjbotFunctions["converse"] = TJBot.prototype.converse;
  TJBot.prototype.converse = function(workspaceId, message, callback) {
    tjbotFunctions["converse"].call(this, workspaceId, message, function(result) {
      self.actionPerformed("tjbot.converse", {
        message: message,
        workspaceId: workspaceId,
        response: result
      });

      callback(result);
    });

  }

  tjbotFunctions["see"] = TJBot.prototype.see;
  TJBot.prototype.see = function(callback) {
    tjbotFunctions["see"].call(this, function(result) {
      self.actionPerformed("tjbot.see", {
        response: result
      });

      if(result.err) {
        console.log(result.err);
      } else {
        callback(result);
      }
    });
  }

  tjbotFunctions["speak"] = TJBot.prototype.speak;
  TJBot.prototype.speak = function(text) {
    self.actionPerformed("tjbot.before_speak", {
      configuration: this.configuration,
      text: text
    });

    return new Promise((resolve, reject) => {
      tjbotFunctions["tjbot.speak"].call(this, text).then(() => {
        self.actionPerformed("speak", {
          credentials: this.credentials.text_to_speech,
          text: text
        });
        resolve();
      }).catch(reject);
    });
  }

  tjbotFunctions["console.log"] = console.log;
  var logger = document.getElementById("log");
  console.log = function () {
    var myEvent = new CustomEvent("console.log");
    tjbotFunctions["console.log"].apply(this, arguments);
    myEvent.data = {arguments: arguments};
    document.body.dispatchEvent(myEvent);
  }

  tjbotFunctions["watson.discovery.query"] = DiscoveryV1.prototype.query;
  DiscoveryV1.prototype.query = function(params, callback) {
    tjbotFunctions["watson.discovery.query"].call(this, params, function(result) {
      self.actionPerformed("watson.discovery.query", {
        params: params,
        response: result
      });

      if(result.err) {
        console.log(result.err);
      }

      callback(result);
    });
  }
}

TJBotListener.prototype.on = function(action, callback) {
  document.body.addEventListener(action, callback, false);
}
