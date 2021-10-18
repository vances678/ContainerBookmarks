// Create initial menu items
createMenuItems()
let itemsExist = true

// Get internal UUID
const id = browser.runtime.getURL("header.html").replace("moz-extension://", "").replace("/header.html", "") 

// Update bookmark url on menu item selection
browser.menus.onClicked.addListener(async (info) => {
    let bookmarks = await browser.bookmarks.get(info.bookmarkId)
    if (bookmarks[0].type === "folder") {
        bookmarks = await browser.bookmarks.getChildren(info.bookmarkId)
        if (info.menuItemId == "assign_image") {
            for (index in bookmarks) { assignImage(bookmarks[index]) }
        } else if (info.menuItemId == "remove_image") {
            for (index in bookmarks) { removeImage(bookmarks[index]) }
        } else {
            for (index in bookmarks) { updateBookmark(bookmarks[index], info.menuItemId) }
        }
    } else {
        if (info.menuItemId == "assign_image") {
            assignImage(bookmarks[0])
        } else if (info.menuItemId == "remove_image") {
            removeImage(bookmarks[0])
        } else {
            updateBookmark(bookmarks[0], info.menuItemId)
        }
    }
})

// Remove menu if shown from toolbar
browser.menus.onShown.addListener(async (info) => {
    if (info.contexts.includes("bookmark")) {
        if (info.bookmarkId == "toolbar_____") {
            if (itemsExist) {
                browser.menus.removeAll()
                browser.menus.refresh()
                itemsExist = false
                return
            }
        } else {
            const bookmarks = await browser.bookmarks.get(info.bookmarkId)
            if (itemsExist) {
                browser.menus.update("assign_container", {title: `Assign Container to ${bookmarks[0].type === "folder" ? "Bookmarks in Folder" : "Bookmark"}`})
                browser.menus.update("assign_image", {title: `Assign Custom Image to ${bookmarks[0].type === "folder" ? "Bookmarks in Folder" : "Bookmark"}`})
                browser.menus.update("remove_image", {title: `Remove Custom Image from ${bookmarks[0].type === "folder" ? "Bookmarks in Folder" : "Bookmark"}`})
                browser.menus.refresh()
            } else {
                createMenuItems(bookmarks[0].type)
                browser.menus.refresh()
                itemsExist = true
            }
        }
    }
})

// Reload favicon by loading url with / appended or removed
function reloadFavicon(bookmark) {
    const url = bookmark.url
    const newURL = url.slice(-1) == "/" ? url.slice(0, -1) : url + "/"
    browser.bookmarks.update(bookmark.id, {url: newURL})
    let creating = browser.tabs.create({url: newURL, active: false})
    creating.then(tab => { setTimeout(async () => {try {await browser.tabs.remove(tab.id)} catch {browser.tabs.remove(tab.id+1)}}, 1500) })
}

// Open window to assign custom image to bookmark
function assignImage(bookmark) {
    let url = bookmark.url
    if (!bookmark.url.startsWith("ext+cntnrbkmrk:") && !bookmark.url.startsWith(`moz-extension://${id}`)) {
        url = updateBookmark(bookmark, "no-container", false)
    }
    let creating = browser.windows.create({
        type: "detached_panel",
        url: "assign_image.html",
        width: 1000,
        height: 500
    })
    creating.then(() => { setTimeout(() => {browser.runtime.sendMessage({bookmarkId: bookmark.id, bookmarkName: bookmark.title, bookmarkURL: url})}, 200) })
}

// Remove custom image from bookmark
function removeImage(bookmark) {
    browser.storage.sync.remove(bookmark.id)
    reloadFavicon(bookmark)
}

// Update bookmark url with selected container
function updateBookmark(bookmark, menuItemId, shouldReload = true) {
    let url = bookmark.url
    if (url.startsWith("ext+cntnrbkmrk:") || url.startsWith(`moz-extension://${id}`)) { url = url.split("&url=").slice(1).join("&url=") }
    const newURL = `moz-extension://${id}/handler.html#ext+cntnrbkmrk:container=${menuItemId}&id=${bookmark.id}&url=${url}`
    browser.bookmarks.update(bookmark.id, {url: newURL})
    if (shouldReload) {
        let creating = browser.tabs.create({url: newURL, active: false})
        creating.then(tab => { setTimeout(async () => {try {await browser.tabs.remove(tab.id)} catch {browser.tabs.remove(tab.id+1)}}, 1500) })
    }
    return newURL
}

// Creates menu items when called
function createMenuItems(bookmarkType) {
    // Main menu items
    browser.menus.create({
        id: "assign_container",
        title: `Assign Container to ${bookmarkType === "folder" ? "Bookmarks in Folder" : "Bookmark"}`,
        contexts: ["bookmark"],
    })
    browser.menus.create({
        id: "assign_image",
        title: `Assign Custom Image to ${bookmarkType === "folder" ? "Bookmarks in Folder" : "Bookmark"}`,
        contexts: ["bookmark"],
    })
    browser.menus.create({
        id: "remove_image",
        title: `Remove Custom Image from ${bookmarkType === "folder" ? "Bookmarks in Folder" : "Bookmark"}`,
        contexts: ["bookmark"],
    })
    // Submenu items for assign_container
    browser.menus.create({
        id: "no-container",
        title: "No Container",
        contexts: ["bookmark"],
        parentId: "assign_container"
    })
    browser.menus.create({
        type: "separator",
        contexts: ["bookmark"],
        parentId: "assign_container"
    })
    browser.contextualIdentities.query({}).then(function (containers) {
        for (index in containers) {
            const container = containers[index]
            browser.menus.create({
                id: container.name,
                title: container.name,
                icons: {
                    16: `icons/${container.icon}.svg#${container.color}`
                },
                contexts: ["bookmark"],
                parentId: "assign_container"
            })
        }
    })
}