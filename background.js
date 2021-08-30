// Create initial menu items
createMenuItems()
let itemsExist = true

// Update bookmark url on menu item selection
browser.menus.onClicked.addListener(async (info) => {
    let bookmarks = await browser.bookmarks.get(info.bookmarkId)
    if (bookmarks[0].type === "folder") {
        bookmarks = await browser.bookmarks.getChildren(info.bookmarkId)
        for (index in bookmarks) {
            updateBookmark(bookmarks[index], info.menuItemId)
        }
    } else {
        updateBookmark(bookmarks[0], info.menuItemId)
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
                browser.menus.update("parent", {title: `Assign Container to ${bookmarks[0].type === "folder" ? "Bookmarks in Folder" : "Bookmark"}`})
                browser.menus.refresh()
            } else {
                createMenuItems(bookmarks[0].type)
                browser.menus.refresh()
                itemsExist = true
            }
        }
    }
})

// Update bookmark url with selected container
function updateBookmark(bookmark, menuItemId) {
    let url = bookmark.url
    let newUrl = ""
    if (/ext\+cntnrbkmrk/.exec(url)) { url = url.split("&url=").pop() }
    if (menuItemId === "no-container") {newUrl = url } else { newUrl = `ext+cntnrbkmrk:container=${menuItemId}&url=${url}` }
    browser.bookmarks.update(bookmark.id, {url: newUrl})
}

// Creates menu items when called
function createMenuItems(bookmarkType) {
    browser.menus.create({
        id: "parent",
        title: `Assign Container to ${bookmarkType === "folder" ? "Bookmarks in Folder" : "Bookmark"}`,
        contexts: ["bookmark"],
    })
    browser.menus.create({
        id: "no-container",
        title: "No Container",
        contexts: ["bookmark"],
        parentId: "parent"
    })
    browser.menus.create({
        type: "separator",
        contexts: ["bookmark"],
        parentId: "parent"
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
                parentId: "parent"
            })
        }
    })
}