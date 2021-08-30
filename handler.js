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

// Open url in container
async function openURL(params) {
    try {
        const currentTab = await browser.tabs.getCurrent()
        browser.contextualIdentities.query({name: params.container}).then(function (containers) {
            if (containers[0] === undefined) { onError(`Error: Container ${params.container} does not exist`) }
            const tabParams = {
                cookieStoreId: containers[0].cookieStoreId,
                url: params.url,
                index: currentTab.index + 1
            }            
            browser.tabs.create(tabParams)
            browser.tabs.remove(currentTab.id)
        }, onError)
    } catch (error) {
        onError(error)
    }
}

// Call opener function
openURL(getParams())