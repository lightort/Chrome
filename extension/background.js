let nativePort = null;
let isconnected = false;
let shouldReconnect = true;
let currentConnectedStatus = false;

let receivedMessages;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.action === 'connectNativeHost') {
        console.log("connecting");
        shouldReconnect = true;
        connectToNativeHost().then(() => {
            chrome.runtime.sendMessage({ nativeConnectionStatus: { isConnected: true } });
            console.log("connected");
        }).catch(error => {
            chrome.runtime.sendMessage({ nativeConnectionStatus: { isConnected: false, errorMessage: error.message } });
            console.log("not connected");
        });
    }
    else if (request.toNativeHost) {
        if (nativePort) {
            nativePort.postMessage(request.toNativeHost);
        } else {
            console.error('Cannot send message to disconnected native host.');
        }
    }
    else if (request.action === 'disconnectFromNativeHost') {
        shouldReconnect = false;
        if(nativePort)
        {
            nativePort = null;
            isconnected = false;
        }
    }
    else if (request.action === 'updateConnectedStatus') {
        currentConnectedStatus = request.status;
        console.log("cur"+currentConnectedStatus);
    }
    else if (request.action === 'getConnectedStatus') {
        sendResponse({ connected: currentConnectedStatus });
        console.log("get cur "+currentConnectedStatus);
    }
    else if(request.action === 'getNativeConnectionStatus') {
        const isConnected = isconnected;
        sendResponse({ isConnected });
    }
    else if (request.action === 'saveReceivedMessage') {
        receivedMessages = request.message;
        console.log("change to" + receivedMessages);
    } 
    else if (request.action === 'getLatestReceivedMessage') {
        console.log(receivedMessages);
        let res = receivedMessages;
        if (res) {
            const [key, valueArray] = Object.entries(res)[0];
            sendResponse(valueArray);
        } else {
            sendResponse("nothing here"); 
        }
    }

});

async function connectToNativeHost() {
    if (isconnected) return;
    isconnected = true;
    const hostName = 'com.google.chrome.example.echo';
    console.log("connecting");
    nativePort = await chrome.runtime.connectNative(hostName);
    if(nativePort)
    {
        nativePort.onMessage.addListener(onNativeMessage);
        nativePort.onDisconnect.addListener(onDisconnected);
    }
    else
    {
        console.log(nativePort.errorMessage);
    }

}

async function onNativeMessage(message) {
    console.log('Received message:', message);
    chrome.runtime.sendMessage({ fromNativeHost: message });
    receivedMessages = message;
}

async function onDisconnected() {
    nativePort = null;
    isconnected = false;
    console.error('Disconnected from native messaging host.');
    if (shouldReconnect) {
        setTimeout(connectToNativeHost, 2000);
    }
}
