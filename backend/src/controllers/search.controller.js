import axios from "axios";

export const search = async (req, res) => {
  try {
    // Query params
    let { query, page = 1, limit = 10 } = req.query;

    // Validate query
    if (!query || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    // Convert to numbers
    page = Number(page);
    limit = Number(limit);

    // Validate pagination values
    if (page < 1 || limit < 1) {
      return res.status(400).json({
        success: false,
        message: "Page and limit must be greater than 0",
      });
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Encode query
    const encodedQuery = encodeURIComponent(query.trim());

    // Wikipedia Search API
    const response = await axios.get(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodedQuery}&format=json&srlimit=${limit}&sroffset=${offset}`,
      {
        headers: {
          "User-Agent": "KnowledgeApp/1.0",
        },
      },
    );

    // Extract search results
    const searchResults = response.data.query.search;

    // Clean and format results
    const results = searchResults.map((item) => ({
      title: item.title,

      // Remove HTML tags
      snippet: item.snippet.replace(/<[^>]*>/g, ""),

      pageid: item.pageid,
      wordcount: item.wordcount,
      timestamp: item.timestamp,
    }));

    // Total hits from Wikipedia
    const totalResults = response.data.query.searchinfo.totalhits;

    // Total pages
    const totalPages = Math.ceil(totalResults / limit);

    // Final response
    res.status(200).json({
      success: true,
      query,
      page,
      limit,
      totalResults,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      results,
    });
  } catch (error) {
    console.error("Search Error:", error.message);

    res.status(500).json({
      success: false,
      message: "An error occurred while searching",
      error: error.message,
    });
  }
};
