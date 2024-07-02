import path from "path";
import type { APODImage } from "./types";

/*
 * Required field (use DEMO_KEY if you don't want to register one)
 * Register here: https://api.nasa.gov/#signUp
 */
const apiKey = process.env.NASA_API_KEY;

/*
 * Note that the DEMO_KEY has a pretty tight rate limit of 30 req/hour
 * and 50 req/day
 */
const fetchDays = parseInt(process.env.FETCH_DAYS || "10", 10);

if (!apiKey) {
  throw new Error(
    "NASA_API_KEY environment variable is not set. Either set it to DEMO_KEY or register your own at https://api.nasa.gov/#signUp",
  );
}

const volumePath = process.env.VOLUME_PATH || "./data";
const imagePath = path.join(volumePath, "images");

type APODResponse = {
  date: string;
  explanation: string;
  hdurl: string;
  media_type: string;
  title: string;
  url: string;
};

async function fetchAPOD(date: string): Promise<APODResponse> {
  const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${date}`;
  const resp = await fetch(url);
  return await resp.json();
}

function dateToCorrectFormat(date: Date): string {
  return date.toISOString().split("T")[0];
}

async function fetchAndSaveImage(image: APODResponse) {
  const resp = await fetch(image.hdurl);
  if (!resp.ok) {
    throw new Error(`Error: ${resp.status}`);
  }

  const blob = await resp.blob();
  const filePath = path.join(imagePath, `${image.date}.jpg`);
  await Bun.write(filePath, blob);
  return filePath;
}

async function writeDataToJSON(data: APODImage[]) {
  const filePath = path.join(volumePath, "data.json");
  await Bun.write(filePath, JSON.stringify(data));
}

async function main() {
  const data: APODImage[] = [];
  for (let i = 0; i < fetchDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = dateToCorrectFormat(date);
    const resp = await fetchAPOD(dateStr);
    if (resp.media_type !== "image") continue;
    const image = await fetchAndSaveImage(resp);
    data.push({
      title: resp.title,
      description: resp.explanation,
      image: image,
      date: dateStr,
    });
  }

  await writeDataToJSON(data);
  console.log(`Successfully saved ${data.length} images to ${imagePath}`);
}

main().catch((err) => {
  console.error("Error occurred: ", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception thrown:", error);
  process.exit(1);
});
