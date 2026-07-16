import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

type ExtractedVideo = {
  videoId: string;
  title: string;
  duration: string;
  channel: string;
  metadata: string[];
  thumbnail: string;
  description: string;
  official: boolean;
};

const normalize = (value: string): string => value.replace(/\s+/g, " ").trim();

const extractFixture = async (path: string, rich: boolean): Promise<ExtractedVideo[]> => {
  const html = readFileSync(path, "utf8");
  const tag = rich ? "ytd-rich-item-renderer" : "ytd-video-renderer";
  const videos: ExtractedVideo[] = [];
  let current: ExtractedVideo | undefined;

  const append = (field: "duration" | "channel" | "description", value: string): void => {
    if (current) current[field] += value;
  };

  const rewriter = new HTMLRewriter()
    .on(tag, {
      element(element) {
        current = { videoId: "", title: "", duration: "", channel: "", metadata: [], thumbnail: "", description: "", official: false };
        element.onEndTag(() => {
          if (current?.videoId) {
            const duration = current.duration.match(/\d+:\d{2}(?::\d{2})?/);
            videos.push({ ...current, title: normalize(current.title), duration: duration?.[0] ?? "", channel: normalize(current.channel), description: normalize(current.description) });
          }
          current = undefined;
        });
      },
    })
    .on(rich ? "[class*='content-id-']" : "a#thumbnail", {
      element(element) {
        if (!current) return;
        const source = rich ? element.getAttribute("class") ?? "" : element.getAttribute("href") ?? "";
        const id = source.match(rich ? /content-id-([a-zA-Z0-9_-]{11})/ : /[?&]v=([a-zA-Z0-9_-]{11})/);
        if (id) current.videoId = id[1];
      },
    })
    .on(rich ? "h3.ytLockupMetadataViewModelHeadingReset" : "a#video-title", {
      element(element) {
        if (current) current.title = element.getAttribute("title") ?? "";
      },
    })
    .on(".ytBadgeShapeText", { text(element) { append("duration", element.text); } })
    .on(rich ? "a.ytAttributedStringLink" : "ytd-channel-name a", { text(element) { append("channel", element.text); } })
    .on(rich ? "span.ytContentMetadataViewModelMetadataText" : "span.inline-metadata-item", {
      text(element) { if (current && element.text) current.metadata.push(normalize(element.text)); },
    })
    .on(rich ? ".ytThumbnailViewModelImage img" : "ytd-thumbnail img", {
      element(element) { if (current) current.thumbnail = element.getAttribute("src") ?? ""; },
    })
    .on(".metadata-snippet-text", { text(element) { append("description", element.text); } })
    .on('[aria-label="Official Artist Channel"]', { element() { if (current) current.official = true; } });

  await rewriter.transform(new Response(html)).text();
  return videos;
};

test("Bun extracts complete records from the search-results fixture", async () => {
  const videos = await extractFixture("youtube-pages/results-page.html", false);

  expect(videos).toHaveLength(23);
  expect(videos.every((video) => /^[a-zA-Z0-9_-]{11}$/.test(video.videoId))).toBe(true);
  expect(videos.every((video) => video.title.length > 0)).toBe(true);
  expect(videos.every((video) => /^\d+:\d{2}(?::\d{2})?$/.test(video.duration))).toBe(true);
  expect(videos.every((video) => video.channel.length > 0)).toBe(true);
  expect(videos.every((video) => video.metadata.some((item) => /views?/i.test(item)))).toBe(true);
  expect(videos.every((video) => video.metadata.some((item) => /ago/i.test(item)))).toBe(true);
  expect(videos.every((video) => video.thumbnail === "" || video.thumbnail.startsWith("https://"))).toBe(true);
  expect(videos.every((video) => video.description.length > 0)).toBe(true);
  expect(videos.some((video) => video.official)).toBe(true);
});

test.each([
  ["youtube-pages/homepage.html", 26],
  ["youtube-pages/channels-video-tab.html", 30],
] as const)("Bun extracts complete rich-card records from %s", async (path, count) => {
  const videos = await extractFixture(path, true);

  expect(videos).toHaveLength(count);
  expect(videos.every((video) => /^[a-zA-Z0-9_-]{11}$/.test(video.videoId))).toBe(true);
  expect(videos.every((video) => video.title.length > 0)).toBe(true);
  expect(videos.every((video) => /^\d+:\d{2}(?::\d{2})?$/.test(video.duration))).toBe(true);
  expect(videos.every((video) => video.metadata.some((item) => /views?/i.test(item)))).toBe(true);
  expect(videos.every((video) => video.metadata.some((item) => /ago/i.test(item)))).toBe(true);
  expect(videos.every((video) => video.thumbnail === "" || video.thumbnail.startsWith("https://"))).toBe(true);
});

test("channel fixtures preserve the rich-card optional fields behavior", async () => {
  const videos = await extractFixture("youtube-pages/channels-video-tab.html", true);

  expect(videos.some((video) => video.channel === "")).toBe(true);
  expect(videos.every((video) => video.description === "")).toBe(true);
  expect(videos.every((video) => !video.official)).toBe(true);
});
