const pool = require('../config/db');

class UserRepository {
    async findById(id) {
        const [users] = await pool.query(
            'SELECT user_id as id, full_name as name, email, phone, role, is_active FROM Users WHERE user_id = ?',
            [id]
        );
        return users[0];
    }

    async findByEmail(email) {
        const [users] = await pool.query(
            'SELECT * FROM Users WHERE email = ?',
            [email]
        );
        return users[0];
    }

    async create(userData) {
        const { name, email, password, phone, role } = userData;
        const [result] = await pool.query(
            'INSERT INTO Users (full_name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, password, phone, role]
        );
        return result.insertId;
    }

    async update(id, data) {
        const { name, phone } = data;
        // Build dynamic query or just update both for now
        await pool.query(
            'UPDATE Users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone) WHERE user_id = ?',
            [name, phone, id]
        );
    }
}

module.exports = new UserRepository();
