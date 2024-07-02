import express from "express";
import path from "path";
import os from "os";
import type { APODImage } from "./types";

const app = express();
const port = process.env.PORT || 3000;
const message = process.env.CUSTOM_MESSAGE || "Hello from the config map";

const volumePath = process.env.VOLUME_PATH || "./data";
const imagePath = path.join(volumePath, "images");
const data = await loadData();
const hostname = os.hostname();

async function loadData(): Promise<APODImage[]> {
  try {
    const dataFile = Bun.file(path.join(volumePath, "data.json"));
    return await dataFile.json();
  } catch (err) {
    console.error("Failed to load data.json: ", err);
    return [];
  }
}

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use("/images", express.static(imagePath));

app.get("/", (req, res) => {
  res.render("index", {
    title: "APOD Clone",
    today: data[0],
    message,
    data,
    hostname,
  });
});

app.get("/:date", (req, res) => {
  const today = data.find((d) => d.date === req.params.date);
  if (!today) {
    res.status(404).send("There is no image for this date.");
    return;
  }
  res.render("index", {
    title: `${today.title} - APOD Clone`,
    today,
    message,
    data,
    hostname,
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
