import express from "express";
import "dotenv/config";

const app = express();
const PORT: number = Number(process.env.PORT || 3000);

app.get("/", (req, res) => {
  res.send("Welcome to Habits")
})

app.listen(PORT, () => {
  console.log(`Server is running on PORT: http://localhost:${PORT}`);
})