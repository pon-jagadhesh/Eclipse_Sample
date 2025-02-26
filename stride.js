        let editor;
        let editorsss;
        let curlEditorsss;
        let urlEditorsss;
        var response = null;
        var apis = null;
        let authData = {
            method: 'none',
            credentials: {}
        };
        let isAuthorized = false;

        async function main() {
            await fetchAPIList();
        }

        async function fetchAPIList() {
            try {
                response = await fetch("jsonCon");
                apis = await response.json();
            } catch (error) {
                console.error('Failed to fetch API list:', error);
                alert('Error fetching API list. Please check your server.');
            }
        }

        document.addEventListener('DOMContentLoaded', async function () {
            await main();
            if (!apis) {
                alert('Failed to fetch APIs. Check your server connection.');
                return;
            }
            initializeUI();
            initializeAuthModal();
        });

        function initializeAuthModal() {
            const authorizeBtn = document.getElementById('authorize-btn');
            const modalOverlay = document.getElementById('auth-modal-overlay');
            const closeModal = document.getElementById('close-modal');
            const cancelAuth = document.getElementById('cancel-auth');
            const saveAuth = document.getElementById('save-auth');
            const authMethodSelect = document.getElementById('auth-method-select');


            authorizeBtn.addEventListener('click', () => {

                modalOverlay.style.display = 'flex';
            });


            closeModal.addEventListener('click', () => {
                modalOverlay.style.display = 'none';
            });

            cancelAuth.addEventListener('click', () => {
                modalOverlay.style.display = 'none';
            });


            authMethodSelect.addEventListener('change', (e) => {
                const selectedMethod = e.target.value;

                const forms = document.querySelectorAll('.auth-form');
                forms.forEach(form => {
                    form.classList.remove('active');
                });

                const selectedForm = document.getElementById(`auth-${selectedMethod}`);
                if (selectedForm) {
                    selectedForm.classList.add('active');
                }
            });


            saveAuth.addEventListener('click', async () => {
                const method = authMethodSelect.value;
                authData.method = method;
                authData.credentials = {};

                switch (method) {
                    case 'basic':
                        authData.credentials.username = document.getElementById('basic-username').value;
                        authData.credentials.password = document.getElementById('basic-password').value;
                        break;
                    case 'bearer':
                        authData.credentials.token = document.getElementById('bearer-token').value;
                        break;
                    case 'apikey':
                        authData.credentials.name = document.getElementById('apikey-name').value;
                        authData.credentials.value = document.getElementById('apikey-value').value;
                        authData.credentials.location = document.getElementById('apikey-location').value;
                        break;
                    case 'jwt':
                        authData.credentials.token = document.getElementById('jwt-token').value;
                        break;
                    case 'oauth2':
                        authData.credentials.clientId = document.getElementById('oauth-client-id').value;
                        authData.credentials.clientSecret = document.getElementById('oauth-client-secret').value;
                        authData.credentials.tokenUrl = document.getElementById('oauth-token-url').value;
                        authData.credentials.scope = document.getElementById('oauth-scope').value;

                        const token = await fetchOAuthToken(
                            authData.credentials.clientId,
                            authData.credentials.clientSecret,
                            authData.credentials.tokenUrl,
                            authData.credentials.scope
                        );

                        if (token) {
                            localStorage.setItem('oauth_token', token);
                            authData.credentials.token = token;
                        } else {
                            alert('Failed to fetch OAuth token. Please check your credentials.');
                            return;
                        }
                        break;
                }

                if (validateAuthCredentials()) {
                    const result = document.querySelector(".result-div");
                    result.innerText = "Authorization successful";

                    isAuthorized = true;
                    updateAuthorizationStatus();
                    setTimeout(() => {
                        result.innerText = "";
                        modalOverlay.style.display = 'none';
                    }, 2000);


                } else {
                    const result = document.querySelector(".result-div");
                    result.innerText = 'Please fill in all required fields for the selected authorization method.';
                }
            });
        }

        async function fetchOAuthToken(clientId, clientSecret, tokenUrl, scope) {
            try {
                const response = await fetch(tokenUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        client_id: clientId,
                        client_secret: clientSecret,
                        grant_type: 'client_credentials',
                        scope: scope || '',
                    }),
                });

                if (!response.ok) {
                    console.error('Error fetching OAuth token:', response.statusText);
                    return null;
                }

                const data = await response.json();
                return data.access_token || null;
            } catch (error) {
                console.error('Error in fetchOAuthToken:', error);
                return null;
            }
        }

        function validateAuthCredentials() {
            const method = authData.method;
            const credentials = authData.credentials;

            if (method === 'none') return true;

            switch (method) {
                case 'basic':
                    return credentials.username && credentials.password;
                case 'bearer':
                case 'jwt':
                    return credentials.token;
                case 'apikey':
                    return credentials.name && credentials.value;
                case 'oauth2':
                    return credentials.clientId && credentials.clientSecret && credentials.tokenUrl && credentials.token;
                default:
                    return false;
            }
        }

        function updateAuthorizationStatus() {
            const authorizeBtn = document.getElementById('authorize-btn');

            if (isAuthorized) {
                if (!authorizeBtn.querySelector('.auth-status')) {
                    const statusSpan = document.createElement('span');
                    statusSpan.className = 'auth-status authorized';
                    statusSpan.innerHTML = '<i>&#10004;</i>';
                    authorizeBtn.appendChild(statusSpan);
                }
            } else {
                const statusSpan = authorizeBtn.querySelector('.auth-status');
                if (statusSpan) {
                    authorizeBtn.removeChild(statusSpan);
                }
            }
        }

        function applyAuthToRequest(requestHeaders, requestParams) {
            if (!isAuthorized) {
                return { headers: requestHeaders, params: requestParams };
            }

            const headers = { ...requestHeaders };
            let params = { ...requestParams };

            switch (authData.method) {
                case 'basic':
                    const base64Credentials = btoa(`${authData.credentials.username}:${authData.credentials.password}`);
                    headers['Authorization'] = `Basic ${base64Credentials}`;
                    break;

                case 'bearer':
                case 'jwt':
                    console.log("Hiiiiiiiiiiiiiiiiiiii");
                    headers['Authorization'] = `Bearer ${authData.credentials.token}`;
                    break;

                case 'apikey':
                    if (authData.credentials.location === 'header') {
                        headers[authData.credentials.name] = authData.credentials.value;
                    } else {
                        params[authData.credentials.name] = authData.credentials.value;
                    }
                    break;

                case 'oauth2':
                    headers['Authorization'] = `Bearer ${localStorage.getItem('oauth_token') || 'mock-oauth-token'}`;
                    break;
            }

            console.log(headers);
            console.log(params);

            return params && Object.keys(params).length > 0 ? { headers, params } : { headers };
        }


        function createMethodElement(api, method, url, index) {
            const methodDiv = document.createElement('div');
            methodDiv.className = 'method';

            const methodLabel = document.createElement('span');
            if (method.includes(".")) {
                method = method.split(".")
                method = method[0];
            }
            methodLabel.className = `method-label ${method.toLowerCase()}`;

            if (method == "GET") {
                methodDiv.classList.add("get-bg");
            }
            else if (method == "POST") {
                methodDiv.classList.add("post-bg");
            }
            else if (method == "PUT") {
                methodDiv.classList.add("put-bg");
            }
            else if (method == "DELETE") {
                methodDiv.classList.add("delete-bg");
            }
            else if (method == "PATCH") {
                methodDiv.classList.add("patch-bg");
            }


            methodLabel.textContent = method;

            const urlSpan = document.createElement('span');
            urlSpan.className = 'endpoint-url';
            urlSpan.textContent = url;

            /*const descSpan = document.createElement('span');
            descSpan.className = 'endpoint-description';
            descSpan.textContent = description;*/

            methodDiv.appendChild(methodLabel);
            methodDiv.appendChild(urlSpan);
            /*methodDiv.appendChild(descSpan);*/

            const content = document.createElement('div');
            content.className = 'endpoint-content';

            const tryButton = document.createElement('button');
            tryButton.className = 'try-out';
            tryButton.textContent = 'Test';

            const responseBox = document.createElement('pre');
            responseBox.className = 'response-box';


            content.appendChild(responseBox);

            methodDiv.addEventListener('click', () => {
                const allContents = document.querySelectorAll('.endpoint-content');
                allContents.forEach(el => el.classList.remove('active'));
                content.classList.add('active');
                initializeRequest(api, method, index);
                content.appendChild(tryButton);
                initializeResponse(api, method, index);


            });


            tryButton.addEventListener('click', () => fetchAnswer(content, tryButton, api, method, index));

            return [methodDiv, content];
        }

        function toggleTheme() {
            const body = document.body;
            const currentTheme = body.getAttribute('data-theme');
            body.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
        }

        function initializeUI() {
            const container = document.getElementById('endpoints-container');
            apis.forEach(api => {
                const endpoint = document.createElement('div');
                endpoint.className = 'endpoint';

                api.methods.forEach((method, index) => {
                    const [methodEl, contentEl] = createMethodElement(api, method, api.url, index);
                    endpoint.appendChild(methodEl);
                    endpoint.appendChild(contentEl);
                });

                container.appendChild(endpoint);
            });
        }
        function initializeRequest(api, method, index) {
            var idValue = 0;
            var curEndPointContent = document.querySelectorAll('.endpoint-content');
            curEndPointContent.forEach((className) => className.innerHTML = "");
            var lineBreak = document.createElement("br");
            curEndPointContent.forEach((className) => {
                if (className.classList.contains('active')) {
                    className.innerHTML = "";
                    if (api.requestDataType[index].length > 0) {
                        var paramHeading = document.createElement("p");
                        paramHeading.innerText = "REQUEST PARAMETER";
                        className.appendChild(paramHeading);
                        for (let i = 0; i < api.requestDataType[index].length; i++) {
                            if (api.requestDataType[index][i] != undefined) {
                                className.appendChild(lineBreak);
                                var responseArea = document.createElement("div");
                                var dataName = document.createElement("p");
                                dataName.style.fontSize = "20px";
                                dataName.innerText = api.requestDataName[index][i] + " : ";
                                responseArea.className = "textContainer";
                                var inputBox = document.createElement("input");
                                inputBox.type = "text";
                                inputBox.placeholder = api.requestDataType[index][i];
                                inputBox.id = "parameter" + idValue;
                                idValue++;
                                responseArea.appendChild(dataName);
                                responseArea.appendChild(inputBox);
                                className.appendChild(responseArea);
                            }
                        }
                    }
                    if (api.requestBodyType[index].length > 0) {
                        var paramHeadingBody = document.createElement("p");
                        paramHeadingBody.innerText = "REQUEST BODY";
                        className.appendChild(paramHeadingBody);

                        for (let i = 0; i < api.requestBodyType[index].length; i++) {
                            if (api.requestBodyType[index][i] !== undefined) {
                                className.appendChild(lineBreak);

                                // Create the container for the response area
                                var responseArea = document.createElement("div");
                                responseArea.className = "textContainer";

                                // Create and style the parameter label
                                var dataName = document.createElement("p");
                                dataName.style.fontSize = "20px";
                                dataName.innerText = api.requestBodyName[index][i] + " : ";
                                responseArea.appendChild(dataName);

                                // Create the container for Ace Editor
                                var container = document.createElement("div");
                                let uniqueId = "api-editor-" + idValue; // Ensure unique ID
                                container.className = "parameter" + idValue;
                                container.id = uniqueId; // Assign the unique ID for Ace to recognize

                                container.style.width = "100%";
                                container.style.height = "fit-content";
                                container.style.minHeight = "100px";


                                responseArea.appendChild(container);
                                className.appendChild(responseArea);

                                // Initialize Ace Editor
                                editor = ace.edit(uniqueId);
                                //editor.setTheme("ace/theme/monokai");
                                editor.setTheme("ace/theme/dracula");
                                editor.session.setMode("ace/mode/json");
                                editor.setFontSize(16);
                                var fieldObj = {};
                                for (let j = 0; j < api.bodyFields[index].length; j++) {
                                    fieldObj[api.bodyFields[index][j]] = "value " + (j + 1);
                                }
                                editor.setValue(JSON.stringify(fieldObj, null, 2));

                                idValue++;
                            }
                        }
                    }
                }
            });
        }

        function initializeResponse(api, method, index) {
            var body = "";
            var dropdownValue = "JSON";
            var curEndPointContent = document.querySelectorAll('.endpoint-content');
            var responseArea = null;
            dropdown = document.createElement("select");


            let options = ["JSON", "XML"];
            options.forEach((optionText) => {
                let option = document.createElement("option");
                option.value = optionText;
                option.textContent = optionText;
                dropdown.appendChild(option);
                dropdown.id = "dropDown";
            });
            curEndPointContent.forEach((className) => {
                if (className.classList.contains('active')) {
                    for (var i = 0; i < api.response[index].length; i++) {
                        var lineBreak = document.createElement("br");
                        responseArea = document.createElement("div");
                        responseArea.className = "responseContainer";
                        var responseCode = document.createElement("p");
                        responseCode.className = "responseTextSize";
                        responseCode.innerText = "Response Code : " + api.response[index][i].ResponseCode;
                        var description = document.createElement("p");
                        description.className = "responseTextSize";
                        description.innerText = "Description : " + api.response[index][i].Description;
                        var mediaType = document.createElement("p");
                        mediaType.className = "responseTextSize";
                        mediaType.innerText = "Media Type : " + api.response[index][i].MediaType;
                        var schema = document.createElement("p");
                        schema.className = "responseTextSize";
                        schema.innerText = "Schema : " + api.response[index][i].Schema;
                        var deprecated = document.createElement("p");
                        deprecated.className = "responseTextSize";
                        deprecated.innerText = "Deprecated : " + api.response[index][i].Deprecated;
                        var headers = document.createElement("p");
                        headers.className = "responseTextSize";
                        headers.innerText = "Header : "
                        var curl = document.createElement("p");
                        curl.className = "responseTextSize";
                        curl.innerText = "cURL : ";
                        let curlContainer = document.createElement("div");
                        curlContainer.className = "curlEditor-container";
                        curlContainer.id = "curl-editor" + i;
                        curlContainer.style.width = "100%";
                        curlContainer.style.minHeight = "50px";
                        curlContainer.style.maxHeight = "none";
                        var url = document.createElement("p");
                        url.className = "responseTextSize";
                        url.innerText = "Url : ";
                        let urlContainer = document.createElement("div");
                        urlContainer.className = "urlEditor-container";
                        urlContainer.id = "url-editor" + i;
                        urlContainer.style.width = "100%";
                        urlContainer.style.minHeight = "50px";
                        urlContainer.style.maxHeight = "none";
                        var examples = document.createElement("p");
                        examples.className = "responseTextSize";
                        let container = document.createElement("div");
                        container.className = "editor-container";
                        container.id = "api-editor" + i; // Ensure the ID is correctly set
                        container.style.width = "100%";
                        container.style.width = "100%";
                        container.style.minHeight = "50px";
                        examples.innerText = "Response : ";
                        if (api.response[index][i].ResponseCode != undefined) {
                            responseArea.appendChild(responseCode);
                            responseArea.appendChild(lineBreak);
                        }
                        if (api.response[index][i].Description != undefined) {
                            responseArea.appendChild(description);
                            responseArea.appendChild(lineBreak);
                        }
                        if (api.response[index][i].MediaType != undefined) {
                            responseArea.appendChild(mediaType);
                            responseArea.appendChild(lineBreak);
                        }
                        if (api.response[index][i].Schema != undefined) {
                            responseArea.appendChild(schema);
                            responseArea.appendChild(lineBreak);
                        }
                        if (api.response[index][i].Deprecated != undefined) {
                            responseArea.appendChild(deprecated);
                            responseArea.appendChild(lineBreak);
                        }
                        if (api.response[index][i].Headers != undefined) {
                        	let container = document.createElement("div");
                            container.className = "headerEditor-container";
                            container.id = "header-editor"; // Ensure the ID is correctly set
                            container.style.width = "100%";
                            container.style.minHeight = "50px";
                            container.style.maxHeight = "none";
                            responseArea.appendChild(headers);
                            responseArea.appendChild(container);
                            responseArea.appendChild(lineBreak);
                        }
                        if (api.response[index][i].curl != undefined) {
                            responseArea.appendChild(curl);
                            responseArea.appendChild(curlContainer);
                            responseArea.appendChild(lineBreak);
                        }
                        if(api.response[index][i].responseUrl != undefined){
                        	responseArea.appendChild(lineBreak);
                        	responseArea.appendChild(url);
                            responseArea.appendChild(urlContainer);
                            responseArea.appendChild(lineBreak);
                        }
                        if (api.response[index][i].Examples != undefined) {
                            if (isValidJson(api.response[index][i].Examples)) {
                            	responseArea.appendChild(lineBreak);
                                responseArea.appendChild(dropdown);
                                responseArea.appendChild(lineBreak);
                                body = JSON.parse(api.response[index][i].Examples);
                            }
                            responseArea.appendChild(examples);
                            responseArea.appendChild(container);
                        }

                        className.appendChild(responseArea);
                        if (api.response[index][i].curl != undefined) {
                            curlEditorsss = ace.edit("curl-editor" + i);
                            curlEditorsss.setTheme("ace/theme/dracula");
                            curlEditorsss.setOptions({
                                maxLines: Infinity
                            });

                            curlEditorsss.session.setMode("ace/mode/text");
                            curlEditorsss.setFontSize(16); // Optional: Set font size
                            curlEditorsss.setReadOnly(true);
                            curlEditorsss.setValue(api.response[index][i].curl);
                        }
                        console.log(JSON.stringify(api.response[index][i], null, 2))
                        if(api.response[index][i].responseUrl != undefined){
                        	urlEditorsss = ace.edit("url-editor" + i);
                            urlEditorsss.setTheme("ace/theme/dracula");
                            urlEditorsss.setOptions({
                                maxLines: Infinity
                            });

                            urlEditorsss.session.setMode("ace/mode/text");
                            urlEditorsss.setFontSize(16); // Optional: Set font size
                            urlEditorsss.setReadOnly(true);
                            urlEditorsss.setValue(api.response[index][i].responseUrl);
                        }
                        if(api.response[index][i].Headers != undefined){
                            headerEditors=ace.edit("header-editor");
                            headerEditors.setTheme("ace/theme/dracula");
                            headerEditors.setOptions({
                                maxLines: Infinity
                            });
                            headerEditors.session.setMode("ace/mode/*");
                            headerEditors.setFontSize(16); 
                            headerEditors.setReadOnly(true);
                            let allHeaders="";
                            response.headers.forEach((value, name) => {
                                allHeaders += (`${name}: ${value}\n`);
                            });
                            headerEditors.setValue(allHeaders,1);}
                        if (api.response[index][i].Examples != undefined) {
                            // Initialize Ace Editor after appending
                            editorsss = ace.edit("api-editor" + i);
                            // editorsss.setTheme("ace/theme/monokai");
                            editorsss.setTheme("ace/theme/dracula");
                            editorsss.setOptions({
                                maxLines: Infinity
                            });
                            editorsss.session.setMode("ace/mode/json");
                            editorsss.setFontSize(16); // Optional: Set font size
                            editorsss.setReadOnly(true);
                        }
                        var parsedJSON = ""
                        try {
                            parsedJSON = JSON.parse(api.response[index][i].Examples);
                            editorsss.setValue(JSON.stringify(parsedJSON, null, 2));
                        }
                        catch (e) {
                            editorsss.setValue(api.response[index][i].Examples);
                        }



                    }
                }
            });



            dropdown.addEventListener("change", function () {
                dropdownVal = this.value;
                if (dropdownVal == "XML") {
                    var dropEdit = document.querySelector(".editor-container");
                    var edit = ace.edit(dropEdit.id);
                    edit.setValue(jsonToXml(body))
                }
                else {
                    var dropEdit = document.querySelector(".editor-container");
                    var edit = ace.edit(dropEdit.id);
                    edit.setValue(JSON.stringify(body, null, 2));
                }

            });

        }



        function isValidJson(jsonString) {
            try {
                JSON.parse(jsonString);
                return true;
            } catch (e) {
                return false;
            }
        }

        function getRequestHeaders(api, index, headerParam) {
            const headers = {};
            if (api.requestHeaderName[index].length > 0) {
                for (var i = 0; i < api.requestHeaderName[index].length; i++) {
                    const headerKey = api.requestHeaderName[index][i];
                    const headerValue = headerParam[i];
                    if (headerKey && headerValue) {
                        headers[headerKey] = headerValue;
                    }
                }
            }
            return headers;
        }

        function getRequestBody(api, index, method, bodyValue) {
            if (["POST", "PUT", "GET", "DELETE"].includes(method)) {
                const requestBody = bodyValue
                return requestBody;
            }
            return null;
        }

        function getRequestParam(api, index, urlParam) {
            var endPoint = "";
            if (api.requestDataName[index].length > 0) {
                for (var i = 0; i < api.requestDataName[index].length; i++) {
                    const urlParamName = api.requestDataName[index][i];
                    const urlParamValue = urlParam[i];
                    if (urlParamName && urlParamValue && i != api.requestDataName[index].length - 1) {
                        endPoint += urlParamName + "=" + urlParamValue + "&";
                    }
                    else if (urlParamName && urlParamValue) {
                        endPoint += urlParamName + "=" + urlParamValue
                    }
                }
            }
            return endPoint;
        }

        function removeSlash(string) {
            var newString = "";
            for (var i = 0; i < string.length; i++) {
                if (string[i] != "/") {
                    newString += string[i];
                }
            }
            return newString;
        }
        async function fetchAnswer(div, button, api, method, index) {
            try {
                var inputParamArray = [];
                var bodyValue = "";
                var urlParam = [];
                var totalLength = api.requestBodyName[index].length + api.requestDataName[index].length;
                for (var i = 0; i < totalLength; i++) {
                    var paramId = document.querySelector(".parameter" + i);
                    var paramIdText = "";
                    if (paramId == null) {
                        paramIdText = document.getElementById("parameter" + i);
                    }
                    if (paramId != null) {
                        inputParamArray[i] = editor.getValue();
                    }
                    else {
                        inputParamArray[i] = paramIdText.value;
                    }
                    paramIdText.value = "";
                }
                for (var i = 0; i < api.requestDataName[index].length; i++) {
                    urlParam[i] = inputParamArray.shift();
                }
                bodyValue = inputParamArray.shift();
                var method = api.methods[index];
                if (method.includes(".")) {
                    method = method.split(".");
                    method = method[0];
                }
                let options = { method: method, headers: { "Content-Type": "application/json" } };



                // Add request body if method is POST, PUT, PATCH, or DELETE
                if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
                    const requestBody = getRequestBody(api, index, method, bodyValue);
                    if (requestBody) {
                        for (var i = 0; i < api.requestHeaderType[index].length; i++) {
                            options.headers[api.requestHeaderName[index][i]] = api.requestHeaderType[index][i];
                        }
                        options.body = requestBody;

                        const dataOfAuth = applyAuthToRequest(options.headers);
                        options.headers = dataOfAuth.headers;
                    }
                }

                // Add request parameters if provided
                var fullUrl = "";
                const requestParams = getRequestParam(api, index, urlParam);
                if (requestParams) {
                    fullUrl = removeSlash(api.url);
                    const queryString = requestParams
                    fullUrl += "?" + queryString;
                }
                else {
                    fullUrl = removeSlash(api.url);
                }
                let response = "";
                let parser = new DOMParser();
                try {
                    response = await fetch(fullUrl, options);
                }
                catch (error) {
                    let responseObject = {
                        Deprecated: false,
                        Description: "Failed To Fetch",
                        Examples: error.message,
                        method: method,
                        ResponseCode: "Network Error",
                        check: "response Check"
                    };
                    api.response[index] = [responseObject];
                    updateResponse(api,api.response[index][0], method, index)
                    return;
                }
                const contentType = response.headers.get("content-type");

                let result = `Status: ${response.status} ${response.statusText}\n\n`;

                if (contentType && contentType.includes("application/json")) {
                    const jsonResult = await response.json();
                    result += JSON.stringify(jsonResult, null, 2);
                } else {
                    result += await response.text();
                }
                if (result.includes("<!doctype html>")) {
                    let doc = parser.parseFromString(result, "text/html");
                    result = doc.querySelector("pre")
                    if(result){
                    	result=result.innerText;
                    }
                    if (result==null) {
                    	var resultString="";
                        result = doc.querySelectorAll("p")
                        for(var i=0;i<result.length-1;i++){
                        	resultString+=" "+result[i].innerText;
                        }
                        result=resultString;
                    }
                    else {
                        var newResult = "";
                        for (var i = 0; i < result.length; i++) {
                            if (result[i] == "[") {
                                break;
                            }
                            else {
                                newResult += result[i];
                            }
                        }
                        result = newResult;
                    }
                }
                var newResult = result;
                let status = result.split("\n")[0].split(":");
                result = result.split("\n").slice(1).join("\n").trim();
                if (isValidJson(result)) {
                    result = JSON.parse(result)
                    var newJson = {};
                    newJson[status[0]] = status[1];
                    result = { ...newJson, ...result };
                    result = JSON.stringify(result, null, 2);
                }
                else {
                    result = newResult;
                }
                let responseObject = {
                    Deprecated: false,
                    Description: "Successfully fetched",
                    Examples: result,
                    Headers: options.headers,
                    method: method,
                    ResponseCode: "200",
                    check: "response Check",
                    curl: createCurl(api, method, index, options.body, options.headers, fullUrl)
                };
                api.response[index] = [responseObject];
                updateResponse(api,api.response[index][0], method, index,fullUrl)
            } catch (error) {
                let responseObject = {
                    Deprecated: false,
                    Description: "Failed To Fetch",
                    Examples: error.message,
                    method: method,
                    ResponseCode: "Network Error",
                    check: "response Check"
                };
                api.response[index] = [responseObject];
                updateResponse(api,api.response[index][0], method, index)
                return;
            }
            finally {
            }
        }

        function updateResponse(jsonApi,api, method, index,fullUrl){
            let dropdown = document.createElement("select");
            var body = "";
            var dropdownVal = "JSON";
            // Add options
            let options = ["JSON", "XML"];
            options.forEach((optionText) => {
                let option = document.createElement("option");
                option.value = optionText;
                option.textContent = optionText;
                dropdown.appendChild(option);
                dropdown.id = "dropDown";
            });
            document.querySelectorAll(".responseContainer").forEach(div => div.remove());

            var responseBox = document.querySelector(".active");
            var lineBreak = document.createElement("br");

            responseArea = document.createElement("div");
            responseArea.className = "responseContainer";

            var responseCode = document.createElement("p");
            responseCode.className = "responseTextSize";
            responseCode.innerText = "Response Code : " + api.ResponseCode;

            var description = document.createElement("p");
            description.className = "responseTextSize";
            description.innerText = "Description : " + api.Description;

            var mediaType = document.createElement("p");
            mediaType.className = "responseTextSize";
            mediaType.innerText = "Media Type : " + api.MediaType;

            var schema = document.createElement("p");
            schema.className = "responseTextSize";
            schema.innerText = "Schema : " + api.Schema;

            var deprecated = document.createElement("p");
            deprecated.className = "responseTextSize";
            deprecated.innerText = "Deprecated : " + api.Deprecated;

            var headers = document.createElement("p");
            headers.className = "responseTextSize";
            headers.innerText = "Header : ";

            // Create a container for Ace Editor
            // let container = document.createElement("div");
            //container.className = "editor-container";
            //container.id = "api-editors"; // Assign an ID for Ace initialization
            //container.style.width = "100%";
            //container.style.height = "300px"; // Ensure the height is sufficient for Ace

            if (api.ResponseCode != undefined) {
                responseArea.appendChild(responseCode);
                responseArea.appendChild(lineBreak);
            }
            if (api.Description != undefined) {
                responseArea.appendChild(description);
                responseArea.appendChild(lineBreak);
            }
            if (api.MediaType != undefined) {
                responseArea.appendChild(mediaType);
                responseArea.appendChild(lineBreak);
            }
            if (api.Schema != undefined) {
                responseArea.appendChild(schema);
                responseArea.appendChild(lineBreak);
            }
            if (api.Deprecated != undefined) {
                responseArea.appendChild(deprecated);
                responseArea.appendChild(lineBreak);
            }
            if (api.Headers != undefined) {
          	  let container = document.createElement("div");
                container.className = "headerEditor-container";
                container.id = "header-editor"; // Ensure the ID is correctly set
                container.style.width = "100%";
                container.style.minHeight = "50px";
                container.style.maxHeight = "none";
              responseArea.appendChild(headers);
              responseArea.appendChild(container);
              responseArea.appendChild(lineBreak);
          }
            if (api.curl != undefined) {
                let container = document.createElement("div");
                container.className = "curlEditor-container";
                container.id = "curl-editor"; // Ensure the ID is correctly set
                container.style.width = "100%";
                container.style.minHeight = "50px";
                container.style.maxHeight = "none";
                var curl = document.createElement("p");
                curl.className = "responseTextSize";
                curl.innerText = "cURL : "
                responseArea.appendChild(curl);
                responseArea.appendChild(container); // Append container to the response area
                responseArea.appendChild(lineBreak);
            }
            
            var finalUrl=""
            if(jsonApi.url!= undefined){
            	var urlBase = window.location.origin;
                finalUrl = urlBase + "/" + jsonApi.ProjectName+"/"+fullUrl;
                let container = document.createElement("div");
                container.className = "urlEditor-container";
                container.id = "url-editor"; // Ensure the ID is correctly set
                container.style.width = "100%";
                container.style.minHeight = "50px";
                container.style.maxHeight = "none";
                var url = document.createElement("p");
                url.className = "responseTextSize";
                url.innerText = "Url : "
                responseArea.appendChild(lineBreak);
                responseArea.appendChild(url);
                responseArea.appendChild(container);
                api.responseUrl=finalUrl;
                
            }
            if (api.Examples != undefined) {
                if (isValidJson(api.Examples)) {
                    responseArea.appendChild(lineBreak);
                    responseArea.appendChild(dropdown);
                    responseArea.appendChild(lineBreak);
                    body = JSON.parse(api.Examples);
                }
                let container = document.createElement("div");
                container.className = "editor-container";
                container.id = "api-editor"; // Ensure the ID is correctly set
                container.style.width = "100%";
                container.style.minHeight = "50px";
                container.style.maxHeight = "none";
                var examples = document.createElement("p");
                examples.className = "responseTextSize";
                examples.innerText = "Response : "
                responseArea.appendChild(examples);
                responseArea.appendChild(container); // Append container to the response area
            }

            responseBox.appendChild(responseArea);
            if(api.curl != undefined){
            curlEditorsss = ace.edit("curl-editor");
            curlEditorsss.setTheme("ace/theme/dracula");
            curlEditorsss.setOptions({
                maxLines: Infinity
            });

            curlEditorsss.session.setMode("ace/mode/text");
            curlEditorsss.setFontSize(16); // Optional: Set font size
            curlEditorsss.setReadOnly(true);
            curlEditorsss.setValue(api.curl);}
            if(jsonApi.url != undefined){
            	// Initialize Ace Editor after appending
                urlEditorsss = ace.edit("url-editor");
                // editorsss.setTheme("ace/theme/monokai");
                urlEditorsss.setTheme("ace/theme/dracula");
                urlEditorsss.setOptions({
                    maxLines: Infinity
                });
                urlEditorsss.session.setMode("ace/mode/text");
                urlEditorsss.setFontSize(16); // Optional: Set font size
                urlEditorsss.setReadOnly(true);
                urlEditorsss.setValue(finalUrl, 1);
            }
            if(api.Examples){
            // Initialize Ace Editor after appending
            editorsss = ace.edit("api-editor");
            // editorsss.setTheme("ace/theme/monokai");
            editorsss.setTheme("ace/theme/dracula");
            editorsss.setOptions({
                maxLines: Infinity
            });
            editorsss.session.setMode("ace/mode/json");
            editorsss.setFontSize(16); // Optional: Set font size
            editorsss.setReadOnly(true);
            editorsss.setValue(api.Examples, 1);}
            if(api.Headers != undefined){
            headerEditors=ace.edit("header-editor");
            headerEditors.setTheme("ace/theme/dracula");
            headerEditors.setOptions({
                maxLines: Infinity
            });
            headerEditors.session.setMode("ace/mode/*");
            headerEditors.setFontSize(16); 
            headerEditors.setReadOnly(true);
            let allHeaders="";
            response.headers.forEach((value, name) => {
                allHeaders += (`${name}: ${value}\n`);
            });
            headerEditors.setValue(allHeaders,1);}


            dropdown.addEventListener("change", function () {
                dropdownVal = this.value;
                if (dropdownVal == "XML") {
                    var dropEdit = document.querySelector(".editor-container");
                    var edit = ace.edit(dropEdit.id);
                    edit.setValue(jsonToXml(body))
                }
                else {
                    var dropEdit = document.querySelector(".editor-container");
                    var edit = ace.edit(dropEdit.id);
                    edit.setValue(JSON.stringify(body, null, 2));
                }

            });
        }
        function createCurl(api, method, index, data, header, url) {
            const baseUrl = window.location.origin;
            var endpoint = baseUrl + "/" + api.ProjectName
            if (url) {
                endpoint += "/" + url;
            }
            let curlCommand = `curl -X ${method}`;

            for (const [key, value] of Object.entries(header)) {
                curlCommand += ` -H "${key}: ${value}"`;
            }

            if ((method === "POST" || method === "PUT") && data) {
                curlCommand += ` -d '${data}'`;
            }

            curlCommand += ` ${endpoint}`;
            return curlCommand;
        }
        function jsonToXml(obj, rootName = "root", indent = 2) {
            function convert(obj, level) {
                let xml = "";
                let space = " ".repeat(level * indent);

                for (let key in obj) {
                    if (!obj.hasOwnProperty(key)) continue;
                    let value = obj[key];

                    if (typeof value === "object" && !Array.isArray(value)) {
                        xml += `${space}<${key}>\n${convert(value, level + 1)}${space}</${key}>\n`;
                    } else if (Array.isArray(value)) {
                        value.forEach((item) => {
                            xml += `${space}<${key}>\n${convert(item, level + 1)}${space}</${key}>\n`;
                        });
                    } else {
                        xml += `${space}<${key}>${value}</${key}>\n`;
                    }
                }
                return xml;
            }

            return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n${convert(obj, 1)}</${rootName}>`;
        }
