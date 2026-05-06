import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Weather Proxy API
  app.get("/api/weather", async (req, res) => {
    const { lat, lon, city } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey || apiKey === "YOUR_OPENWEATHER_API_KEY" || apiKey.trim() === "") {
      console.warn("Weather API key not configured or empty. Using fallback simulation data.");
      return res.json({
        main: { temp: 22 },
        weather: [{ main: "Clear" }],
        name: "Studio City (Simulation)"
      });
    }

    try {
      let url = `https://api.openweathermap.org/data/2.5/weather?appid=${apiKey.trim()}&units=metric`;
      if (lat && lon) {
        url += `&lat=${lat}&lon=${lon}`;
      } else if (city) {
        url += `&q=${city}`;
      } else {
        return res.status(400).json({ error: "Location parameters missing" });
      }

      const response = await axios.get(url);
      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;
      
      console.error(`Weather API Error [${status}]:`, data || error.message);
      
      if (status === 401) {
        console.warn("Invalid OpenWeather API Key. Falling back to simulation mode.");
        return res.json({
          main: { temp: 24 },
          weather: [{ main: "Partly Cloudy" }],
          name: "Paris (Aura Simulation)"
        });
      }
      
      res.status(status || 500).json({ error: "Failed to fetch weather data" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
