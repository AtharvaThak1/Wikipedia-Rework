import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import searchRoute from "./routes/search.route.js";
import summaryRoute from "./routes/summary.route.js";
import detailRoute from "./routes/detail.route.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api", searchRoute);
app.use("/api", summaryRoute);
app.use("/api", detailRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
