
const injectCSS = (file) => {
  const link = document.createElement('link');
  link.href = chrome.runtime.getURL(file);
  link.type = 'text/css';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
};

// Inject the style-override.css
injectCSS('style-override.css');

let currentUrl = window.location.href

const EXTENSION_ENABLED_KEY = "settings:extension_enabled"
const INFINITE_SCROLL_KEY = "settings:infinite_scroll"

const clearTheaterModeCookie = () => {
    document.cookie = "wide=; Max-Age=0; path=/; domain=.youtube.com"
}

const enableTheaterMode = () => {
    clearTheaterModeCookie()

    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

    document.cookie = "wide=1; expires=" + oneYearFromNow.toUTCString() + "; path=/; domain=.youtube.com"
}

const initFY = () => {
    cleanUpFYClasses()
    enableTheaterMode()

    if (window.location.pathname === "/") {
        initHomePage()
    } else if (window.location.href.includes("/watch")) {
      console.log("hehe")
        initWatchPage()
    }
}

let cleanUpFYClasses = () => {
    document.body.classList.forEach(className => {
        if (className.startsWith("fy-")) {
            document.body.classList.remove(className)
        }
    })
}

const mountLogoMenu = () => {
    const logoMenu = document.querySelector(".fy-logo-menu")

    if (logoMenu) {
        return
    }

    let logo = document.querySelector("#logo")

    if (!logo) {
        logo = document.querySelector(".fy-home-page__logo")
    }

    if (!logo) {
        return
    }

    const menu = document.createElement("div")
    menu.classList = "fy-logo-menu"

    menu.innerHTML = `
      <div class="fy-logo-menu__body">
        <div class="fy-logo-menu__links">
          <a href="/feed/history" class="fy-logo-menu__link">Watch history</a>
          <a href="/feed/playlists" class="fy-logo-menu__link">Playlists</a>
          <a href="/playlist?list=WL" class="fy-logo-menu__link">Watch later</a>
          <a href="/playlist?list=LL" class="fy-logo-menu__link">Liked videos</a>
          <a href="/account" class="fy-logo-menu__link">Account</a>
        </div>
      </div>
    `

    logo.appendChild(menu)
}

const initWatchPage = () => {
  document.body.classList.add("fy-watch-page");

  const hideSidebar = () => {
      const sidebar = document.getElementById("secondary");
      if (sidebar) {
          sidebar.style.display = "none";
          console.log("Sidebar hidden");
      } else {
          console.log("Sidebar not found yet");
      }
  };

  // Initially try to hide the sidebar
  hideSidebar();

  // Set up a MutationObserver to watch for changes and hide the sidebar if it's loaded later
  const observer = new MutationObserver(() => {
      hideSidebar();
  });

  observer.observe(document.body, { childList: true, subtree: true });
};

const initHomePage = () => {
    const search = (event) => {
        event.preventDefault()

        const query = anchor.querySelector(".fy-search-form__text-input").value
        window.location.href = "https://www.youtube.com/results?search_query=" + encodeURIComponent(query)
    }

    document.body.classList.add("fy-home-page")

    const body = document.querySelector("body")
    const anchor = document.createElement("div")
    anchor.id = "mega-app"

    body.innerHTML = ""
    document.body.appendChild(anchor)

    anchor.innerHTML = `
      <div class="fy-home-page">
        <div id="logo" class="fy-home-page__logo"></div>
        <div class="fy-home-page__body">
          <form class="fy-home-page__form fy-search-form" action="#">
            <input class="fy-search-form__text-input" type="text" placeholder="Search" autofocus />
            <button class="fy-search-form__submit"></button>
          </form>
        </div>
      </div>
    `

    anchor.querySelector(".fy-search-form").onsubmit = search
}

const nodeMatchesSelector = (node, selector) => {
    if (!node) return false

    if (node.matches && node.matches(selector)) {
        return true
    }

    if (node.querySelector && node.querySelector(selector)) {
        return true
    }

    return false
}

const hideSectionByTitle = (titleText) => {
    const sections = document.querySelectorAll("ytd-shelf-renderer.style-scope.ytd-item-section-renderer")
    const section = Array.from(sections).find(section => {
        const title = section.querySelector("#title")
        return title && title.innerText.includes(titleText)
    })

    if (section) {
        section.classList.add("fy-invisible")
    }
}

const observeDOM = (function () {
    const MutationObserver = window.MutationObserver || window.WebKitMutationObserver
    const eventListenerSupported = window.addEventListener

    return function (obj, selector, callback) {
        if (MutationObserver) {
            let obs = new MutationObserver(function (mutations) {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (nodeMatchesSelector(node, selector)) {
                            callback()
                        }
                    })
                })
            })

            obs.observe(obj, {
                childList: true,
                subtree: true
            })
        } else if (eventListenerSupported) {
            obj.addEventListener("DOMNodeInserted", callback, false)
            obj.addEventListener("DOMNodeRemoved", callback, false)
        }
    }
})()

// Use the more reliable History API to detect URL changes
const setupHistoryObserver = () => {
    let pushState = history.pushState
    history.pushState = function () {
        pushState.apply(history, arguments)
        currentUrl = window.location.href
        initFY()
    }

    window.addEventListener("popstate", () => {
        currentUrl = window.location.href
        initFY()
    })
}

const setupDOMObservers = () => {
    mountLogoMenu()

    observeDOM(document.body, "ytd-shelf-renderer.style-scope.ytd-item-section-renderer", () => {
        hideSectionByTitle("For you")
        hideSectionByTitle("Latest posts from")
        hideSectionByTitle("Popular today")
    })

    observeDOM(document.body, "ytd-topbar-logo-renderer#logo", () => {
        mountLogoMenu()
    })
}

// Check if the extension is enabled in storage and run the init function if true
chrome.storage.sync.get([EXTENSION_ENABLED_KEY], (result) => {
    if (result[EXTENSION_ENABLED_KEY] || typeof (result[EXTENSION_ENABLED_KEY]) === "undefined") {
        initFY()
        setupDOMObservers()
        setupHistoryObserver()
    }
})
