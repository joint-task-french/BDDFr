/**
 * Pages statiques AVEC captures des cartes (Puppeteer sur le serveur de dev).
 * Les captures alimentent l'image Open Graph et la galerie de l'embed Discord ;
 * l'ecriture des pages elle-meme est commune : scripts/lib/site-pages.mjs.
 */
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import crypto from 'crypto';
import { loadEmbedData, buildIconIndex } from './lib/discord-embed.mjs';
import { writeSitePages, ITEM_CATEGORIES } from './lib/site-pages.mjs';

const DIST_DIR = './dist';
const DATA_DIR = './src/data';
const PAGES_DIR = './src/content/pages';
const ASSETS_DIR = './src/img/game_assets';

const DEV_SERVER_URL = 'http://localhost:5173/BDDFr';

const repoFullName = process.env.GITHUB_REPOSITORY || 'localhost/BDDFr';
const [owner, repo] = repoFullName.split('/');

const DOMAIN = process.env.DOMAIN;
const VITE_BASE_PATH = process.env.VITE_BASE_PATH ? process.env.VITE_BASE_PATH.replace(/\/$/, '') : null;
const BASE_URL = VITE_BASE_PATH ? (DOMAIN ? (DOMAIN.startsWith('http') ? DOMAIN : `https://${DOMAIN}`) + VITE_BASE_PATH : VITE_BASE_PATH) : (DOMAIN ? (DOMAIN.startsWith('http') ? DOMAIN : `https://${DOMAIN}`) : (process.env.PUBLIC_URL || (process.env.GITHUB_ACTIONS ? `https://${owner}.github.io/${repo}` : 'http://localhost:5173/BDDFr')));

const WATERMARK_URL = `${DEV_SERVER_URL}/favicon_150x150.png`;
const WATERMARK_OPACITY = 0.15;
const WATERMARK_SIZE = '60px';

function startDevServer() {
    console.log("🔄 Démarrage du serveur de développement local...");
    return new Promise((resolve, reject) => {
        const serverProcess = spawn('npx', ['vite', '--port', '5173'], { shell: true });
        const onData = (data) => {
            const output = data.toString();
            if (output.includes('http://localhost:5173') || output.includes('ready in')) resolve(serverProcess);
        };
        serverProcess.stdout.on('data', onData);
        serverProcess.stderr.on('data', onData);
        serverProcess.on('error', (err) => reject(err));
    });
}

async function generate() {
    if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

    let devServerProcess = null;
    let browser = null;

    try {
        devServerProcess = await startDevServer();
        browser = await puppeteer.launch({
            headless: "new",
            protocolTimeout: 240000,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });

        const exportOgImagesDir = path.join(DIST_DIR, 'og-images');
        if (!fs.existsSync(exportOgImagesDir)) fs.mkdirSync(exportOgImagesDir, { recursive: true });

        const hashFilePath = path.join(exportOgImagesDir, 'hashes.json');
        let imageHashes = {};
        if (fs.existsSync(hashFilePath)) {
            try { imageHashes = JSON.parse(fs.readFileSync(hashFilePath, 'utf-8')); } catch { /* cache illisible : tout est regenere */ }
        }

        console.log("📸 Début des captures d'écran...");
        const categoriesToProcess = ITEM_CATEGORIES;

        for (const categoryKey of categoriesToProcess) {
            const categoryOgDir = path.join(exportOgImagesDir, categoryKey);
            if (!fs.existsSync(categoryOgDir)) fs.mkdirSync(categoryOgDir, { recursive: true });

            const page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });

            try {
                const processCards = async (isPerfect, isDescente = false, isPrototype = false) => {
                    const suffix = isPerfect ? '-parfait' : (isPrototype ? '-prototype' : '');
                    const suffixLog = isPerfect ? ' (Parfait)' : (isPrototype ? ' (Prototype)' : '');
                    const targetUrl = `${DEV_SERVER_URL}/#/db/${categoryKey}${isPerfect ? '?parfait=true' : (isPrototype ? '?prototype=true' : '')}`;

                    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 60000 });
                    await page.addStyleTag({
                        content: `
                            header, nav, footer, .navbar { display: none !important; }
                            .puppeteer-teleport { 
                                position: fixed !important; top: 50px !important; left: 50px !important; z-index: 999999 !important;
                                margin: 0 !important; transform: none !important; transition: none !important;
                                height: auto !important; background-color: #0d0d0d !important;
                            }
                            .watermark-overlay {
                                position: absolute !important; bottom: 15px !important; right: 15px !important;
                                width: ${WATERMARK_SIZE} !important; height: auto !important;
                                opacity: ${WATERMARK_OPACITY} !important;
                                z-index: 1000000 !important; pointer-events: none !important;
                                display: block !important;
                            }
                        `
                    });

                    await page.evaluate(() => {
                        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
                            img.setAttribute('loading', 'eager');
                        });
                    });

                    await page.evaluate((wmUrl) => {
                        const link = document.createElement('link');
                        link.rel = 'preload';
                        link.as = 'image';
                        link.href = wmUrl;
                        document.head.appendChild(link);
                        const preImg = new Image();
                        preImg.src = wmUrl;
                    }, WATERMARK_URL);

                    await page.evaluate(async () => {
                        await new Promise((resolve) => {
                            let totalHeight = 0;
                            const distance = 300;
                            const timer = setInterval(() => {
                                const scrollHeight = document.documentElement.scrollHeight;
                                window.scrollBy(0, distance);
                                totalHeight += distance;

                                if (totalHeight >= scrollHeight - window.innerHeight) {
                                    clearInterval(timer);
                                    window.scrollTo(0, 0);
                                    resolve();
                                }
                            }, 50);
                        });
                    });

                    await new Promise(r => setTimeout(r, 2000));

                    const cards = await page.$$('.og-target-card');
                    for (const card of cards) {
                        const slug = await page.evaluate(el => el.getAttribute('data-slug'), card);
                        if (!slug) continue;

                        if (isPerfect) {
                            const hasPerfectBtn = await page.evaluate(el => {
                                return Array.from(el.querySelectorAll('button')).some(b => b.textContent.includes('Parfait'));
                            }, card);
                            if (!hasPerfectBtn) continue;
                        }

                        if (isPrototype) {
                            const hasPrototypeBtn = await page.evaluate(el => {
                                return Array.from(el.querySelectorAll('button')).some(b => b.textContent.includes('Prototype'));
                            }, card);
                            if (!hasPrototypeBtn) continue;
                        }

                        let levelsToProcess = [''];
                        if (isDescente) {
                            levelsToProcess = await page.evaluate(el => {
                                const select = el.querySelector('select');
                                return select ? Array.from(select.options).map(o => o.value) : ['1'];
                            }, card);
                        }

                        for (const level of levelsToProcess) {
                            if (isDescente) {
                                await page.evaluate((el, lvl) => {
                                    const select = el.querySelector('select');
                                    if (select && select.value !== lvl) {
                                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
                                        if (nativeInputValueSetter) nativeInputValueSetter.call(select, lvl);
                                        select.dispatchEvent(new Event('change', { bubbles: true }));
                                    }
                                }, card, level);
                                await new Promise(r => setTimeout(r, 400));
                            }

                            const levelSuffix = isDescente ? `-${level}` : suffix;
                            const levelSuffixLog = isDescente ? ` (Niv. ${level})` : suffixLog;

                            const cardHtml = await page.evaluate(el => {
                                const clone = el.cloneNode(true);
                                const allElements = clone.getElementsByTagName('*');
                                for (let i = 0; i < allElements.length; i++) {
                                    const node = allElements[i];
                                    node.removeAttribute('id');
                                    node.removeAttribute('for');
                                    node.removeAttribute('style');
                                    node.removeAttribute('class');
                                    node.removeAttribute('tabindex');

                                    Array.from(node.attributes).forEach(attr => {
                                        if (attr.name.startsWith('data-') || attr.name.startsWith('aria-')) {
                                            node.removeAttribute(attr.name);
                                        }
                                        if (attr.value && /:[a-z0-9]+:/i.test(attr.value)) {
                                            node.removeAttribute(attr.name);
                                        }
                                    });

                                    if (node.tagName === 'OPTION') node.removeAttribute('selected');
                                    if (node.tagName === 'SELECT') node.removeAttribute('value');
                                }
                                return clone.innerHTML;
                            }, card);

                            const currentHash = crypto.createHash('md5').update(cardHtml).digest('hex');
                            const hashKey = `${categoryKey}_${slug}${levelSuffix}`;
                            const imageOutputPath = path.join(categoryOgDir, `${slug}${levelSuffix}.jpg`);

                            if (fs.existsSync(imageOutputPath) && imageHashes[hashKey] === currentHash) {
                                continue;
                            }

                            let attempts = 3;
                            let success = false;

                            while (attempts > 0 && !success) {
                                try {
                                    await page.evaluate((el, icon) => {
                                        const rect = el.getBoundingClientRect();
                                        el.style.setProperty('width', rect.width + 'px', 'important');
                                        el.classList.add('puppeteer-teleport');
                                        if (!el.querySelector('.watermark-overlay')) {
                                            const img = document.createElement('img');
                                            img.src = icon; img.className = 'watermark-overlay';
                                            el.appendChild(img);
                                        }
                                    }, card, WATERMARK_URL);

                                    await page.evaluate(el => {
                                        return new Promise((resolve) => {
                                            const wm = el.querySelector('.watermark-overlay');
                                            if (!wm) return resolve();
                                            if (wm.complete && wm.naturalWidth > 0) return resolve();
                                            wm.onload = resolve;
                                            wm.onerror = resolve;
                                            setTimeout(resolve, 3000);
                                        });
                                    }, card);
                                    await new Promise(r => setTimeout(r, 300));
                                    await card.screenshot({ path: imageOutputPath, type: 'jpeg', quality: 85 });

                                    await page.evaluate(el => {
                                        el.style.removeProperty('width');
                                        el.classList.remove('puppeteer-teleport');
                                        const wm = el.querySelector('.watermark-overlay');
                                        if (wm) wm.remove();
                                    }, card);

                                    console.log(`📸 [${categoryKey}] Généré : ${slug}${levelSuffix}.jpg`);
                                    imageHashes[hashKey] = currentHash;
                                    success = true;
                                } catch (e) {
                                    attempts--;
                                    await page.evaluate(el => {
                                        el.style.removeProperty('width');
                                        el.classList.remove('puppeteer-teleport');
                                        const wm = el.querySelector('.watermark-overlay');
                                        if (wm) wm.remove();
                                    }, card).catch(() => {});

                                    if (attempts > 0) {
                                        console.warn(`⚠️ [${categoryKey}] Timeout pour ${slug}${levelSuffixLog}, tentative restante: ${attempts}...`);
                                        await new Promise(r => setTimeout(r, 2000));
                                    } else {
                                        console.error(`❌ [${categoryKey}] Échec définitif pour ${slug}${levelSuffixLog}:`, e.message);
                                    }
                                }
                            }
                        }
                    }
                };

                if (categoryKey === 'descente') {
                    await processCards(false, true);
                } else {
                    await processCards(false);
                    if (categoryKey === 'talentsArmes' || categoryKey === 'talentsEquipements') {
                        await processCards(true);
                    }
                    if (categoryKey === 'armes' || categoryKey === 'equipements') {
                        await processCards(false, false, true);
                    }
                }

            } finally { await page.close(); }
        }

        fs.writeFileSync(hashFilePath, JSON.stringify(imageHashes, null, 2));

        console.log("\n🔗 Génération des pages HTML et du Sitemap...");

        // Captures nommees `<slug>[-parfait|-prototype|-<niveau>].jpg` par la boucle ci-dessus.
        const imageFor = (categoryKey, slug, variant) => {
            const suffix = variant ? `-${variant}` : '';
            const rel = `og-images/${categoryKey}/${slug}${suffix}.jpg`;
            return fs.existsSync(path.join(DIST_DIR, rel)) ? rel : null;
        };
        const { pages } = writeSitePages({
            distDir: DIST_DIR,
            baseUrl: BASE_URL,
            data: loadEmbedData(DATA_DIR),
            iconIndex: buildIconIndex(ASSETS_DIR),
            pagesDir: PAGES_DIR,
            imageFor,
        });
        console.log(`✅ Terminé ! ${pages} pages indexables.`);

    } finally {
        if (browser) await browser.close();
        if (devServerProcess) devServerProcess.kill('SIGINT');
        process.exit(0);
    }
}

generate().catch(err => { console.error(err); process.exit(1); });