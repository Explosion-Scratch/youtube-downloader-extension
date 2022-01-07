// console.log = (a) => alert(a);

app = Vue.createApp({
    data: () => ({
        tabPromise: new Promise((res) =>
            chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) =>
                res(tab)
            )
        ),
        ytquery: "",
        tab: null,
        // This is manually set instead of computed becase we need to wait for chrome.tabs.query
        id: null,
        loading: false,
    }),
    methods: {
        slice(text, length) {
            return text.slice(0, length - 3).length === length - 3 ? text.slice(0, length - 3) + "..." : text;
        },
        search() {
            chrome.tabs.create({ url: `https://youtube.com/results?search_query=${encodeURIComponent(this.ytquery)}` }, () => {
                this.ytquery = '';
            });
        },
        isYouTube() {
            if (!(this.tab && this.tab.url)) {
                return false;
            }
            return ["youtube.com", "www.youtube.com"].includes(new URL(this.tab.url).hostname);
        },
        download(itag) {
            if (!this.tab && this.id && this.isYouTube()){
                return;
            }
            this.loading = true;
            chrome.runtime.sendMessage({
                type: "download",
                title: `${this.tab.title || prompt("Video title? (omit '.mp4')", "Video") || "Video"}.mp4`.replace(/ /g, "_")
                    .replace(/[^a-zA-Z0-9._]/g, ""),
                id: this.id,
                itag,
            }, null, () => {
                this.loading = false;
            })
        },
    },
    mounted() {
        this.tabPromise.then((t) => {
            this.tab = t;
            console.log("Tab loaded")
            if (!this.isYouTube()) return console.log("Isn't youtube %o");
            this.id = new URLSearchParams(new URL(this.tab.url).search).get("v");
            console.log(this.id)
        });
    },
}).mount("#app");
