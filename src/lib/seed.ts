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
      ["Hair Coloring", "Hair", 120, 90, "Full hair coloring with premium products"],
      ["Highlights", "Hair", 150, 120, "Partial or full highlights"],
      ["Keratin Treatment", "Hair", 200, 150, "Smoothing keratin treatment"],
      ["Blowout", "Hair", 40, 30, "Professional blowout styling"],
      ["Hair Spa", "Hair", 80, 60, "Deep conditioning hair spa treatment"],
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
      ["Party Makeup", "Makeup", 80, 60, "Glamorous party-ready makeup"],
      ["Bridal Makeup", "Makeup", 250, 120, "Complete bridal makeup package"],
      ["Engagement Makeup", "Makeup", 180, 90, "Beautiful engagement look"],
      ["Natural Makeup", "Makeup", 60, 45, "Subtle, everyday makeup look"],
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
      ["Bridal Package", "Bridal", 500, 300, "Complete bridal preparation package"],
      ["Mehndi Night Package", "Bridal", 300, 180, "Mehndi night full look"],
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
