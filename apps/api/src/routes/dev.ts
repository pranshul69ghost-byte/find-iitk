import { Router } from "express";
import { Listing } from "../models/Listing.js";
import { User } from "../models/User.js";
import { faker } from "@faker-js/faker";

export const devRouter = Router();

devRouter.get("/seed", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Seeding disabled in production" });
  }

  const clear = String(req.query.clear || "0") === "1";
  const count = Number(req.query.count || 24);

  try {
    // Create/ensure a demo user exists
    const user = await User.findOneAndUpdate(
      { email: "demo@iitk.ac.in" },
      {
        email: "demo@iitk.ac.in",
        name: "Demo User",
        hostel: "Hall 1",
        department: "CSE",
        gradYear: 2026
      },
      { upsert: true, new: true }
    );

    if (clear) {
      await Listing.deleteMany({});
    }

    const types = ["lost", "found", "sale"] as const;
    const categories = ["Electronics", "Books", "Cycles", "Room Essentials", "Clothing", "Misc"];

    const img = (seed: string) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/400`;

    const docs = Array.from({ length: count }).map((_, i) => {
      const type = types[i % types.length];
      const category = categories[i % categories.length];

      const base = {
        type,
        title:
          type === "sale"
            ? faker.commerce.productName()
            : `${type === "lost" ? "Lost" : "Found"} ${faker.commerce.productAdjective()} ${faker.commerce.product()}`,
        description: faker.lorem.sentences({ min: 1, max: 2 }),
        category,
        images: [img(`${type}-${category}-${i}`)],
        ownerId: user._id,
        status: type === "sale" ? "active" : "active"
      } as any;

      if (type === "sale") {
        base.price = faker.number.int({ min: 100, max: 5000 });
        base.condition = faker.helpers.arrayElement(["new", "used"]);
        base.negotiable = faker.datatype.boolean();
      }

      return base;
    });

    const inserted = await Listing.insertMany(docs);
    res.json({ ok: true, inserted: inserted.length, cleared: clear, user: { id: user._id, email: user.email } });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message || "seed failed" });
  }
});