import axios from "axios";

export const summary = async (req, res) => {
  try {
    const { title } = req.body;

    // Validate title
    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    // Encode title properly
    const encodedTitle = encodeURIComponent(title.trim());

    // Wikipedia Summary API
    const response = await axios.get(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`,
      {
        headers: {
          "User-Agent": "KnowledgeApp/1.0",
        },
      },
    );

    // Extract useful data
    const data = response.data;

    // Better image handling
    const image = data.originalimage?.source || data.thumbnail?.source || null;

    // Clean response
    return res.status(200).json({
      success: true,

      topic: {
        title: data.title,
        description: data.description || null,
        summary: data.extract || null,
        image,
        articleUrl: data.content_urls?.desktop?.page || null,
        pageid: data.pageid,
        timestamp: data.timestamp,
      },
    });
  } catch (error) {
    console.error("Summary Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
