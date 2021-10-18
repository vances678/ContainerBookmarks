let bookmarkId = null
let bookmarkURL = null
let messageReceived = false

function reloadFavicon(id, url) {
    const newURL = url.slice(-1) == "/" ? url.slice(0, -1) : url + "/"
    browser.bookmarks.update(id, {url: newURL})
    let creating = browser.tabs.create({url: newURL, active: false})
    creating.then(tab => { setTimeout(async () => {try {console.log("first stuff"); await browser.tabs.remove(tab.id)} catch {console.log("second stuff") ;browser.tabs.remove(tab.id+1)}}, 1500) })
}

function assignImage() {
    const title = document.getElementById("title")
    const textBox = document.getElementById("textbox")
    const url = textBox.value.trim()

    if (bookmarkId && bookmarkURL) {
        const data = {}
        data[bookmarkId] = url
        browser.storage.sync.set(data)
        reloadFavicon(bookmarkId, bookmarkURL)
        title.textContent = "Image URL set! (you can close this window)"
    } else {
        title.textContent = "Error retrieving bookmark id. Please try again."
    }
}

function attachFunctionToButton() {
    document.getElementById("button").onclick = () => { assignImage() }
}

function handleMessage(message) {
    if (messageReceived == false) {
        messageReceived = true
        const title = document.getElementById("title")
        title.textContent = title.textContent + ` (${message.bookmarkName}):`
        bookmarkId = message.bookmarkId
        bookmarkURL = message.bookmarkURL
    }
}

browser.runtime.onMessage.addListener(handleMessage)
attachFunctionToButton()
