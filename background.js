/*

Basically this extension works by loading an Invidious API in the background. 

Invidious is an open source alternative YouTube frontend that preserves user's 
privacy. This extension simply loads the download URL in the background when 
the user wants to download a video.

In future versions I'll add the ability to change the download URL as well.

*/
chrome.runtime.onMessage.addListener((message, _, respond) => {
    if (message.type === "download") {
        download(url(message));
        setTimeout(() => respond(), 800);
    }
    else {
        respond();
    }

    return true;
})

let patterns = ["*://*/watch*"];

chrome.contextMenus.create({
    documentUrlPatterns: patterns,
    id: "video",
    title: "Download video",
    onclick: async () => {
        let info = await getInfo();
        if (info.error){
            alert(info.message);
        }
        download(url({...info, itag: "22"}));
    }
}, () => console.log("Created menu"))

chrome.contextMenus.create({
    documentUrlPatterns: patterns,
    id: "audio",
    title: "Download audio",
    onclick: async () => {
        let info = await getInfo();
        if (info.error){
            alert(info.message);
        }
        download(url({...info, itag: "139"}));
    }
}, () => console.log("Created menu"))

chrome.commands.onCommand.addListener(async (command) => {
    let info = await getInfo();
    if (info.error){
        return alert(info.message);
    }
    if (command === "audio") {
        download(url({...info, itag: "139"}))
    }
    if (command === "video"){
        download(url({...info, itag: "22"}));
    }
})

//Generates the URL to download from
function url(message) {
    message.title = message.title.replace(/__YouTube/, "");
    return `https://vid.puffyan.us/latest_version?download_widget=${encodeURIComponent(JSON.stringify({
            id: message.id,
            title: message.title,
            itag: message.itag,
        }))}`
}

//Opens the specified URL in an iframe
function download(_url){
    let ifr = document.createElement("iframe");
    ifr.onload = () => {
        ifr.remove();
    }
    ifr.src = _url;
    document.body.appendChild(ifr);

    setTimeout(() => ifr.remove(), 10000)
}

//Gets information about the active tab
async function getInfo() {
    let tab = await new Promise((res) =>
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) =>
            res(tab)
        )
    );
    if (!["www.youtube.com", "youtube.com"].includes(new URL(tab.url).hostname)) {
        return { error: true, message: "You're not on a youtube page" };
    }
    let out = {
        title: `${tab.title || "Video"}.mp4`.replace(/ /g, "_")
            .replace(/[^a-zA-Z0-9._]/g, ""),
        id: new URLSearchParams(new URL(tab.url).search).get("v"),
    }
    if (!out.title && out.id) {
        return { error: true, message: "No title or no ID, sorry!" };
    }
    return out;
}