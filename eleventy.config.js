module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");

  // Date formatting filter (YYYY-MM-DD for 8-bit terminal clarity)
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    if (!dateObj) return "1989-01-01";
    const d = new Date(dateObj);
    return d.toISOString().split("T")[0];
  });

  eleventyConfig.addFilter("isoDate", (dateObj) => {
    if (!dateObj) return new Date().toISOString();
    return new Date(dateObj).toISOString();
  });

  // Reading time & byte size filters for 8-bit HUD metadata
  eleventyConfig.addFilter("readingTime", (content) => {
    if (!content) return "1 min read";
    const text = String(content).replace(/<[^>]*>/g, "");
    const words = text.trim().split(/\s+/).length;
    const mins = Math.max(1, Math.ceil(words / 200));
    return `${mins} min read`;
  });

  eleventyConfig.addFilter("byteSize", (content) => {
    if (!content) return "512 B";
    const bytes = Buffer.byteLength(String(content), "utf8");
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  });

  eleventyConfig.addFilter("rawBytes", (content) => {
    if (!content) return 512;
    return Buffer.byteLength(String(content), "utf8");
  });

  // Convert HTML content into clean terminal-friendly plain text / markdown-like output
  eleventyConfig.addFilter("terminalText", (html) => {
    if (!html) return "";
    let text = String(html);
    // Format headings
    text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gis, "\n# $1\n========================================\n");
    text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gis, "\n## $1\n----------------------------------------\n");
    text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gis, "\n### $1\n");
    // Format code blocks
    text = text.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, "\n----------------------------------------\n$1\n----------------------------------------\n");
    // Format list items
    text = text.replace(/<li[^>]*>(.*?)<\/li>/gis, "  * $1\n");
    // Format paragraphs and line breaks
    text = text.replace(/<\/p>/gi, "\n\n");
    text = text.replace(/<br\s*\/?>/gi, "\n");
    // Format links as text [url]
    text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gis, "$2 ($1)");
    // Strip remaining tags
    text = text.replace(/<[^>]+>/g, "");
    // Decode basic HTML entities
    text = text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&mdash;/g, "--")
      .replace(/&ndash;/g, "-")
      .replace(/&rarr;/g, "->")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return text;
  });

  eleventyConfig.addFilter("limit", (arr, count) => {
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, count);
  });

  eleventyConfig.addFilter("excludeTag", (tags, excluded) => {
    if (!Array.isArray(tags)) return [];
    return tags.filter((t) => t !== excluded && t !== "blog" && t !== "stuff");
  });

  // Collections
  eleventyConfig.addCollection("blog", (collectionApi) => {
    return collectionApi.getFilteredByGlob("src/blog/*.md").sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("stuff", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/stuff/*.md")
      .sort((a, b) => (a.data.order || 99) - (b.data.order || 99));
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
