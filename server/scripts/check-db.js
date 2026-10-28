import { pool } from '../src/config/db.js'

async function check() {
  try {
    const { rows } = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name;"
    )
    console.log(`=== PostgreSQL Database: nashik_parking ===\n`)
    console.log(`Table Summary:`)
    for (const r of rows) {
      const res = await pool.query(`SELECT count(*) FROM "${r.table_name}"`)
      console.log(`  - ${r.table_name.padEnd(25)} : ${res.rows[0].count} rows`)
    }

    console.log(`\n--- USERS in "User" table ---`)
    const users = await pool.query('SELECT id, name, email, phone, role, status FROM "User"')
    console.table(users.rows)

    console.log(`\n--- PARKING SPACES in "Space" table ---`)
    const spaces = await pool.query('SELECT id, title, address, "priceHourPaise"/100 AS "ratePerHourRs", capacity, "isActive" FROM "Space"')
    console.table(spaces.rows)

    console.log(`\n--- BOOKINGS in "Booking" table ---`)
    const bookings = await pool.query('SELECT id, code, "vehicleNumber", "totalPricePaise"/100 AS "totalRs", status FROM "Booking"')
    console.table(bookings.rows)

  } catch (err) {
    console.error('Error querying database:', err.message)
  } finally {
    await pool.end()
  }
}

check()
