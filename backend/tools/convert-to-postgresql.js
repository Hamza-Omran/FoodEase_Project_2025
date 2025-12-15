#!/usr/bin/env node

/**
 * Automatic MySQL to PostgreSQL Query Converter
 * Converts query syntax in all backend files
 */

const fs = require('fs');
const path = require('path');

const BACKEND_DIR = __dirname + '/..';
const BACKUP_DIR = path.join(BACKEND_DIR, '_mysql_backup');

// Create backup directory
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Files to convert
const filesToConvert = [
    // Controllers
    'controllers/auth.controller.js',
    'controllers/cart.controller.js',
    'controllers/favorite.controller.js',
    'controllers/menu.controller.js',
    'controllers/order.controller.js',
    'controllers/restaurant.controller.js',
    'controllers/review.controller.js',
    'controllers/user.controller.js',
    'controllers/driver.controller.js',

    // Repositories
    'repositories/user.repo.js',
    'repositories/restaurant.repo.js',
    'repositories/menu.repo.js',
    'repositories/order.repo.js',
    'repositories/cart.repo.js',
    'repositories/driver.repo.js',
    'repositories/favorite.repo.js',
    'repositories/review.repo.js',

    // Middlewares
    'middlewares/auth.js'
];

let totalChanges = 0;

console.log('🔄 Converting MySQL queries to PostgreSQL...\n');

filesToConvert.forEach(file => {
    const filePath = path.join(BACKEND_DIR, file);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${file} (not found)`);
        return;
    }

    // Backup original
    const backupPath = path.join(BACKUP_DIR, file);
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    let fileChanges = 0;

    // 1. Convert result destructuring: [rows] → {rows}
    content = content.replace(/const \[([a-zA-Z_$][a-zA-Z0-9_$]*)\] = await pool\.query/g, (match, varName) => {
        fileChanges++;
        return `const { rows: ${varName} } = await pool.query`;
    });

    // Also handle: const [rows, fields] = ... → const {rows} = ...
    content = content.replace(/const \[([a-zA-Z_$][a-zA-Z0-9_$]*),\s*[a-zA-Z_$][a-zA-Z0-9_$]*\] = await pool\.query/g, (match, varName) => {
        fileChanges++;
        return `const { rows: ${varName} } = await pool.query`;
    });

    // 2. Convert placeholders: ? → $1, $2, $3...
    content = convertPlaceholders(content);

    // 3. Convert CALL stored_procedure → SELECT * FROM stored_procedure
    content = content.replace(/pool\.query\(\s*['"`]CALL\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/gi, (match, procName) => {
        fileChanges++;
        return `pool.query(\`SELECT * FROM ${procName}(`;
    });

    // 4. Convert .insertId → rows[0].id (when using RETURNING)
    content = content.replace(/result\.insertId/g, (match) => {
        fileChanges++;
        return 'result.rows[0].id';
    });

    // Save backup if changes were made
    if (content !== originalContent) {
        fs.writeFileSync(backupPath, originalContent);
        fs.writeFileSync(filePath, content);
        console.log(`✅ ${file} (${fileChanges} changes)`);
        totalChanges += fileChanges;
    } else {
        console.log(`   ${file} (no changes needed)`);
    }
});

console.log(`\n✨ Conversion complete! ${totalChanges} total changes made.`);
console.log(`📦 Backups saved to: ${BACKUP_DIR}`);
console.log(`\n⚠️  IMPORTANT: Manually review and test all converted files!`);

/**
 * Convert ? placeholders to $1, $2, $3, etc.
 */
function convertPlaceholders(content) {
    // Match pool.query calls
    const queryRegex = /pool\.query\(\s*(['"`])([^'"`]*?)\1\s*,\s*\[([^\]]*)\]/g;

    return content.replace(queryRegex, (match, quote, query, params) => {
        let paramIndex = 1;
        const convertedQuery = query.replace(/\?/g, () => `$${paramIndex++}`);

        return `pool.query(${quote}${convertedQuery}${quote}, [${params}]`;
    });
}
