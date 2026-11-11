import "dotenv/config";
import { embedQuery } from "../../src/modules/ai/rag/embedding.service";

embedQuery("ما هو البناء الضوئي؟")
  .then((v) => console.log("length:", v.length, "first 3:", v.slice(0, 3)))
  .catch((e) => console.error("FAILED:", e));