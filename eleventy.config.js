import { DateTime } from "luxon";

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

  // All day pages sorted newest first
  eleventyConfig.addCollection("days", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/posts/**/index.md")
      .sort((a, b) => b.date - a.date);
  });

  // Days grouped by year (for archive pages) — returns array of [year, days[]]
  eleventyConfig.addCollection("daysByYear", (collectionApi) => {
    const days = collectionApi
      .getFilteredByGlob("src/posts/**/index.md")
      .sort((a, b) => b.date - a.date);

    const byYear = {};
    for (const day of days) {
      const year = day.date.getFullYear().toString();
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(day);
    }
    // Return array of [year, days] pairs, sorted newest year first
    return Object.entries(byYear).sort((a, b) => b[0].localeCompare(a[0]));
  });

  // Days grouped by year-month (for month pages) — returns array of [yearMonth, days[]]
  eleventyConfig.addCollection("daysByMonth", (collectionApi) => {
    const days = collectionApi
      .getFilteredByGlob("src/posts/**/index.md")
      .sort((a, b) => b.date - a.date);

    const byMonth = {};
    for (const day of days) {
      const y = day.date.getFullYear().toString();
      const m = (day.date.getMonth() + 1).toString().padStart(2, "0");
      const key = `${y}-${m}`;
      if (!byMonth[key]) byMonth[key] = [];
      byMonth[key].push(day);
    }
    // Return array of [yearMonth, days] pairs
    return Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0]));
  });

  // --- Filters ---

  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(
      "LLLL d, yyyy",
    );
  });

  eleventyConfig.addFilter("shortDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(
      "LLL d, yyyy",
    );
  });

  eleventyConfig.addFilter("isoDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toISO();
  });

  eleventyConfig.addFilter("yearFromDate", (dateObj) => {
    return dateObj.getFullYear().toString();
  });

  eleventyConfig.addFilter("monthFromDate", (dateObj) => {
    return (dateObj.getMonth() + 1).toString().padStart(2, "0");
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
