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
        price REAL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
    
    console.log("SQLite tables created successfully");
  } catch (error) {
    console.error("Error creating SQLite tables:", error);
  }
} else {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
}

export { db, pool };