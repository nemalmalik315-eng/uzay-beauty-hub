import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

async function seed() {
  const url = process.env.TURSO_DATABASE_URL || "file:uzay.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  console.log(`Seeding database at: ${url}`);

  const db = createClient({ url, authToken });

  // Create tables
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      duration INTEGER NOT NULL DEFAULT 30,
      description TEXT,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      service_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (service_id) REFERENCES services(id)
    );

    CREATE TABLE IF NOT EXISTS billing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER,
      customer_id INTEGER,
      customer_name TEXT NOT NULL,
      service_name TEXT NOT NULL,
      service_charge REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      min_threshold INTEGER NOT NULL DEFAULT 5,
      unit_price REAL NOT NULL DEFAULT 0,
      last_restocked TEXT
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  console.log("Tables created.");

  // Seed admin user
  const { rows: adminRows } = await db.execute("SELECT COUNT(*) as count FROM admin_users");
  if (Number(adminRows[0].count) === 0) {
    const hash = bcrypt.hashSync("admin123", 10);
    await db.execute({ sql: "INSERT INTO admin_users (username, password_hash) VALUES (?, ?)", args: ["admin", hash] });
    console.log("Admin user created (admin / admin123)");
  }

  // Seed services
  const { rows: serviceRows } = await db.execute("SELECT COUNT(*) as count FROM services");
  if (Number(serviceRows[0].count) === 0) {
    const services: [string, string, number, number, string][] = [
      ["Haircut & Style", "Hair", 50, 45, "Professional haircut with styling"],
      ["Blowout", "Hair", 40, 30, "Professional blowout styling"],
      ["Hair Spa", "Hair", 80, 60, "Deep conditioning hair spa treatment"],
      ["Per Foil", "Hair Color", 700, 10, "Per foil charge for hair coloring"],
      ["Hair Colour One Shade — Shoulder Length", "Hair Color", 6000, 90, "Single shade hair coloring for shoulder-length hair"],
      ["Hair Colour One Shade — Medium Length", "Hair Color", 8500, 120, "Single shade hair coloring for medium-length hair"],
      ["Hair Colour One Shade — Long Length", "Hair Color", 11500, 150, "Single shade hair coloring for long hair"],
      ["Highlights/Lowlights — Shoulder Length", "Hair Color", 8000, 120, "Highlights or lowlights for shoulder-length hair"],
      ["Highlights/Lowlights — Medium Length", "Hair Color", 10000, 150, "Highlights or lowlights for medium-length hair"],
      ["Highlights/Lowlights — Long Length", "Hair Color", 12000, 180, "Highlights or lowlights for long hair"],
      ["Highlights/Lowlights with Base Colour — Shoulder Length", "Hair Color", 10000, 150, "Highlights or lowlights with base colour for shoulder-length hair"],
      ["Highlights/Lowlights with Base Colour — Medium Length", "Hair Color", 12000, 180, "Highlights or lowlights with base colour for medium-length hair"],
      ["Highlights/Lowlights with Base Colour — Long Length", "Hair Color", 16000, 240, "Highlights or lowlights with base colour for long hair"],
      ["Keratin — Shoulder Length", "Hair Treatment", 10000, 120, "Smoothing keratin treatment for shoulder-length hair. Free hair trimming included."],
      ["Keratin — Medium Length", "Hair Treatment", 12000, 150, "Smoothing keratin treatment for medium-length hair. Free hair trimming included."],
      ["Keratin — Long Length", "Hair Treatment", 15000, 180, "Smoothing keratin treatment for long hair. Free hair trimming included."],
      ["Premium Brazilian Keratin — Shoulder Length", "Hair Treatment", 12000, 150, "Premium Brazilian keratin for shoulder-length hair. Free hair trimming included."],
      ["Premium Brazilian Keratin — Medium Length", "Hair Treatment", 15000, 180, "Premium Brazilian keratin for medium-length hair. Free hair trimming included."],
      ["Premium Brazilian Keratin — Long Length", "Hair Treatment", 20000, 240, "Premium Brazilian keratin for long hair. Free hair trimming included."],
      ["Rebounding — Shoulder Length", "Hair Treatment", 9000, 180, "Hair rebounding for shoulder-length hair. Free hair trimming included."],
      ["Rebounding — Medium Length", "Hair Treatment", 12000, 240, "Hair rebounding for medium-length hair. Free hair trimming included."],
      ["Rebounding — Long Length", "Hair Treatment", 15000, 300, "Hair rebounding for long hair. Free hair trimming included."],
      ["Premium Nanoplastia — Shoulder Length", "Hair Treatment", 12500, 150, "Premium nanoplastia for shoulder-length hair. Free hair trimming included."],
      ["Premium Nanoplastia — Medium Length", "Hair Treatment", 15000, 180, "Premium nanoplastia for medium-length hair. Free hair trimming included."],
      ["Premium Nanoplastia — Long Length", "Hair Treatment", 22000, 240, "Premium nanoplastia for long hair. Free hair trimming included."],
      ["Signature Protein Treatment — Short", "Hair Treatment", 5000, 60, "Signature protein treatment (50% straightening) for short hair. Free hair trimming included."],
      ["Signature Protein Treatment — Medium", "Hair Treatment", 8000, 90, "Signature protein treatment (50% straightening) for medium-length hair. Free hair trimming included."],
      ["Herbal Facial", "Facials", 1500, 60, "Cleansing, polisher, scrubbing, massage, mask"],
      ["Whitening Facial", "Facials", 2000, 60, "Cleansing, polisher, scrubbing, massage, mask"],
      ["Ultra Whitening Facial", "Facials", 3000, 90, "Double cleansing, gold polisher, scrubbing, manual scrubber tool, roller, gua sha, whitening serum, massage, mask, shoulder massage"],
      ["Gold Facial", "Facials", 3000, 90, "Double cleansing, gold polisher, scrubbing, manual scrubber tool, roller, gua-sha, whitening serum, massage, mask, shoulder massage"],
      ["Janssen Facial", "Facials", 5000, 90, "Skin analyser, double cleansing, gold polisher, scrubbing, manual scrubber tool, roller, gua-sha, whitening impulse, massage, collagen/sheet mask, shoulder massage, cool hammer for open pores"],
      ["Mini Hydra Facial", "Facials", 4000, 75, "Skin analyser, cleansing, ammonia free polisher, abrasion, scrubber, RF, manual massage, collagen mask, cool hammer for open pores"],
      ["Advanced Hydra Facial", "Facials", 6000, 90, "Double cleansing, ammonia free polisher, abrasion, scrubber, 3 types of RF, ultrasonic tool, LED mask, skin analyser, manual scrubbing and massage with serum, sheet mask, cool hammer, shoulder massage, hand feet polisher"],
      ["Korean Facial", "Facials", 4000, 75, "Korean skincare techniques with premium products"],
      ["Simple Cleansing", "Cleansing", 300, 20, "Basic skin cleansing"],
      ["Relaxing Cleansing", "Cleansing", 600, 30, "Cleansing with massage"],
      ["Deep Cleansing", "Cleansing", 1000, 45, "Cleansing, scrubbing, mask"],
      ["Janssen Deep Cleansing", "Cleansing", 2000, 60, "Cleansing, scrubbing, mask, blackhead removal with manual scrubber"],
      ["Polisher", "Polisher", 800, 30, "Cleansing, polisher, mask"],
      ["Gold Polisher", "Polisher", 1500, 45, "Cleansing, scrubbing, short massage, gold/zafrani polisher, mask"],
      ["Hand Feet Polisher", "Polisher", 300, 20, "Hand and feet polishing treatment"],
      ["Half Arms + Capri Legs Polisher", "Polisher", 500, 30, "Half arms and capri legs polishing"],
      ["Full Arms + Half Legs Polisher", "Polisher", 1000, 45, "Full arms polisher and half legs"],
      ["Full Body Polisher", "Polisher", 4000, 90, "Complete full body polishing treatment"],
      ["Deep Nail Cleaning", "Manicure & Pedicure", 1000, 30, "Deep nail cleaning, no dipping"],
      ["Whitening Manicure & Pedicure", "Manicure & Pedicure", 2000, 60, "Scrubbing, heel cleaning, hand feet polisher, nail cleaning, scrubbing, massage"],
      ["Premium Manicure & Pedicure", "Manicure & Pedicure", 2500, 75, "Hand feet polisher, coffee scrubbing, deep nail cleaning, heel cleaning, paraffin wax, massage"],
      ["Jelly Manicure & Pedicure", "Manicure & Pedicure", 3000, 90, "Relaxing jelly dipping, hand feet polisher, coffee scrubbing, deep nail cleaning, heel cleaning, mask, massage"],
      ["Single Application (Liner/Lipstick/Lashes)", "Makeup", 300, 15, "Individual application — liner, lipstick, lashes etc."],
      ["Eye Makeup with Lashes", "Makeup", 2000, 30, "Complete eye makeup with lashes"],
      ["Base Application", "Makeup", 2000, 30, "Base makeup application"],
      ["Soft Glam (with Hairdo & Lashes)", "Makeup", 5000, 60, "Soft glam look with hairdo and lashes"],
      ["Glam Look", "Makeup", 8000, 75, "Full glam makeup look"],
      ["Signature Glam Look", "Makeup", 10000, 90, "Signature glamorous makeup look"],
      ["Half Arm Wax — Sugar", "Body Waxing", 300, 15, "Sugar wax half arms"],
      ["Half Arm Wax — Rica Fruit", "Body Waxing", 500, 15, "Rica fruit wax half arms"],
      ["Full Arm Wax — Sugar", "Body Waxing", 600, 20, "Sugar wax full arms"],
      ["Full Arm Wax — Rica Fruit", "Body Waxing", 1000, 20, "Rica fruit wax full arms"],
      ["Half Legs Wax — Sugar", "Body Waxing", 500, 20, "Sugar wax half legs"],
      ["Half Legs Wax — Rica Fruit", "Body Waxing", 500, 20, "Rica fruit wax half legs"],
      ["Full Legs Wax — Sugar", "Body Waxing", 1000, 30, "Sugar wax full legs"],
      ["Full Legs Wax — Rica Fruit", "Body Waxing", 1400, 30, "Rica fruit wax full legs"],
      ["Underarms Wax — Sugar", "Body Waxing", 200, 10, "Sugar wax underarms"],
      ["Underarms Wax — Rica Fruit", "Body Waxing", 300, 10, "Rica fruit wax underarms"],
      ["Back Wax — Sugar", "Body Waxing", 1000, 20, "Sugar wax back"],
      ["Back Wax — Rica Fruit", "Body Waxing", 1200, 20, "Rica fruit wax back"],
      ["Front Wax — Sugar", "Body Waxing", 1000, 20, "Sugar wax front"],
      ["Front Wax — Rica Fruit", "Body Waxing", 1200, 20, "Rica fruit wax front"],
      ["Neck Wax — Sugar", "Body Waxing", 500, 10, "Sugar wax neck"],
      ["Neck Wax — Rica Fruit", "Body Waxing", 700, 10, "Rica fruit wax neck"],
      ["Upper Lip Wax", "Face Waxing", 100, 5, "Hot wax upper lip"],
      ["Lower Lip Wax", "Face Waxing", 100, 5, "Hot wax lower lip"],
      ["Chin Wax", "Face Waxing", 100, 5, "Hot wax chin"],
      ["Face Side Wax", "Face Waxing", 200, 10, "Hot wax face sides"],
      ["Forehead Wax", "Face Waxing", 150, 5, "Hot wax forehead"],
      ["Eyebrow Wax", "Face Waxing", 200, 10, "Hot wax eyebrow shaping"],
      ["Full Face Wax", "Face Waxing", 800, 20, "Complete face waxing"],
      ["Full Face + Neck Wax", "Face Waxing", 1000, 25, "Complete face and neck waxing"],
      ["Baby Hair Cut (Under 3 Years)", "Kids", 500, 20, "Hair cut for babies under 3 years"],
      ["Baby Hair Cut (Above 3 Years)", "Kids", 500, 20, "Hair cut for kids above 3 years"],
      ["Kids Any Cut", "Kids", 1000, 30, "Any hair cut style for kids"],
      ["Kids Any Cut (Long Length)", "Kids", 1500, 40, "Any hair cut for long length hair"],
      ["Kids Front Styling (Under 5 Years)", "Kids", 500, 15, "Front hair styling for kids under 5"],
      ["Kids Full Head Styling", "Kids", 1000, 30, "Complete head hair styling for kids"],
      ["Kids Manicure & Pedicure", "Kids", 1000, 30, "Manicure and pedicure for kids"],
      ["Kids Makeup", "Kids", 1500, 30, "Makeup for kids"],
      ["Kids Makeup + Hairdo", "Kids", 2500, 60, "Complete makeup and hair styling for kids"],
      ["Engagement (Assistant Bridal)", "Bridal", 15000, 90, "Assistant bridal engagement makeup"],
      ["Nikkah (Assistant Bridal)", "Bridal", 15000, 90, "Assistant bridal nikkah makeup"],
      ["Mehndi (Assistant Bridal)", "Bridal", 15000, 90, "Assistant bridal mehndi makeup"],
      ["Main Day Bride (Assistant)", "Bridal", 25000, 180, "Assistant bridal main day — without services"],
      ["Reception Bride (Assistant)", "Bridal", 25000, 120, "Assistant bridal reception makeup"],
      ["Engagement (Signature Bridal)", "Bridal", 20000, 90, "Signature bridal engagement makeup"],
      ["Nikkah (Signature Bridal)", "Bridal", 20000, 90, "Signature bridal nikkah makeup"],
      ["Mehndi (Signature Bridal)", "Bridal", 20000, 90, "Signature bridal mehndi makeup"],
      ["Signature Bride — Without Services", "Bridal", 35000, 180, "Signature bride main day without additional services"],
      ["Signature Bride — Package 1", "Bridal", 40000, 300, "Whitening facial, whitening mani pedi, half arm & half legs wax, eyebrow & upper lips threading"],
      ["Signature Bride — Premium Package", "Bridal", 50000, 360, "Hydra facial, premium mani pedi, full body wax, eyebrow & upper lips threading, hair protein wash, hair trimming"],
      ["Reception Bride (Signature)", "Bridal", 35000, 120, "Signature bridal reception makeup"],
    ];

    for (const s of services) {
      await db.execute({
        sql: "INSERT INTO services (name, category, price, duration, description) VALUES (?, ?, ?, ?, ?)",
        args: s,
      });
    }
    console.log(`${services.length} services seeded.`);
  }

  // Seed stock items
  const { rows: stockRows } = await db.execute("SELECT COUNT(*) as count FROM stock");
  if (Number(stockRows[0].count) === 0) {
    const items: [string, string, number, number, number][] = [
      ["Shampoo - Professional", "Hair Products", 20, 5, 15.0],
      ["Conditioner - Premium", "Hair Products", 18, 5, 12.0],
      ["Hair Color - Black", "Hair Products", 30, 10, 8.0],
      ["Hair Color - Brown", "Hair Products", 25, 10, 8.0],
      ["Keratin Solution", "Hair Products", 10, 3, 45.0],
      ["Face Wash", "Skin Products", 15, 5, 10.0],
      ["Facial Cream - Gold", "Skin Products", 12, 3, 25.0],
      ["Moisturizer", "Skin Products", 20, 5, 8.0],
      ["Sunscreen SPF 50", "Skin Products", 18, 5, 12.0],
      ["Nail Polish Set", "Nail Products", 25, 5, 5.0],
      ["Gel Polish Kit", "Nail Products", 15, 3, 18.0],
      ["Acrylic Powder", "Nail Products", 10, 3, 20.0],
      ["Wax Strips", "Waxing", 50, 10, 3.0],
      ["Wax Heater Beans", "Waxing", 20, 5, 8.0],
      ["Cotton Pads", "General", 40, 10, 2.0],
      ["Disposable Gloves", "General", 100, 20, 1.5],
      ["Towels", "General", 30, 10, 5.0],
      ["Makeup Brushes Set", "Makeup", 8, 2, 35.0],
      ["Foundation - Various", "Makeup", 20, 5, 15.0],
      ["Lipstick Collection", "Makeup", 25, 5, 8.0],
    ];

    for (const item of items) {
      await db.execute({
        sql: "INSERT INTO stock (product_name, category, quantity, min_threshold, unit_price) VALUES (?, ?, ?, ?, ?)",
        args: item,
      });
    }
    console.log(`${items.length} stock items seeded.`);
  }

  console.log("Seed complete!");
}

seed().catch(console.error);
