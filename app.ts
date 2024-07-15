import express from "express";
import path from "path";
import os from "os";
import type { APODImage } from "./types";

const app = express();
const port = process.env.PORT || 3000;
const message = process.env.CUSTOM_MESSAGE || "";

const volumePath = process.env.VOLUME_PATH || "./data";
const imagePath = path.join(volumePath, "images");
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

const health = {
  status: 200,
  message: "OK",
};
app.get("/healthz", (req, res) =>
  res.status(health.status).send(health.message),
);

app.get("/set-health", (req, res) => {
  const status = req.query.status as string | undefined;
  const message = req.query.message as string | undefined;

  if (status) {
    const statusNum = parseInt(status);
    health.status = statusNum;
  }

  if (message) {
    health.message = message;
  }

  res.status(200).json({
    message: "Health state updated",
    currentState: health,
  });
});

app.get("/", async (req, res) => {
  const data = await loadData();
  res.render("index", {
    title: "APOD Clone",
    today: data[0] || "",
    message,
    data,
    hostname,
  });
});

app.get("/:date", async (req, res) => {
  const data = await loadData();
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

const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});
