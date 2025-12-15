const pool = require('../config/db');

class UserRepository {
    async findById(id) {
        const { rows: users } = await pool.query('SELECT user_id as id, full_name as name, email, phone, role, is_active FROM Users WHERE user_id = $1', [id]
        );
        return users[0];
    }

    async findByEmail(email) {
        const { rows: users } = await pool.query('SELECT * FROM Users WHERE email = $1', [email]
        );
        return users[0];
    }

    async create(userData) {
        const { name, email, password, phone, role } = userData;
        const { rows: result } = await pool.query('INSERT INTO Users (full_name, email, password_hash, phone, role) VALUES ($1, $2, $3, $4, $5)', [name, email, password, phone, role]
        );
        return result.rows[0].id;
    }

    async update(id, data) {
        const { name, phone } = data;
        // Build dynamic query or just update both for now
        await pool.query('UPDATE Users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone) WHERE user_id = $3', [name, phone, id]
        );
    }
}

module.exports = new UserRepository();
