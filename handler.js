// Show error message on extension page and log error to console
function onError(error) {
    console.error(error)
    document.getElementById('errorText').textContent = error
}

// Get paramaters of extension protocol url
function getParams() {
    const hash = decodeURIComponent(window.location.hash.substr(1))
    const params = (/:(.*)/).exec(hash)[1].split('&').reduce(function (result, item) {
        const split = item.split('=')
        result[split[0]] = split[1]
        return result
    }, {})
    return params
}

// Check if /favicon.ico exists
function imageExists(url) {
    return new Promise(resolve => {
        var image = new Image()
        image.onload = function() { resolve(true) }
        image.onerror = function() { resolve(false) }
        image.src = url
    })
  }
  
// Update head to match favicon of desired site
function updateFavicon(params) {
    return new Promise(async (resolve, reject) => {
        try {
            const href = `${new URL(params.url).origin}/favicon.ico`
            const altHref = `https://s2.googleusercontent.com/s2/favicons?sz=64&domain_url=${params.url}`
            browser.storage.sync.get(params.id)
            .then(async storedImageURL => { 
                const hrefExists = await imageExists(href)
                const altHrefExists = await imageExists(altHref)
                const link = document.createElement("link")
                link.rel = "icon"
                if (storedImageURL[params.id]) {
                    console.log("using stored custom image")
                    link.href = storedImageURL[params.id]
                    document.head.appendChild(link)
                } else if (hrefExists) {
                    console.log("using origin/favicon.ico image")
                    link.href = href
                    document.head.appendChild(link)
                } else if (altHrefExists) {
                    console.log("using google favicon finder")
                    link.href = altHref
                    document.head.appendChild(link)
                } else {
                    console.log("unable to find favicon for bookmark")
                }
                resolve()
            })
        } catch (error) {
            reject(onError(error))
        }
    })
}

// Open url in container
async function openURL(params) {
    try {
        const currentTab = await browser.tabs.getCurrent()
        browser.contextualIdentities.query({name: params.container}).then(containers => {
            const tabParams = {
                cookieStoreId: params.container == "no-container" ? "firefox-default" : containers[0].cookieStoreId,
                url: params.url,
                index: currentTab.index + 1
            }            
            browser.tabs.create(tabParams)
            setTimeout(() => {browser.tabs.remove(currentTab.id)}, 100)
        }, onError)
    } catch (error) {
        onError(error)
    }
}

async function onStart() {
    const params = getParams()  // Get url parameters
    await updateFavicon(params) // Update head to match favicon of desired site
    openURL(params)             // Call opener function
}

onStart()