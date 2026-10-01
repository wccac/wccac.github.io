import { expect, test, type Page } from "@playwright/test";

async function swipe(page: Page, distance = 130) {
  const carousel = page.locator(".fixture-carousel");
  const box = await carousel.boundingBox();
  if (!box) throw new Error("Carousel is not visible");
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
  await page.mouse.down();
  for (let step = 1; step <= 8; step += 1) {
    await page.mouse.move(box.x + box.width * 0.8 - distance * step / 8, box.y + box.height / 2);
    await page.waitForTimeout(10);
  }
  await page.mouse.up();
}

async function centerError(page: Page) {
  return page.locator(".fixture-carousel").evaluate((node) => {
    const center = node.scrollLeft + node.clientWidth / 2;
    return Math.min(...Array.from(node.querySelectorAll<HTMLElement>(".carousel-card"), (item) =>
      Math.abs(item.offsetLeft + item.offsetWidth / 2 - center),
    ));
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/runtime-fixture.html?snap=center");
});

test("a released product swipe springs to an exact item center without moving its parent", async ({ page }) => {
  await swipe(page);
  await expect.poll(() => centerError(page)).toBeLessThan(0.8);
  expect(await page.getByTestId("mobile-scroll").evaluate((node) => node.scrollTop)).toBe(0);
  await expect(page.getByTestId("tap-count")).toHaveText("0");
});

test("a vertical mouse wheel over the product immediately scrolls the parent", async ({ page }) => {
  const carousel = page.locator(".fixture-carousel");
  await carousel.hover();
  await page.mouse.wheel(0, 170);
  await expect.poll(() => page.getByTestId("mobile-scroll").evaluate((node) => node.scrollTop), { timeout: 500 }).toBeGreaterThan(100);
  expect(await carousel.evaluate((node) => node.scrollLeft)).toBe(0);
});

test("vertical wheel also works on free-scrolling rails", async ({ page }) => {
  await page.goto("/tests/runtime-fixture.html");
  await page.locator(".fixture-carousel").hover();
  await page.mouse.wheel(0, 150);
  await expect.poll(() => page.getByTestId("mobile-scroll").evaluate((node) => node.scrollTop), { timeout: 500 }).toBeGreaterThan(100);
});

test("horizontal trackpad motion settles to an item center", async ({ page }) => {
  const carousel = page.locator(".fixture-carousel");
  await carousel.hover();
  await page.mouse.wheel(230, 0);
  await expect.poll(() => carousel.evaluate((node) => node.scrollLeft)).toBeGreaterThan(100);
  await expect.poll(() => centerError(page)).toBeLessThan(0.8);
  expect(await page.getByTestId("mobile-scroll").evaluate((node) => node.scrollTop)).toBe(0);
});

test("a loop recenter during settling does not pull back to the old cycle", async ({ page }) => {
  await swipe(page, 120);
  await page.waitForTimeout(50);
  await page.locator(".fixture-carousel").evaluate((node) => { node.scrollLeft += 384; });
  await page.waitForTimeout(850);
  expect(await page.locator(".fixture-carousel").evaluate((node) => node.scrollLeft)).toBeGreaterThan(450);
  expect(await centerError(page)).toBeLessThan(0.8);
});

test("a loop recenter while dragging keeps following the same pointer", async ({ page }) => {
  const carousel = page.locator(".fixture-carousel");
  const box = await carousel.boundingBox();
  if (!box) throw new Error("Carousel is not visible");
  const startX = box.x + box.width * 0.8;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX - 60, startY, { steps: 4 });
  await carousel.evaluate((node) => { node.scrollLeft += 384; });
  await page.mouse.move(startX - 100, startY, { steps: 3 });
  expect(await carousel.evaluate((node) => node.scrollLeft)).toBeCloseTo(484, 0);
  await page.mouse.up();
  await expect.poll(() => centerError(page)).toBeLessThan(0.8);
});

test("reduced motion snaps directly with no rebound", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await swipe(page);
  expect(await centerError(page)).toBeLessThan(0.8);
  const settled = await page.locator(".fixture-carousel").evaluate((node) => node.scrollLeft);
  await page.waitForTimeout(180);
  expect(await page.locator(".fixture-carousel").evaluate((node) => node.scrollLeft)).toBe(settled);
});

test("a new tap immediately after a completed drag is not swallowed", async ({ page }) => {
  await swipe(page);
  await expect.poll(() => centerError(page)).toBeLessThan(0.8);
  const carousel = page.locator(".fixture-carousel");
  const box = await carousel.boundingBox();
  if (!box) throw new Error("Carousel is not visible");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByTestId("tap-count")).toHaveText("1");
});

test("resizing a settled carousel recenters an item without user input", async ({ page }) => {
  await swipe(page);
  await page.waitForTimeout(700);
  await expect.poll(() => centerError(page)).toBeLessThan(0.8);
  await page.locator(".fixture-carousel").evaluate((node) => { (node as HTMLElement).style.width = "80%"; });
  await expect.poll(() => centerError(page)).toBeLessThan(0.8);
});
