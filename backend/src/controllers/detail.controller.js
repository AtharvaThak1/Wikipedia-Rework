import axios from "axios";
import * as cheerio from "cheerio";

export const details = async (req, res) => {
  try {
    // Get title from params
    const { title } = req.params;

    // Validate title
    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    // Encode title
    const encodedTitle = encodeURIComponent(title.trim());

    /*
      ==========================================
      FETCH SUMMARY DATA
      ==========================================
    */

    const summaryResponse = await axios.get(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`,
      {
        headers: {
          "User-Agent": "KnowledgeApp/1.0",
        },
      },
    );

    /*
      ==========================================
      FETCH FULL ARTICLE HTML
      ==========================================
    */

    const parseResponse = await axios.get(
      `https://en.wikipedia.org/w/api.php?action=parse&page=${encodedTitle}&prop=text&format=json`,
      {
        headers: {
          "User-Agent": "KnowledgeApp/1.0",
        },
      },
    );

    // Extract HTML
    const html = parseResponse.data.parse.text["*"];

    // Load into cheerio
    const $ = cheerio.load(html);

    /*
      ==========================================
      CLEAN UNWANTED ELEMENTS
      ==========================================
    */

    $(
      `
      table.infobox,
      table.vertical-navbox,
      table.navbox,
      .mw-editsection,
      .reference,
      .reflist,
      sup,
      style,
      script
      `,
    ).remove();

    /*
      ==========================================
      EXTRACT PARAGRAPHS
      ==========================================
    */

    const paragraphs = [];

    $("p").each((_, element) => {
      const text = $(element).text().trim();

      if (text.length > 80) {
        paragraphs.push(text);
      }
    });

    /*
      ==========================================
      EXTRACT HEADINGS
      ==========================================
    */

    const headings = [];

    $("h2, h3").each((_, element) => {
      const text = $(element).text().trim();

      if (text) {
        headings.push(text);
      }
    });

    /*
      ==========================================
      EXTRACT BULLET POINTS
      ==========================================
    */

    const bulletPoints = [];

    $("ul li").each((_, element) => {
      const text = $(element).text().trim();

      if (text.length > 20) {
        bulletPoints.push(text);
      }
    });

    /*
      ==========================================
      EXTRACT TABLES
      ==========================================
    */

    const tables = [];

    $("table.wikitable").each((_, table) => {
      const rows = [];

      $(table)
        .find("tr")
        .each((_, row) => {
          const cols = [];

          $(row)
            .find("th, td")
            .each((_, cell) => {
              cols.push($(cell).text().trim());
            });

          if (cols.length > 0) {
            rows.push(cols);
          }
        });

      if (rows.length > 0) {
        tables.push(rows);
      }
    });

    /*
      ==========================================
      EXTRACT LINKS
      ==========================================
    */

    const links = [];

    $("a").each((_, element) => {
      const href = $(element).attr("href");
      const text = $(element).text().trim();

      if (
        href &&
        href.startsWith("/wiki/") &&
        !href.includes(":") &&
        text.length > 1
      ) {
        links.push({
          title: text,
          url: `https://en.wikipedia.org${href}`,
        });
      }
    });

    // Remove duplicate links
    const uniqueLinks = Array.from(
      new Map(links.map((item) => [item.url, item])).values(),
    ).slice(0, 30);

    /*
      ==========================================
      EXTRACT IMAGES
      ==========================================
    */

    const images = [];

    $("img").each((_, element) => {
      let src = $(element).attr("src");

      if (src) {
        if (src.startsWith("//")) {
          src = `https:${src}`;
        }

        if (src.includes("upload.wikimedia.org") && !src.includes(".svg")) {
          images.push(src);
        }
      }
    });

    // Remove duplicate images
    const uniqueImages = [...new Set(images)].slice(0, 15);

    /*
      ==========================================
      SUMMARY DATA
      ==========================================
    */

    const summaryData = summaryResponse.data;

    const mainImage =
      summaryData.originalimage?.source ||
      summaryData.thumbnail?.source ||
      uniqueImages[0] ||
      null;

    /*
      ==========================================
      FINAL RESPONSE
      ==========================================
    */

    return res.status(200).json({
      success: true,

      topic: {
        title: summaryData.title,
        description: summaryData.description || null,

        summary: summaryData.extract || null,

        image: mainImage,

        articleUrl: summaryData.content_urls?.desktop?.page || null,

        pageid: summaryData.pageid || null,

        lastUpdated: summaryData.timestamp || null,

        headings,

        paragraphs: paragraphs.slice(0, 50),

        bulletPoints: bulletPoints.slice(0, 50),

        tables,

        relatedLinks: uniqueLinks,

        images: uniqueImages,
      },
    });
  } catch (error) {
    console.error("Topic Details Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch topic details",
      error: error.message,
    });
  }
};
