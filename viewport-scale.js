(function () {
    var MOBILE_BREAKPOINT = 768;
    var DESKTOP_VIEWPORT_WIDTH = 1366;
    var EMBED_VIEWPORT_WIDTH = 1100;

    var query = new URLSearchParams(window.location.search);
    var isEmbedMode = query.get("embed") === "1";
    var disableAutoScale = query.get("noscale") === "1";

    var lastViewportContent = "";

    function ensureViewportMeta() {
        var meta = document.querySelector('meta[name="viewport"]');
        if (!meta) {
            meta = document.createElement("meta");
            meta.name = "viewport";
            document.head.appendChild(meta);
        }
        return meta;
    }

    function setClassState(enabled) {
        document.documentElement.classList.toggle("scaled-mobile", enabled);
        if (document.body) {
            document.body.classList.toggle("scaled-mobile", enabled);
        }
    }

    function setEmbedState() {
        if (!isEmbedMode) {
            return;
        }

        document.documentElement.classList.add("embed-mode");
        if (document.body) {
            document.body.classList.add("embed-mode");
        }
    }

    function applyViewportMode() {
        var meta = ensureViewportMeta();
        var currentWidth = Math.min(
            window.innerWidth || document.documentElement.clientWidth,
            window.screen && window.screen.width ? window.screen.width : window.innerWidth
        );
        var useScaledMobile = currentWidth <= MOBILE_BREAKPOINT;

        setEmbedState();

        if (disableAutoScale) {
            setClassState(false);
            var disabledContent = "width=device-width, initial-scale=1.0, viewport-fit=cover";
            if (lastViewportContent !== disabledContent) {
                meta.setAttribute("content", disabledContent);
                lastViewportContent = disabledContent;
            }
            return;
        }

        if (!useScaledMobile) {
            setClassState(false);
            var desktopContent = "width=device-width, initial-scale=1.0, viewport-fit=cover";
            if (lastViewportContent !== desktopContent) {
                meta.setAttribute("content", desktopContent);
                lastViewportContent = desktopContent;
            }
            return;
        }

        var viewportWidth = isEmbedMode ? EMBED_VIEWPORT_WIDTH : DESKTOP_VIEWPORT_WIDTH;
        var initialScale = Math.min(1, currentWidth / viewportWidth);

        setClassState(true);
        document.documentElement.style.setProperty("--scaled-mobile-ratio", initialScale.toFixed(4));
        document.documentElement.style.setProperty("--scaled-viewport-width", String(viewportWidth));

        var mobileContent =
            "width=" + viewportWidth + ", initial-scale=" + initialScale.toFixed(4) + ", maximum-scale=5, user-scalable=yes, viewport-fit=cover";
        if (lastViewportContent !== mobileContent) {
            meta.setAttribute("content", mobileContent);
            lastViewportContent = mobileContent;
        }
    }

    // Apply as soon as the script loads to avoid first-paint flicker (e.g. hamburger flash).
    setEmbedState();
    applyViewportMode();

    document.addEventListener("DOMContentLoaded", function () {
        setEmbedState();
        applyViewportMode();
    });

    window.addEventListener("load", applyViewportMode);
    window.addEventListener("orientationchange", function () {
        window.setTimeout(applyViewportMode, 180);
    });
})();
