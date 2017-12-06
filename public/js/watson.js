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

// Simulates the Watson Discovery service
function DiscoveryV1(creds) {
    this.creds = creds;
}

DiscoveryV1.prototype.query = function(params, callback) {
    $.post({
        url: "/api/discovery/query",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            creds: {
                username: this.creds.username,
                password: this.creds.password,
                version_date: this.creds.version_date
            },
            params: params
        })
    }).then(response => {
        callback(response);
    });
}

function require(module) {
    switch(module) {
        case "watson-developer-cloud/discovery/v1":
            return DiscoveryV1;
        break;
    }
}
