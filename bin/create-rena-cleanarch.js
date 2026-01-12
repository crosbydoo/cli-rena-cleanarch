#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const os = require("os");
const https = require("https");
const tar = require("tar");

const TEMPLATE_TARBALL =
  "https://codeload.github.com/crosbydoo/rena-cleanarch/tar.gz/refs/heads/main";

function usage() {
  console.log(`
Usage:
  npx create-rena-cleanarch <project-name> [options]

Options:
  --no-install              Skip installing dependencies
  --package-manager <pm>    Specify package manager: npm, yarn, or pnpm
  --pm <pm>                 Alias for --package-manager
  -h, --help                Show this help message

Examples:
  npx create-rena-cleanarch my-app
  npx create-rena-cleanarch my-app --no-install
  npx create-rena-cleanarch my-app --package-manager yarn
  npx create-rena-cleanarch my-app --pm pnpm
`);
}

function die(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

function ensureEmptyDir(dir) {
  if (fs.existsSync(dir)) {
    const items = fs.readdirSync(dir);
    if (items.length > 0) die(`Target directory is not empty: ${dir}`);
  } else {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function downloadToFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https
      .get(url, (res) => {
        // handle redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          fs.unlinkSync(filePath);
          return resolve(downloadToFile(res.headers.location, filePath));
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} when downloading template`));
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => {
        try {
          file.close();
        } catch {}
        reject(err);
      });
  });
}

async function copyDir(src, dst) {
  await fsp.mkdir(dst, { recursive: true });
  const entries = await fsp.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else if (e.isFile()) await fsp.copyFile(s, d);
  }
}

async function readJsonIfExists(p) {
  try {
    const txt = await fsp.readFile(p, "utf8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

async function writeJson(p, obj) {
  const txt = JSON.stringify(obj, null, 2) + "\n";
  await fsp.writeFile(p, txt, "utf8");
}

async function patchProjectFiles(projectDir, projectName) {
  // package.json name
  const pkgPath = path.join(projectDir, "package.json");
  const pkg = await readJsonIfExists(pkgPath);
  if (pkg) {
    pkg.name = projectName;
    // ensure private true for app templates (safe default)
    if (typeof pkg.private !== "boolean") pkg.private = true;
    await writeJson(pkgPath, pkg);
  }

  // app.json expo name/slug (common Expo fields)
  const appJsonPath = path.join(projectDir, "app.json");
  const appJson = await readJsonIfExists(appJsonPath);
  if (appJson && appJson.expo) {
    appJson.expo.name = appJson.expo.name || projectName;
    appJson.expo.slug = appJson.expo.slug || projectName;
    // If the template already has values, overwrite to match projectName:
    appJson.expo.name = projectName;
    appJson.expo.slug = projectName;
    await writeJson(appJsonPath, appJson);
  }

  // If there is an app.config.* you can patch similarly (not assumed).
}

function detectPackageManager() {
  // preference order: yarn, npm
  const has = (cmd) => {
    try {
      require("child_process").execSync(`${cmd} --version`, { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  };
  if (has("yarn")) return "yarn";
  return "npm";
}

function validatePackageManager(pm) {
  const valid = ["npm", "yarn", "pnpm"];
  if (!valid.includes(pm)) {
    die(`Invalid package manager: ${pm}. Must be one of: ${valid.join(", ")}`);
  }
  return pm;
}

function run(cmd, args, cwd) {
  const { spawnSync } = require("child_process");
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    usage();
    process.exit(0);
  }

  const projectName = args.find((a) => !a.startsWith("--"));
  if (!projectName) die("Missing <project-name>.");

  const noInstall = args.includes("--no-install");
  
  // Parse package manager option
  let packageManager = null;
  const pmIndex = args.findIndex((a) => a === "--package-manager" || a === "--pm");
  if (pmIndex !== -1) {
    const pmValue = args[pmIndex + 1];
    if (!pmValue || pmValue.startsWith("--")) {
      die("--package-manager requires a value: npm, yarn, or pnpm");
    }
    packageManager = validatePackageManager(pmValue);
  }

  const targetDir = path.resolve(process.cwd(), projectName);
  ensureEmptyDir(targetDir);

  console.log(`\n📦 Creating project: ${projectName}`);
  console.log(`📍 Target: ${targetDir}`);

  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), "rena-cleanarch-"));
  const tarballPath = path.join(tmp, "template.tgz");
  const extractDir = path.join(tmp, "extract");
  await fsp.mkdir(extractDir, { recursive: true });

  console.log("⬇️  Downloading template...");
  await downloadToFile(TEMPLATE_TARBALL, tarballPath);

  console.log("🧩 Extracting template...");
  await tar.x({
    file: tarballPath,
    cwd: extractDir
  });

  // GitHub tarball extracts as: rena-cleanarch-main/
  const extractedRoot = (await fsp.readdir(extractDir)).find((n) =>
    n.startsWith("rena-cleanarch-")
  );
  if (!extractedRoot) die("Could not find extracted template root folder.");

  const templateRoot = path.join(extractDir, extractedRoot);

  console.log("🧱 Copying files...");
  await copyDir(templateRoot, targetDir);

  // Remove template's git history if any
  const gitDir = path.join(targetDir, ".git");
  if (fs.existsSync(gitDir)) {
    await fsp.rm(gitDir, { recursive: true, force: true });
  }

  console.log("🛠️  Patching project metadata...");
  await patchProjectFiles(targetDir, projectName);

  if (!noInstall) {
    const pm = packageManager || detectPackageManager();
    console.log(`📥 Installing dependencies (${pm})...`);
    
    // Verify package manager is available
    const has = (cmd) => {
      try {
        require("child_process").execSync(`${cmd} --version`, { stdio: "ignore" });
        return true;
      } catch {
        return false;
      }
    };
    
    if (!has(pm)) {
      die(`${pm} is not installed. Please install it first or use a different package manager.`);
    }
    
    if (pm === "pnpm") run("pnpm", ["install"], targetDir);
    else if (pm === "yarn") run("yarn", ["install"], targetDir);
    else run("npm", ["install"], targetDir);
  } else {
    console.log("⏭️  Skipping install (--no-install).");
  }

  const pm = packageManager || detectPackageManager();
  console.log(`
✅ Done!

Next:
  cd ${projectName}
  ${pm} start
`);
}

main().catch((e) => die(e?.message || String(e)));
