import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import ws from "ws";
import * as schema from "@shared/schema";
import * as schemaSQLite from "@shared/schema-sqlite";

neonConfig.webSocketConstructor = ws;

// For migration purposes, use SQLite if no DATABASE_URL is provided
let db: any;
let pool: any;

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL not set, using SQLite for migration");
  const sqlite = new Database('./data.db');
  db = drizzleSQLite(sqlite, { schema: schemaSQLite });
  
  // Create tables if they don't exist
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        whatsapp_number TEXT NOT NULL,
        email TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        order_number TEXT NOT NULL UNIQUE,
        invoice_number TEXT,
        reference_number TEXT,
        status TEXT NOT NULL DEFAULT 'queued',
        notes TEXT,
        total_estimated_time REAL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );
      
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        product_code TEXT,
        stl_file_name TEXT,
        stl_file_url TEXT,
        drawing_file_name TEXT,
        drawing_file_url TEXT,
        estimated_print_time REAL NOT NULL,
        material TEXT NOT NULL,
        filament_length_meters REAL,
        filament_weight_grams REAL,
        price REAL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS filament_stock (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material TEXT NOT NULL,
        color TEXT NOT NULL,
        brand TEXT,
        total_weight_grams REAL NOT NULL,
        current_weight_grams REAL NOT NULL,
        low_stock_threshold_grams REAL NOT NULL DEFAULT 100,
        cost_per_kg REAL,
        supplier_info TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS filament_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        print_id INTEGER NOT NULL,
        filament_stock_id INTEGER NOT NULL,
        weight_used_grams REAL NOT NULL,
        length_used_meters REAL NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (print_id) REFERENCES prints(id),
        FOREIGN KEY (filament_stock_id) REFERENCES filament_stock(id)
      );
      
      CREATE TABLE IF NOT EXISTS prints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        material TEXT NOT NULL,
        estimated_time REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued',
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
      
      CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        sent INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );
    `);
    
    // Add product_code column if it doesn't exist
    try {
      sqlite.exec(`ALTER TABLE products ADD COLUMN product_code TEXT;`);
      console.log("Added product_code column");
    } catch (error) {
      // Column already exists, ignore error
      console.log("product_code column already exists");
    }

    // Add filament columns if they don't exist
    try {
      sqlite.exec(`ALTER TABLE products ADD COLUMN filament_length_meters REAL;`);
      console.log("Added filament_length_meters column");
    } catch (error) {
      console.log("filament_length_meters column already exists");
    }

    try {
      sqlite.exec(`ALTER TABLE products ADD COLUMN filament_weight_grams REAL;`);
      console.log("Added filament_weight_grams column");
    } catch (error) {
      console.log("filament_weight_grams column already exists");
    }
    
    console.log("SQLite tables created successfully");
  } catch (error) {
    console.error("Error creating SQLite tables:", error);
  }
} else {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
}

export { db, pool };