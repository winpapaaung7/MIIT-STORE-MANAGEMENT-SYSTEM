const mysql = require("mysql2/promise");

async function main() {
  const conn = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "09444788590",
    database: "inventory_management",
  });

  // 1. Admin role ရှိ/မရှိ စစ်ပြီး မရှိရင် ထည့်
  await conn.query(`
    INSERT INTO role (role_name)
    SELECT 'Admin'
    WHERE NOT EXISTS (
      SELECT 1 FROM role WHERE role_name = 'Admin'
    )
  `);

  // 2. Admin role id ကိုယူ
  const [roles] = await conn.query(
    "SELECT role_id FROM role WHERE role_name = 'Admin' LIMIT 1"
  );

  const roleId = roles[0].role_id;

  // 3. Admin user ရှိ/မရှိ စစ်
  const [users] = await conn.query(
    "SELECT user_id FROM users WHERE username = 'admin' LIMIT 1"
  );

  if (users.length === 0) {
    await conn.query(
      `INSERT INTO users
      (full_name, username, email, password_hash, role_id, department_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "Default Admin",
        "admin",
        "admin@example.com",
        "admin-password-hash",
        roleId,
        null,
        "Active",
      ]
    );

    console.log("Default admin inserted successfully.");
  } else {
    console.log("Admin user already exists.");
  }

  await conn.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});