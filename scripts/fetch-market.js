const axios = require('axios');
const fs = require('fs');
const path = require('path');

const STEAM_COMMUNITY = 'https://steamcommunity.com';
const APP_ID = '3678970';
const PAGE_SIZE = 100;

async function fetchAllItems() {
  const allItems = [];
  let totalCount = 0;

  console.log('Fetching TBH market data from Steam...');

  const firstRes = await axios.get(`${STEAM_COMMUNITY}/market/search/render/`, {
    params: {
      appid: APP_ID,
      norender: 1,
      count: PAGE_SIZE,
      start: 0,
      sort_column: 'popular',
      sort_dir: 'desc',
    },
    headers: { 'User-Agent': 'TBH-Market-Bot/1.0' },
    timeout: 15000,
  });

  totalCount = firstRes.data?.total_count ?? 0;
  console.log(`Total items: ${totalCount}`);
  parseItems(firstRes.data?.results ?? [], allItems);

  for (let start = PAGE_SIZE; start < Math.min(totalCount, 2000); start += PAGE_SIZE) {
    await sleep(800);
    try {
      const res = await axios.get(`${STEAM_COMMUNITY}/market/search/render/`, {
        params: {
          appid: APP_ID,
          norender: 1,
          count: PAGE_SIZE,
          start,
          sort_column: 'popular',
          sort_dir: 'desc',
        },
        headers: { 'User-Agent': 'TBH-Market-Bot/1.0' },
        timeout: 15000,
      });
      const results = res.data?.results ?? [];
      if (results.length === 0) break;
      parseItems(results, allItems);
      console.log(`Fetched ${allItems.length} / ${totalCount}`);
    } catch (e) {
      console.error(`Error at start=${start}:`, e.message);
      break;
    }
  }

  return allItems;
}

function parseItems(results, list) {
  for (const item of results) {
    list.push({
      hash_name:     item.hash_name,
      name:          item.name,
      icon_url:      item.asset_description?.icon_url ?? '',
      type:          item.asset_description?.type ?? '',
      sell_price:    item.sell_price ?? 0,
      sell_listings: item.sell_listings ?? 0,
      name_color:    item.asset_description?.name_color ?? '',
    });
  }
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
    JSON.stringify(output, null, 2),
    'utf-8'
  );

  console.log(`✅ Saved ${items.length} items to data/items.json`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
