/**
 * Version Update Script
 * 
 * Automatically updates version in both package.json and manifest.webmanifest
 * 
 * Usage:
 *   node update-version.js <version>
 *   node update-version.js patch     (1.0.0 -> 1.0.1)
 *   node update-version.js minor     (1.0.1 -> 1.1.0)
 *   node update-version.js major     (1.1.0 -> 2.0.0)
 *   node update-version.js 1.2.3     (set specific version)
 */

const fs = require('fs');
const path = require('path');

// File paths
const packageJsonPath = path.join(__dirname, 'package.json');
const manifestPath = path.join(__dirname, 'src', 'manifest.webmanifest');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function incrementVersion(version, type) {
    const parts = version.split('.').map(Number);

    switch (type) {
        case 'patch':
            parts[2]++;
            break;
        case 'minor':
            parts[1]++;
            parts[2] = 0;
            break;
        case 'major':
            parts[0]++;
            parts[1] = 0;
            parts[2] = 0;
            break;
        default:
            return type; // Assume it's a specific version like "1.2.3"
    }

    return parts.join('.');
}

function isValidVersion(version) {
    return /^\d+\.\d+\.\d+$/.test(version);
}

function updatePackageJson(newVersion) {
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const oldVersion = packageJson.version;
        packageJson.version = newVersion;

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

        log(`✓ Updated package.json: ${oldVersion} → ${newVersion}`, 'green');
        return true;
    } catch (error) {
        log(`✗ Error updating package.json: ${error.message}`, 'red');
        return false;
    }
}

function updateManifest(newVersion) {
    try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const oldVersion = manifest.version || 'not set';
        manifest.version = newVersion;

        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4) + '\n');

        log(`✓ Updated manifest.webmanifest: ${oldVersion} → ${newVersion}`, 'green');
        return true;
    } catch (error) {
        log(`✗ Error updating manifest.webmanifest: ${error.message}`, 'red');
        return false;
    }
}

function main() {
    const arg = process.argv[2];

    if (!arg) {
        log('\n❌ Error: Please specify version type or number', 'red');
        log('\nUsage:', 'yellow');
        log('  node update-version.js patch     (bug fix: 1.0.0 → 1.0.1)', 'cyan');
        log('  node update-version.js minor     (new feature: 1.0.1 → 1.1.0)', 'cyan');
        log('  node update-version.js major     (breaking change: 1.1.0 → 2.0.0)', 'cyan');
        log('  node update-version.js 1.2.3     (set specific version)', 'cyan');
        log('');
        process.exit(1);
    }

    // Read current version from package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;

    let newVersion;

    if (['patch', 'minor', 'major'].includes(arg)) {
        newVersion = incrementVersion(currentVersion, arg);
    } else {
        newVersion = arg;
    }

    if (!isValidVersion(newVersion)) {
        log(`\n❌ Error: Invalid version format: ${newVersion}`, 'red');
        log('Version must be in format: X.Y.Z (e.g., 1.2.3)', 'yellow');
        process.exit(1);
    }

    log('\n🔄 Updating version...', 'blue');
    log(`   Current: ${currentVersion}`, 'cyan');
    log(`   New:     ${newVersion}`, 'cyan');
    log('');

    const packageSuccess = updatePackageJson(newVersion);
    const manifestSuccess = updateManifest(newVersion);

    if (packageSuccess && manifestSuccess) {
        log('\n✅ Version updated successfully!', 'green');
        log('\nNext steps:', 'yellow');
        log('  1. Update CHANGELOG.md with your changes', 'cyan');
        log('  2. Build: npm run build', 'cyan');
        log('  3. Deploy to production', 'cyan');
        log('  4. Commit: git add . && git commit -m "Release v' + newVersion + '"', 'cyan');
        log('  5. Tag: git tag v' + newVersion, 'cyan');
        log('');
    } else {
        log('\n❌ Version update failed!', 'red');
        process.exit(1);
    }
}

main();
