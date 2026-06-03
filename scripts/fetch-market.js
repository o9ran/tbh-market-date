const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SOURCE_URL = 'https://tbh-market.com/api/items';
const PAGE_SIZE = 48;

async function fetchAllItems() {
  const allItems = [];
  let page = 1;
  let total = 0;

  console.log('Fetching TBH market data from tbh-market.com...');

  while (true) {
    try {
      const res = await axios.get(SOURCE_URL, {
        params: { page },
        timeout: 15000,
        headers: { 'User-Agent': 'TBH-Market-Bot/1.0' },
      });

      const data = res.data;
      if (page === 1) {
        total = data.total ?? 0;
        console.log(`Total items: ${total}`);
      }

      const items = data.items ?? [];
      if (items.length === 0) break;

      for (const item of items) {
        allItems.push({
          hash_name:     item.hash_name,
          name:          item.name,
          name_ja:       item.name_ja ?? '',
          icon_url:      item.icon_url ?? '',
          type:          item.type ?? '',
          sell_price:    item.sell_price ?? 0,
          median_price:  item.median_price ?? null,
          sell_listings: item.sell_listings ?? 0,
          volume:        item.volume ?? 0,
          name_color:    item.name_color ?? '',
        });
      }

      console.log(`Page ${page}: ${allItems.length} / ${total}`);

      if (allItems.length >= total) break;

      page++;
      await sleep(500);
    } catch (e) {
      console.error(`Error on page ${page}:`, e.message);
      break;
    }
  }

  return allItems;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const items = await fetchAllItems();

  const output = {
    items,
    total:     items.length,
    updatedAt: new Date().toISOString(),
  };

  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(dataDir, 'items.json'),
    JSON.stringify(output),
    'utf-8'
  );

  console.log(`✅ Saved ${items.length} items to data/items.json`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
