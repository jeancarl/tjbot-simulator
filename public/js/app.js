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

$().ready(function() {
  // Store the code locally so when we come back/refresh the page, the code still exists.
  var code = localStorage.getItem("code");
  if(code) {
    $("#code").val(code);
  }

  codeEditor = CodeMirror.fromTextArea(document.getElementById("code"), { lineNumbers: true});
  envEditor = CodeMirror.fromTextArea(document.getElementById("envcode"), { mode: "htmlmixed"});

  // The TJBot Listener listens to calls made to the TJBot object and acts as a liasion to the UI.
  var tjbotm = new TJBotListener();

  tjbotm.on("console.log", function(e) {
    for(var i = 0; i < e.data.arguments.length; i++) {
      if(typeof e.data.arguments[i] == "object") {
        $("#log").append("<div>"+JSON.stringify(e.data.arguments[i], undefined, 2)+"</div>");
      } else {
        $("#log").append("<div>"+e.data.arguments[i]+"</div>");
      }
    }
  });

  tjbotm.on("tjbot.wave", function(e) {
    raiseArm();
    setTimeout(lowerArm, 500);
    setTimeout(raiseArm, 1000);
  })

  tjbotm.on("tjbot.lowerArm", lowerArm)
  tjbotm.on("tjbot.raiseArm", raiseArm)
   

  tjbotm.on("tjbot.shine", function(e) {
    $("#led").css("fill", e.data.color);
  });

  tjbotm.on("tjbot.analyzeTone", function(e) {
    addResult("tone-analyzer", e.data.text, [{heading:"Text",body:e.data.text},{heading:"Response",body:e.data.response}]);
  });

  tjbotm.on("tjbot.translate", function(e) {
    addResult("translate", e.data.text, [{heading:"Text",body:e.data.text},{heading:"Response",body:e.data.response}]);
  });

  tjbotm.on("tjbot.converse", function(e) {
    if(e.data.response.err) {
      addResult("converse", e.data.message, [{heading:"Message",body:e.data.message},{heading:"Error",body:e.data.response.err}]);
    } else {
      addResult("converse", e.data.message, [{heading:"Message",body:e.data.message},{heading:"Response",body:e.data.response}]);
    }
  });

  tjbotm.on("tjbot.listen", function(e) {
    addResult("speech-to-text", e.data.text, [{heading:"Text",body:e.data.text}]);
  });

  tjbotm.on("tjbot.see", function(e) {
    addResult("visual-recognition", "untitled", [{heading:"Classes",body:e.data.response}]);
  });

  tjbotm.on("tjbot.identifyLanguage", function(e) {
    addResult("translate", e.data.text, [{heading:"Text",body:e.data.text},{heading:"Languages",body:e.data.response}]);
  });

  tjbotm.on("watson.discovery.query", function(e) {
    addResult("discovery", e.data.params.query, [{heading:"Params",body:JSON.stringify(e.data.params, true, 2)},{heading:"Response",body:e.data.response}]);
  });

  var tabcounter = 0;

  function addResult(type, title, props) {
    if($("#tablist_"+type).length == 0) {
      $("#tablist").append('<li role="presentation" class="inspector dropdown" id="tablist_'+type+'"><a class="dropdown-toggle" data-toggle="dropdown" href="#" role="button" aria-haspopup="true" aria-expanded="false">'+type+' <span class="caret"></span></a><ul class="dropdown-menu" id="'+type+'results"></ul></li>');
    }
    var tabid = "tab"+(tabcounter++);

    var body = props.map(p => {
      return "<h3>"+p.heading+"</h3>"+
      '<pre class="response">'+
      (typeof p.body == "object" ? JSON.stringify(p.body, true, 2) : p.body)+
      "</pre>"
    }).join("");
    $("#tabcontent").append('<div role="tabpanel" id="'+tabid+'" class="inspector tab-pane">'+body+'</div>');
    $("#"+type+"results").append('<li role="presentation"><a href="#'+tabid+'" aria-controls="home" role="tab" data-toggle="tab">'+title+'</a></li>');
  }

  function raiseArm() {
    $("#armup").show();
    $("#armdown").hide();
  }

  function lowerArm() {
    $("#armup").hide();
    $("#armdown").show();
  }

  function init() {
    $(".insert").on("click", function() {
      codeEditor.replaceRange("\n\n"+$(this).text(), CodeMirror.Pos(codeEditor.lastLine()));
    });
  
    $("#runcode").click(function() {
      localStorage.setItem("code", codeEditor.getValue());
      $(".inspector").remove();
      $("#tjbot").tab("show")
      var penv = "var process = {env:{"+
          envEditor.getValue().split(/\r?\n|\r/)
          .filter(function (line) {
              return /\s*=\s*/i.test(line)
          })
          .map(function (line) {
            is_comment = /^\s*\#/i.test(line) // ignore comment lines (starting with #).
  
            if (!is_comment) {
                var key_value = line.match(/^([^=]+)\s*=\s*(.*)$/)
  
                var env_key = key_value[1]
  
                // remove ' and " characters if right side of = is quoted
                var env_value = key_value[2].match(/^(['"]?)([^\n]*)\1$/m)[2]
                return '"'+env_key+'":"'+env_value+'"';
            }
          }).join(",")+"}};";
  
      window.codeStatus = 0;
  
      window.codeCheck = function(state) {
        window.codeStatus = state;
      }
  
      setTimeout(() => {
        if(window.codeStatus == 0) {
          alert("Unable to run the code. Please check for syntax errors.");
        }
      }, 500);
  
      var check = "try { window.codeCheck(1);";
      var catchIt = "} catch(e) { console.log(e.toString());}";
      var f = new Function(check+"\n"+penv+"\n"+codeEditor.getValue()+"\n"+catchIt);
  
      f();
    });
  
    $("._clearlog").click(function() {
      $("#log div").remove();
    });

    raiseArm();
  }

  init();  
});
