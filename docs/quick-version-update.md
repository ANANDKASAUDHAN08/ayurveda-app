# 🚀 Quick Version Update Guide

No more manual editing! Use these simple commands to update your version automatically.

---

## ⚡ Quick Commands

### For Bug Fixes (1.0.0 → 1.0.1)
```bash
npm run version:patch
```

### For New Features (1.0.1 → 1.1.0)
```bash
npm run version:minor
```

### For Major Changes (1.1.0 → 2.0.0)
```bash
npm run version:major
```

### For Specific Version (e.g., 1.2.3)
```bash
node update-version.js 1.2.3
```

---

## 📋 What the Script Does

When you run the command, it automatically:

✅ Updates `package.json` version  
✅ Updates `manifest.webmanifest` version  
✅ Shows you what changed  
✅ Tells you the next steps

**Example Output:**
```
🔄 Updating version...
   Current: 1.0.0
   New:     1.0.1

✓ Updated package.json: 1.0.0 → 1.0.1
✓ Updated manifest.webmanifest: 1.0.0 → 1.0.1

✅ Version updated successfully!

Next steps:
  1. Update CHANGELOG.md with your changes
  2. Build: npm run build
  3. Deploy to production
  4. Commit: git add . && git commit -m "Release v1.0.1"
  5. Tag: git tag v1.0.1
```

---

## 🎯 Complete Workflow

### Example: You Fixed a Bug

```bash
# 1. Fix the bug in your code
# ... make your changes ...

# 2. Update version automatically (patch for bug fix)
npm run version:patch

# 3. Update CHANGELOG.md
# Add what you fixed under ## [1.0.1] - 2026-01-20

# 4. Build for production
npm run build

# 5. Commit and tag
git add .
git commit -m "Fix: Location dialog styling issue"
git tag v1.0.1

# 6. Deploy
# ... deploy to production ...
```

---

### Example: You Added a New Feature

```bash
# 1. Add your new feature
# ... make your changes ...

# 2. Update version automatically (minor for new feature)
npm run version:minor

# 3. Update CHANGELOG.md
# Add what you added under ## [1.1.0] - 2026-01-20

# 4. Build for production
npm run build

# 5. Commit and tag
git add .
git commit -m "Feature: Added appointment reminders"
git tag v1.1.0

# 6. Deploy
# ... deploy to production ...
```

---

## 🛠️ Script Location

**File**: `frontend/update-version.js`

You can also run it directly:
```bash
cd frontend
node update-version.js patch
node update-version.js minor
node update-version.js major
node update-version.js 2.5.3
```

---

## 📝 Manual Method (If You Prefer)

If you still want to update manually:

1. **Edit `package.json`**: Change `"version": "1.0.0"`
2. **Edit `manifest.webmanifest`**: Change `"version": "1.0.0"`
3. **Update `CHANGELOG.md`**: Document your changes

But the automated script is much faster! ⚡

---

## ❓ Which Version Update to Use?

| Action | Command | Example |
|--------|---------|---------|
| 🐛 **Fixed a bug** | `npm run version:patch` | 1.0.0 → 1.0.1 |
| ✨ **Added a feature** | `npm run version:minor` | 1.0.1 → 1.1.0 |
| 💥 **Breaking change** | `npm run version:major` | 1.1.0 → 2.0.0 |
| 🎯 **Specific version** | `node update-version.js X.Y.Z` | → 1.2.3 |

---

## 💡 Pro Tips

1. **Always update CHANGELOG.md** after running the version script
2. **Build before deploying** to generate production files
3. **Tag your releases** in git for easy rollback
4. **Test the build** before deploying to production
5. **Keep version and changelog in sync**

---

## ✅ Summary

**Before (Manual):**
1. Edit package.json
2. Edit manifest.webmanifest
3. Make sure versions match
4. Hope you didn't make a typo

**Now (Automated):**
```bash
npm run version:patch
```
Done! Both files updated correctly in 1 second! 🎉

---

## 🆘 Troubleshooting

**Error: "Cannot find module"**
```bash
# Make sure you're in the frontend directory
cd frontend
npm run version:patch
```

**Files not updating?**
```bash
# Run directly with node
node update-version.js patch
```

**Want to see what changed?**
```bash
# Check git changes
git diff package.json
git diff src/manifest.webmanifest
```

---

**That's it! No more manual editing! 🚀**
