import { DateTime } from "luxon";
import config from "./src/_data/config.js";

const siteDate = (dateObj) =>
  DateTime.fromJSDate(dateObj).setZone(config.siteTimeZone);
const siteYear = (dateObj) => siteDate(dateObj).toFormat("yyyy");
const siteMonth = (dateObj) => siteDate(dateObj).toFormat("LL");
const siteYearMonth = (dateObj) => siteDate(dateObj).toFormat("yyyy-LL");

export default function (eleventyConfig) {
  // --- Passthrough copy ---
  eleventyConfig.addPassthroughCopy("assets");
  // Copy co-located images — remap from src/posts/YYYY/MM/DD/ to archive/by_date/YYYY/MM/DD/
  eleventyConfig.addPassthroughCopy(
    {
      "src/posts/": "archive/by_date/",
    },
    {
      filter: [
        "**/*.jpg",
        "**/*.jpeg",
        "**/*.png",
        "**/*.gif",
        "**/*.webp",
        "**/*.svg",
        "**/*.bmp",
      ],
    },
  );

  // --- Collections ---
  const POSTS_GLOB = "src/posts/**/index.md";

  // All day pages sorted newest first
  eleventyConfig.addCollection("days", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob(POSTS_GLOB)
      .sort((a, b) => b.date - a.date);
  });

  // Days grouped by year (for archive pages) — returns array of [year, days[]]
  eleventyConfig.addCollection("daysByYear", (collectionApi) => {
    const days = collectionApi
      .getFilteredByGlob(POSTS_GLOB)
      .sort((a, b) => b.date - a.date);

    const byYear = {};
    for (const day of days) {
      const year = siteYear(day.date);
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(day);
    }
    // Return array of [year, days] pairs, sorted newest year first
    return Object.entries(byYear).sort((a, b) => b[0].localeCompare(a[0]));
  });

  // Days grouped by year-month (for month pages) — returns array of [yearMonth, days[]]
  eleventyConfig.addCollection("daysByMonth", (collectionApi) => {
    const days = collectionApi
      .getFilteredByGlob(POSTS_GLOB)
      .sort((a, b) => b.date - a.date);

    const byMonth = {};
    for (const day of days) {
      const key = siteYearMonth(day.date);
      if (!byMonth[key]) byMonth[key] = [];
      byMonth[key].push(day);
    }
    // Return array of [yearMonth, days] pairs
    return Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0]));
  });

  // --- Filters ---

  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return siteDate(dateObj).toFormat("LLLL d, yyyy");
  });

  eleventyConfig.addFilter("readableDateTime", (dateObj) => {
    return siteDate(dateObj).toFormat("LLLL d, yyyy 'at' h:mm a");
  });

  eleventyConfig.addFilter("shortDate", (dateObj) => {
    return siteDate(dateObj).toFormat("LLL d, yyyy");
  });

  eleventyConfig.addFilter("isoDate", (dateObj) => {
    return siteDate(dateObj).toISO();
  });

  eleventyConfig.addFilter("rssDate", (dateObj) => {
    return siteDate(dateObj).toRFC2822();
  });

  eleventyConfig.addFilter("yearFromDate", (dateObj) => {
    return siteYear(dateObj);
  });

  eleventyConfig.addFilter("monthFromDate", (dateObj) => {
    return siteMonth(dateObj);
  });

  eleventyConfig.addFilter("uniqueMonths", (days) => {
    const months = [
      ...new Set(
        days.map((day) => siteMonth(day.date)),
      ),
    ];
    return months.sort();
  });

  eleventyConfig.addFilter("monthName", (monthNum) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[parseInt(monthNum, 10) - 1];
  });

  // Split a string
  eleventyConfig.addFilter("split", (str, sep) => {
    return (str || "").split(sep);
  });

  // For sitemap: absolute URL
  eleventyConfig.addFilter("absoluteUrl", (url, base) => {
    try {
      return new URL(url, base).href;
    } catch {
      return base + url;
    }
  });

  // --- Config ---
  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk"],
  };
}
