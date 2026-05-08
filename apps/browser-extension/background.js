/* global chrome */

let courseHubWindowId = null;

async function openCourseHubPopup() {
    if (courseHubWindowId !== null) {
        try {
            await chrome.windows.update(courseHubWindowId, { focused: true });
            return;
        } catch {
            courseHubWindowId = null;
        }
    }

    const win = await chrome.windows.create({
        url: "https://coursehub.hu",
        type: "popup",
        width: 450,
        height: 800
    });

    courseHubWindowId = win.id;
}

async function openCourseHubTab() {
    await chrome.tabs.create({
        url: "https://coursehub.hu"
    });
}

chrome.commands.onCommand.addListener((command, tab) => {
    if (command === "open-coursehub-popup") {
        openCourseHubPopup();
    }

    if (command === "open-coursehub-tab") {
        openCourseHubTab();
    }

    if (command === "open-coursehub-sidepanel") {
        chrome.sidePanel.open({ windowId: tab.windowId });
    }
});

chrome.action.onClicked.addListener(() => {
    openCourseHubPopup();
});

chrome.windows.onRemoved.addListener((windowId) => {
    if (windowId === courseHubWindowId) {
        courseHubWindowId = null;
    }
});
