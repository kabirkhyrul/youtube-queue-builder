interface Video {
  videoId: string;
}

interface QueueResult {
  success: boolean;
  count?: number;
  url?: string;
  error?: string;
}

async function addCurrentVideosToQueue(
  videos: Video[] | null = null,
): Promise<QueueResult> {
  try {
    let videosToQueue = videos;

    // If no videos provided, get from storage (fallback)
    if (!videosToQueue) {
      const { videos: storedVideos = [] } =
        await chrome.storage.local.get("videos");
      videosToQueue = storedVideos;
    }

    const videoIds = videosToQueue?.map((v) => v.videoId).filter(Boolean) || [];

    if (!videoIds.length) throw new Error("No videos to queue.");

    const queueUrl = `https://www.youtube.com/watch_videos?video_ids=${videoIds.join(",")}`;
    await chrome.tabs.create({ url: queueUrl });

    return { success: true, count: videoIds.length, url: queueUrl };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id && tab.windowId) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.action === "test") {
    sendResponse({ success: true, message: "Background script is working" });
  } else if (request.action === "videosFound") {
    chrome.storage.local.set({ videos: request.videos });
    sendResponse({ success: true });
  } else if (request.action === "addCurrentToQueue") {
    addCurrentVideosToQueue(request.videos).then(sendResponse);
    return true;
  }
});
