import { Router, Request, Response } from "express";

const router = Router();

interface ProductSearchHit {
  id: string;
  title: string;
  description: string;
}

interface MeilisearchResponse<T> {
  hits: T[];
  offset: number;
  limit: number;
  processingTimeMs: number;
  query: string;
}

router.get("/", async (req: Request, res: Response) => {
  const q = req.query.q as string;

  if (!q) {
    res.status(400).json({ message: "Missing search query" });
    return;
  }

  const response = await fetch(`${process.env.MEILISEARCH_HOST || "http://localhost:7700"}/indexes/product/search`, {
    method: "POST",
    headers: {
      "X-Meili-API-Key": process.env.MEILISEARCH_API_KEY || "masterKey",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q }),
  });

  const data = (await response.json()) as MeilisearchResponse<ProductSearchHit>;

  res.json(data);
});

export default router;
