import path from "path";
import type { APODImage } from "./types";

const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";
const fetchDays = 10;

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

await main();
