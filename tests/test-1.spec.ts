const { test, expect } = require('@playwright/test');

const articleLimit = 100;
const rowLimit = 30;
let rankCounter = 1;
let lastTimeStamp = 0;

test('test', async ({ page }) => {
  // Go to Hacker News
  await page.goto('https://news.ycombinator.com/newest');

  while (rankCounter < articleLimit) {

    const tableLocator = await page.locator('#hnmain');
    const rows = await tableLocator.locator('tr').all();
    
    if (rows.length === 0) { // Safety check
      console.log("No more rows on page");
      break; 
    }

    for (let r = 0; r < rows.length; r++) {
      let hasReachedRowLimit = false;

      const columns = await rows[r].locator('td');
      const span = await columns.locator('span');

      if (await span.count() > 0) {
        hasReachedRowLimit = await filterTableCells(span);
      }

      if (hasReachedRowLimit === true) {
        const moreLink = await page.locator('a.morelink'); 
        await moreLink.click();

        const moreLinkVisible = await moreLink.isVisible();

        if (!moreLinkVisible) {
          console.log("No 'More' link found");
          return; // Exit the test without error
        }
        break;
      }
    }
  }
});

// Function to filter and check the row contents
async function filterTableCells(span) {
  let counter = 0;

  for (let i = 0; i < await span.count(); i++) {
    const column = span.nth(i);
    const title = await column.getAttribute('title');

    if (title) {
      const [ , unixTime] = title.split(' ');

      if (unixTime) {
        await testRowOrder(unixTime);

        rankCounter++;
        counter++;

        if (rankCounter > articleLimit) {
          return false; // Test ends if we've reached the article limit
        }

        if (counter === rowLimit) {
          return true; // Continue to the next batch of rows
        }
      }
    }
  }

  return false;
}

// Function to compare timestamps of rows
async function testRowOrder(currentTimeStamp) {
  const difference = lastTimeStamp - currentTimeStamp;

  if (rankCounter === 1) {
    console.log(`Rank: ${rankCounter}, No data for comparison`);
  } else if (difference > 0) {
    console.log(`Rank: ${rankCounter}, is newer than ${rankCounter - 1}`);
  } else if (difference < 0) {
    console.log(`Rank: ${rankCounter}, is older than ${rankCounter - 1}`);
  } else {
    console.log(`Rank: ${rankCounter} and ${rankCounter - 1}, are the same age`);
  }

  lastTimeStamp = currentTimeStamp;
}