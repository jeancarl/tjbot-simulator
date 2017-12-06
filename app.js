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

var cfenv = require("cfenv");
var appEnv = cfenv.getAppEnv()
var express = require("express");
var bodyParser = require("body-parser");
var app = express();

app.use(express.static("public"));
app.use(bodyParser({limit: "50mb"}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

function getTTSToken(creds) {
  return new Promise((resolve, reject) => {
    var watson = require("watson-developer-cloud");

    var authorization = new watson.AuthorizationV1({
      username: creds.username,
      password: creds.password,
      url: watson.TextToSpeechV1.URL
    });

    authorization.getToken(function (err, token) {
      if(!token) {
        reject({err:err});
      } else {
        const TextToSpeechV1 = require("watson-developer-cloud/text-to-speech/v1");
        const textToSpeech = new TextToSpeechV1(
          {
            username: creds.username,
            password: creds.password
          }
        );

        textToSpeech.voices({}, function(err, voices) {
          if(err) {
            reject({err:err});
          }
          resolve({token:token,voices:voices});
        });
      }
    });
  });
}

function getSSTToken(creds) {
  return new Promise((resolve, reject) => {
    var watson = require("watson-developer-cloud");

    var authorization = new watson.AuthorizationV1({
      username: creds.username,
      password: creds.password,
      url: watson.SpeechToTextV1.URL
    });

    authorization.getToken(function (err, token) {
      if (!token) {
        reject({err:err});
      } else {
        resolve({token:token});
      }
    });
  });
}

/**
 * Text-to-Speech and Speech-to-Text token facilitator
 *
 * @param {string} creds.username username of the Watson TTS or STT service
 * @param {string} creds.password password of the Watson TTS or STT service
 */
app.post("/api/get_token", function(req, res) {
  switch(req.body.type) {
    case "tts":
      getTTSToken({
        username: req.body.creds.username,
        password: req.body.creds.password
      }).then(result => {
        res.send({tts: result.token, voices: result.voices});
      });
    break;
    case "stt":
      getSSTToken({
        username: req.body.creds.username,
        password: req.body.creds.password
      }).then(token => {
        res.send({stt: token.token});
      });
    break;
  }
})

/**
 * Watson Tone Analyzer service facilitator
 *
 * @param {string} creds.username username of the Watson Tone Analyzer service
 * @param {string} creds.password password of the Watson Tone Analyzer service
 * @param {string} text text to analyze for emotion
 */
app.post("/api/analyze_tone", function(req, res) {
  try {
    if(!req.body.creds || typeof req.body.creds !== "object") {
      throw new Error("Missing required parameters: creds");
    }

    if(!req.body.creds.username || typeof req.body.creds.username !== "string" || req.body.creds.username.length == 0) {
      throw new Error("Missing required parameter: username");
    }

    if(!req.body.creds.password || typeof req.body.creds.password !== "string" || req.body.creds.password.length == 0) {
      throw new Error("Missing required parameter: password");
    }

    if(!req.body.text || typeof req.body.text !== "string" || req.body.text.length == 0) {
      throw new Error("Missing required parameter: text");
    }

    const ToneAnalyzerV3 = require("watson-developer-cloud/tone-analyzer/v3");
    const tone_analyzer = new ToneAnalyzerV3({
      username: req.body.creds.username,
      password: req.body.creds.password,
      version_date: "2016-05-19"
    });

    tone_analyzer.tone({ text: req.body.text }, function(err, tone) {
      if(err) {
        throw new Error(err.toString());
      } else {
        res.send(tone);
      }
    });
  } catch(e) {
    res.send({"err": e.toString()});
  }
});

/**
 * Watson Language Translator (translate) service facilitator
 *
 * @param {string} creds.username username of the Language Translator service
 * @param {string} creds.password password of the Language Translator service
 * @param {string} sourceLanguage language code representing language text is translated from
 * @param {string} targetLanguage language code representing language text is translated to
 * @param {string} text text to translate for emotion
 */
app.post("/api/translate", function(req, res) {
  try {
    if(!req.body.creds || typeof req.body.creds !== "object") {
      throw new Error("Missing required parameters: creds");
    }

    if(!req.body.creds.username || typeof req.body.creds.username !== "string" || req.body.creds.username.length == 0) {
      throw new Error("Missing required parameter: username");
    }

    if(!req.body.creds.password || typeof req.body.creds.password !== "string" || req.body.creds.password.length == 0) {
      throw new Error("Missing required parameter: password");
    }

    if(!req.body.text || typeof req.body.text !== "string" || req.body.text.length == 0) {
      throw new Error("Missing required parameter: text");
    }

    if(!req.body.sourceLanguage || typeof req.body.sourceLanguage !== "string" || req.body.text.sourceLanguage == 0) {
      throw new Error("Missing required parameter: sourceLanguage");
    }

    if(!req.body.targetLanguage || typeof req.body.targetLanguage !== "string" || req.body.text.targetLanguage == 0) {
      throw new Error("Missing required parameter: targetLanguage");
    }

    const LanguageTranslatorV2 = require("watson-developer-cloud/language-translator/v2");
    const language_translator = new LanguageTranslatorV2({
      username: req.body.creds.username,
      password: req.body.creds.password,
      url: "https://gateway.watsonplatform.net/language-translator/api"
    });

    language_translator.translate(
      {
        text: req.body.text,
        source: req.body.sourceLanguage,
        target: req.body.targetLanguage
      },
      function(err, translation) {
        if(err) {
          res.send({"err": err.toString()});
        } else {
          res.send(translation);
        }
      }
    );
  } catch(e) {
    res.send({"err": e.toString()});
  }
});

/**
 * Watson Language Translator (Identification) service facilitator
 *
 * @param {string} creds.username username of the Language Translator service
 * @param {string} creds.password password of the Language Translator service
 * @param {string} text text to identify language
 */
app.post("/api/identifyLanguage", function(req, res) {
  try {
    if(!req.body.creds || typeof req.body.creds !== "object") {
      throw new Error("Missing required parameters: creds");
    }

    if(!req.body.creds.username || typeof req.body.creds.username !== "string" || req.body.creds.username.length == 0) {
      throw new Error("Missing required parameter: username");
    }

    if(!req.body.creds.password || typeof req.body.creds.password !== "string" || req.body.creds.password.length == 0) {
      throw new Error("Missing required parameter: password");
    }

    if(!req.body.text || typeof req.body.text !== "string" || req.body.text.length == 0) {
      throw new Error("Missing required parameters: text");
    }

    const LanguageTranslatorV2 = require("watson-developer-cloud/language-translator/v2");
    const language_translator = new LanguageTranslatorV2({
      username: req.body.creds.username,
      password: req.body.creds.password,
      url: "https://gateway.watsonplatform.net/language-translator/api"
    });

    language_translator.identify(
      {
        text: req.body.text
      },
      function(err, translation) {
        if(err) {
          res.send({err:err.toString()});
        } else {
          res.send(translation);
        }
      }
    );
  } catch(e) {
    res.send({"err": e.toString()});
  }
});

/**
 * Watson Conversation service facilitator
 *
 * @param {string} creds.username username of the Conversation service
 * @param {string} creds.password password of the Conversation service
 * @param {string} workspace_id workspace ID from the Conversation service
 * @param {string} input.text text to analyze with Conversation service
 * @param {Object} context context object to use when calling service
 * @param {string} text text to translate for emotion
 */
app.post("/api/converse", function(req, res) {
  try {
    if(!req.body.creds || typeof req.body.creds !== "object") {
      throw new Error("Missing required parameters: creds");
    }

    if(!req.body.creds.username || typeof req.body.creds.username !== "string" || req.body.creds.username.length == 0) {
      throw new Error("Missing required parameter: username");
    }

    if(!req.body.creds.password || typeof req.body.creds.password !== "string" || req.body.creds.password.length == 0) {
      throw new Error("Missing required parameter: password");
    }

    if(!req.body.workspace_id || typeof req.body.workspace_id !== "string" || req.body.workspace_id.length == 0) {
      throw new Error("Missing required parameter: workspace_id");
    }

    if(!req.body.input || typeof req.body.input !== "object" || !req.body.input.text || typeof req.body.input.text !== "string" || req.body.input.text.length == 0) {
      throw new Error("Missing required parameter: text");
    }

    if(!req.body.context || typeof req.body.context !== "object") {
      throw new Error("Missing parameter object: context");
    }

    const watson = require("watson-developer-cloud");
    const conversation = new watson.ConversationV1({
      username: req.body.creds.username,
      password: req.body.creds.password,
      version_date: watson.ConversationV1.VERSION_DATE_2017_04_21
    });

    const payload = {
      workspace_id: req.body.workspace_id,
      input: {
        text: req.body.input.text
      },
      context: req.body.context
    };

    conversation.message(payload, function(err, data) {
      if(err) {
        res.send({"err": err.toString()});
      } else {
        res.send(data);
      }
    })
  } catch(e) {
    res.send({"err": e.toString()});
  }
});

/**
 * Watson Visual Recognition service facilitator
 * 
 * @param {string} creds.api_key API key of the Visual Recognition service
 * @param {string} image base64 encoded PNG image
 */
app.post("/api/see", function(req, res) {
  try {
    if(!req.body.creds || typeof req.body.creds !== "object") {
      throw new Error("Missing required parameters: creds");
    }

    if(!req.body.creds.api_key || typeof req.body.creds.api_key !== "string" || req.body.creds.api_key.length == 0) {
      throw new Error("Missing required parameter: api_key");
    }

    const VisualRecognitionV3 = require("watson-developer-cloud/visual-recognition/v3");
    const fs = require("fs");
    const visual_recognition = new VisualRecognitionV3({
      api_key: req.body.creds.api_key,
      version_date: VisualRecognitionV3.VERSION_DATE_2016_05_20
    });

    var tempFile = "./"+Math.random()+".png";

    var image = new Buffer(req.body.image.replace(/^data:image\/png;base64,/,""), "base64");
    fs.writeFile(tempFile, image,  "binary",function(err) {
      const params = {
        images_file: fs.createReadStream(tempFile)
      };

      visual_recognition.classify(params, function(err, response) {
        fs.unlinkSync(tempFile);
        if(err) {
          res.send({err: err.toString()});
        } else {
          res.send(response.images[0].classifiers[0].classes);
        }
      });
    });
  } catch(e) {
    res.send({"err": e.toString()});
  }
});


/**
 * Watson Discovery (news query) service facilitator
 * 
 * @param {string} creds.username username of the Discovery service
 * @param {string} creds.password password of the Discovery service
 * @param {string} params.environment_id environment_id to search
 * @param {string} params.collection_id collection_id to search
 * @param {Object} params parameters to pass to the query endpoint
 */
app.post("/api/discovery/query", function(req, res) {
  try {
    if(!req.body.creds || typeof req.body.creds !== "object") {
      throw new Error("Missing required parameters: creds");
    }

    if(!req.body.creds.username || typeof req.body.creds.username !== "string" || req.body.creds.username.length == 0) {
      throw new Error("Missing required parameter: username");
    }

    if(!req.body.creds.password || typeof req.body.creds.password !== "string" || req.body.creds.password.length == 0) {
      throw new Error("Missing required parameter: password");
    }

    const DiscoveryV1 = require("watson-developer-cloud/discovery/v1");
    var discovery = new DiscoveryV1({
      username: req.body.creds.username,
      password: req.body.creds.password,
      version_date: "2017-09-01"
    });

    var params = req.body.params;
    discovery.query(params, function(err, data) {
      if(err) {
        res.send({err: err.toString()});
      } else {
        res.json(data);
      }
    });
  } catch(e) {
    res.send({"err": e.toString()});
  }
});

/********************************
Ports
********************************/
app.listen(appEnv.port, appEnv.bind, function() {
  console.log("Node server running on " + appEnv.url);
});
