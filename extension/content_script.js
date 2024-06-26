(function () {


    var connected = false;

    


    async function getConnectedStatus() {
        alert("get");
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'getConnectedStatus' }, (response) => {
                resolve(response.connected);
            });
        });
    }
    async function getMessageStatus() {
        alert("get");
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'getLatestReceivedMessage' }, (response) => {
                resolve(response);
            });
        });
    }
    var methods = {};


    // This tells the script to listen for
    // messages from our extension.
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        var data = {};
        // If the method the extension has requested
        // exists, call it and assign its response
        // to data.
        if (methods.hasOwnProperty(request.method))
            data = methods[request.method]();
        // Send the response back to our extension.
        sendResponse({ data: data });
        return true;
    });

    function onDataAvailable(e) {
        alert('Data available:', e.detail);
    }

    methods.fill_form_now = function (inputElement) {
        alert('fill form now!');
        alert(connected);
        document.removeEventListener('dataAvailable', onDataAvailable);
        chrome.storage.local.get('fill_form_json',
            function (data) {
                //alert("data:"+data.fill_form_json);
                var jsonObj = JSON.parse(data.fill_form_json);
                for (var prop in jsonObj) {
                    //alert(prop);
                    if (Array.isArray(jsonObj[prop])) {
                        var arrayVal = assignArrayToInputs(inputElement, prop, jsonObj[prop]);
                        if (arrayVal.includes(undefined)) {
                            alert('Array contains undefined value!');
                        } else {
                            //alert("1");
                            if (arrayVal != '') {
                                alert("arrayVal:" + arrayVal);
                                var event = new CustomEvent('dataAvailable', { detail: arrayVal });
                                document.dispatchEvent(event);
                            }
                        }
                    }
                    else {
                        var Val = assignValueToInputs(inputElement, prop, jsonObj[prop]);
                        if (Val != undefined) {
                            alert("Val:" + Val);
                            var event = new CustomEvent('dataAvailable', { detail: Val });
                            document.dispatchEvent(event);
                        }
                    }

                }
            }
        );

    }
    function assignArrayToInputs(inputElement, inputName, newTextArray) {
        var retArray = [];
        if (Array.isArray(newTextArray)) {
            newTextArray.forEach(newText => {
                if (typeof newText === 'string' || typeof newText === 'number') {
                    Array.from(document.querySelectorAll('input')).forEach(el => {
                        if (el.name == inputName || el.name.includes(inputName) || (el.labels && Array.from(el.labels).some(label => label.textContent.includes(inputName)))) {
                            if (el == inputElement) {
                                if (el.type == "text" || el.type == "number") {
                                    if (newText != undefined) {
                                        retArray.push(newText);
                                    }
                                } else if (el.type == "radio") {
                                    setCheckedValue(el, newText);
                                    retArray.push(newText);
                                } else if (el.type == "checkbox") {
                                    el.checked = (newText === "true");
                                    retArray.push(newText);
                                }
                            }
                        }
                    });
                    Array.from(document.querySelectorAll('textarea')).forEach(el => {
                        if (el == inputElement) {
                            if (el.name == inputName || el.name.includes(inputName) || (el.labels && Array.from(el.labels).some(label => label.textContent.includes(inputName)))) {
                                if (newText != undefined) {
                                    retArray.push(newText);
                                }
                            }
                        }
                    });

                    Array.from(document.querySelectorAll('select')).forEach(el => {
                        if (el == inputElement) {
                            if (el.name == inputName || el.name.includes(inputName) || (el.labels && Array.from(el.labels).some(label => label.textContent.includes(inputName)))) {
                                if (newText != undefined) {
                                    retArray.push(newText);
                                }
                                var val = newText;
                                var opts = el.options;
                                for (var opt, j = 0; opt = opts[j]; j++) {
                                    if (opt.value == val) {
                                        el.selectedIndex = j;
                                        break;
                                    }
                                }
                            }
                        }
                    });
                }
            });
        }
        return retArray;
    }

    function assignValueToInputs(inputElement, inputName, newText) {
        var ret;
        if (typeof newText === 'string' || typeof newText === 'number') {
            //input is text, checkbox, radio
            Array.from(document.querySelectorAll('input')).forEach(el => {
                if (el.name == inputName || el.name.includes(inputName) || (el.labels && Array.from(el.labels).some(label => label.textContent.includes(inputName)))) {
                    if (el == inputElement) {
                        if (el.type == "text" || el.type == "number") {
                            if (newText != undefined) {
                                ret = newText;
                            }
                        } else if (el.type == "radio") {
                            setCheckedValue(el, newText);
                        } else if (el.type == "checkbox") {
                            if (newText == "true") {
                                el.checked = true;
                            } else {
                                el.checked = false;
                            }
                        }
                    }
                }
            });
            Array.from(document.querySelectorAll('textarea')).forEach(el => {
                if (el == inputElement) {
                    if (el.name == inputName || el.name.includes(inputName) || (el.labels && Array.from(el.labels).some(label => label.textContent.includes(inputName)))) {
                        el.value = newText;
                        if (newText != undefined) {
                            ret = newText;
                        }
                    }
                }
            });
            Array.from(document.querySelectorAll('select')).forEach(el => {
                if (el == inputElement) {
                    //alert(newText);
                    if (el.name == inputName || el.name.includes(inputName)) {
                        if (newText != undefined) {
                            ret = newText;
                        }
                        var val = newText;
                        var opts = el.options;
                        for (var opt, j = 0; opt = opts[j]; j++) {
                            if (opt.value == val) {
                                alert(opt.value);
                                el.selectedIndex = j;
                                break;
                            }
                        }
                    }
                }
            });
        }
        return ret;
    }

    // set the radio button with the given value as being checked
    // do nothing if there are no radio buttons
    // if the given value does not exist, all the radio buttons
    // are reset to unchecked
    function setCheckedValue(radioObj, newValue) {
        if (!radioObj)
            return;
        var radioLength = radioObj.length;
        if (radioLength == undefined) {
            radioObj.checked = (radioObj.value == newValue.toString());
            return;
        }
        for (var i = 0; i < radioLength; i++) {
            radioObj[i].checked = false;
            if (radioObj[i].value == newValue.toString()) {
                radioObj[i].checked = true;
            }
        }
    }
    //region: boilerplate


    document.addEventListener('DOMContentLoaded', function () {
        let button_fill_form_from_json = document.getElementById('button_fill_form_from_json');
        console.log("click");
        button_fill_form_from_json.onclick = function () {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                fill_formnow(tabs[0]);
            });
        };
    });

    // Execute the inject.js in a tab and call a method,
    // passing the result to a callback function.
    function injectedMethod(tab, method, callback) {
        chrome.tabs.executeScript(tab.id, { file: 'inject.js' }, function () {
            chrome.tabs.sendMessage(tab.id, { method: method }, callback);
        });
    }
    //endregion boilerplate

    //call the injected function fill_form_now
    function fill_formnow(tab) {
        //pass json through storage
        chrome.storage.local.set({ fill_form_json: document.getElementById("textarea_json").value },
            function () {

            });
    }


    document.addEventListener('DOMContentLoaded', function () {
        var input_fileurl_value = document.getElementById('input_fileurl');
        let button_fill_form_from_url = document.getElementById('button_fill_form_from_url');
        button_fill_form_from_url.onclick = function () {
            fileurl_read();
        }

        var localstorage_key_data_name = 'chext_fill_form_from_json_from_fileurl';
        var storage_fileurl = localStorage.getItem(localstorage_key_data_name);
        if (storage_fileurl) {
            input_fileurl_value.value = storage_fileurl;
        }

        function fileurl_read() {
            // save the url for the next time
            var storage_fileurl = input_fileurl_value.value
            localStorage.setItem(localstorage_key_data_name, storage_fileurl);

            if (storage_fileurl && isValidHttpUrl(storage_fileurl)) {
                getJSON(storage_fileurl,
                    function (err, data) {
                        document.getElementById('textarea_json').value = err ? JSON.stringify(err) : JSON.stringify(data, null, 2);

                        if (!err && data) {
                            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                                fill_formnow(tabs[0]);
                            });
                        }
                    }
                );
            } else if (storage_fileurl) {
                alert('Invalid URL');
            }
        }
    });

    /* File url read */


    // read from storage the last url and fill the input:


    function getJSON(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'json';
        xhr.onload = function () {
            var status = xhr.status;
            if (status === 200) {
                callback(null, xhr.response);
            } else {
                callback(status, xhr.response);
            }
        };
        xhr.send();
    };

    function isValidHttpUrl(string) {
        let url;

        try {
            url = new URL(string);
        } catch (_) {
            return false;
        }

        return url.protocol === "http:" || url.protocol === "https:";
    }

    document.addEventListener('DOMContentLoaded', async function () {
        chrome.runtime.sendMessage({ action: 'getNativeConnectionStatus' }, (response) => {
            updateUiState(response.isConnected);
        });
        document.getElementById('connect-button').addEventListener('click', connectToNativeHost);
        document.getElementById('send-message-button').addEventListener('click', sendMessage);

        chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
            if (message.fromNativeHost) {
                //chrome.runtime.sendMessage({ action: 'saveReceivedMessage', message: message.fromNativeHost });
                appendMessage('Received from native host: ' + JSON.stringify(message.fromNativeHost));
            } else if (message.nativeConnectionStatus) {
                const Connected = message.nativeConnectionStatus.isConnected;
                updateUiState(Connected);
            }
        });


    });
    async function connectToNativeHost() {
        chrome.runtime.sendMessage({ action: 'getNativeConnectionStatus' }, async (response) => {
            if (response.isConnected) {
                alert("disconnect");
                chrome.runtime.sendMessage({ action: 'disconnectFromNativeHost' });
                connected = false;
            }
            else {
                alert("connect");
                const request = { action: 'connectNativeHost' };
                await chrome.runtime.sendMessage(request);
                connected = true;
                chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                    chrome.runtime.sendMessage({ action: 'updateConnectedStatus', status: connected });
                });
            }
            updateUiState(response.isConnected);
        });

    }

    async function sendMessage() {
        const messageText = document.getElementById('input-text').value;
        const message = { toNativeHost: { text: messageText } };
        await chrome.runtime.sendMessage(message);
    }

    function appendMessage(text) {
        document.getElementById('response').innerHTML += '<p>' + text + '</p>';
    }

    function updateUiState(isConnected) {
        document.getElementById('connect-button').innerHTML = isConnected ? 'Disconnect' : 'Connect';
        document.getElementById('input-text').style.display = isConnected ? 'block' : 'none';
        document.getElementById('send-message-button').style.display = isConnected ? 'block' : 'none';
    }

    document.querySelectorAll('input, textarea').forEach(input => {
        let dataAvailableHandler;
        input.addEventListener('input', async (event) => {
            if (event.target.value.endsWith('//')) {
                event.target.value = event.target.value.slice(0, -2);
                const isConnected = await getConnectedStatus();
                if (isConnected) {
                    const associatedLabel = document.querySelector(`label[for="${event.target.id}"]`);
                    if (associatedLabel) {
                        const messageText = associatedLabel.textContent || associatedLabel.innerText; // 获取label的文本内容
                        const message = { toNativeHost: { text: messageText } };
                        chrome.runtime.sendMessage(message);
                    } else {
                        console.error('No associated label found for this input/textarea element');
                    }
                    let response = await getMessageStatus();
                    {
                        alert("response" + response);
                        if (Array.isArray(response)) {
                            const selectElement = document.createElement('select');
                            response.forEach(item => {
                                const option = document.createElement('option');
                                option.value = item;
                                option.text = item;
                                selectElement.appendChild(option);
                            });
                            event.target.parentNode.insertBefore(selectElement, input.nextSibling);
                            selectElement.addEventListener('change', function () {
                                event.target.value = this.value;
                            });
                            input.addEventListener('click', function () {
                                input.parentNode.removeChild(selectElement);
                            });
                        } else if (typeof response === 'string' || typeof response === 'object') {
                            event.target.value = response;
                        }
                    };
                }
                else {
                    methods.fill_form_now(event.target);

                    dataAvailableHandler = function (e) {
                        document.removeEventListener('dataAvailable', dataAvailableHandler);
                        var data = e.detail;
                        const selectElement = document.createElement('select');
                        if (!Array.isArray(data)) {
                            const option1 = document.createElement('option');
                            option1.value = data;
                            option1.text = data;
                            selectElement.appendChild(option1);
                            event.target.value = data;
                        } else {
                            data.forEach(item => {
                                const option = document.createElement('option');
                                option.value = item;
                                option.text = item;
                                selectElement.appendChild(option);
                                event.target.value = data[0];
                            });
                        }
                        event.target.parentNode.insertBefore(selectElement, input.nextSibling);
                        selectElement.addEventListener('change', function () {
                            event.target.value = this.value;
                        });
                        input.addEventListener('click', function () {
                            input.parentNode.removeChild(selectElement);
                        });
                    };
                }
                document.addEventListener('dataAvailable', dataAvailableHandler);
            }
        });
    });

}())