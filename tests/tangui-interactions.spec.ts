import { expect, test, type Page } from "@playwright/test";

async function productState(page: Page) {
  return page.locator(".tangui-product-carousel").evaluate((node) => {
    const center = node.scrollLeft + node.clientWidth / 2;
    const items = Array.from(node.querySelectorAll<HTMLElement>(".product-slide"));
    const nearest = items.reduce((best, item) => Math.abs(item.offsetLeft + item.offsetWidth / 2 - center) < Math.abs(best.offsetLeft + best.offsetWidth / 2 - center) ? item : best);
    return { error: Math.abs(nearest.offsetLeft + nearest.offsetWidth / 2 - center), id: nearest.dataset.productId, offset: node.scrollLeft };
  });
}

async function settled(page: Page) {
  await page.waitForTimeout(550);
  await expect.poll(async () => (await productState(page)).error).toBeLessThan(1);
}

async function swipeProduct(page: Page, direction: -1 | 1) {
  const box = await page.locator(".tangui-product-carousel").boundingBox();
  if (!box) throw new Error("Missing main carousel");
  const fromX = box.x + box.width * (direction === -1 ? 0.8 : 0.2);
  const y = box.y + box.height / 2;
  await page.mouse.move(fromX, y);
  await page.mouse.down();
  for (let step = 1; step <= 10; step += 1) {
    await page.mouse.move(fromX + direction * 195 * step / 10, y);
    await page.waitForTimeout(14);
  }
  await page.mouse.up();
  await settled(page);
}

test.beforeEach(async ({ page }) => { await page.goto("/"); await settled(page); });

test("home centers every product through 12 forward and 12 reverse swipes", async ({ page }) => {
  test.setTimeout(60_000);
  expect((await productState(page)).id).toBe("30");
  for (const direction of [-1, 1] as const) {
    for (let index = 0; index < 12; index += 1) {
      const before = (await productState(page)).id;
      await swipeProduct(page, direction);
      const state = await productState(page);
      expect(state.id).not.toBe(before);
      expect(state.error).toBeLessThan(1);
      await expect(page.locator(".specimen-selector").first().locator(".specimen-option[data-active='true'] strong")).toHaveText(state.id!);
    }
  }
  expect((await productState(page)).id).toBe("30");
});

test("vertical wheel over the main product scrolls the page without moving the product", async ({ page }) => {
  const before = (await productState(page)).offset;
  await page.locator(".tangui-product-carousel").hover();
  await page.mouse.wheel(0, 210);
  await expect.poll(() => page.getByTestId("mobile-scroll").evaluate((node) => node.scrollTop), { timeout: 500 }).toBeGreaterThan(150);
  expect((await productState(page)).offset).toBe(before);
});

test("45 minute detail renders the complete working product image", async ({ page }) => {
  await page.locator(".specimen-selector .specimen-option").nth(2).click();
  await settled(page);
  expect((await productState(page)).id).toBe("45");
  const box = await page.locator(".tangui-product-carousel").boundingBox();
  if (!box) throw new Error("Missing product");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const detail = page.getByTestId("product-detail");
  await expect(detail).toBeVisible();
  const image = detail.locator("img").first();
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBeTruthy();
  await expect(image).toHaveAttribute("src", "/assets/tangui/v5/open-45.webp");
  expect(await image.evaluate((node) => getComputedStyle(node).objectFit)).toBe("contain");
});

test("V5 R3 logo, approved wordmark, archive lockup and WangC signature load", async ({ page }) => {
  for (const selector of [".brand-lockup .brand-symbol", ".brand-wordmark", ".spine-signature"]) {
    await expect.poll(() => page.locator(selector).evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBeTruthy();
  }
  await expect(page.locator(".brand-symbol")).toHaveAttribute("src", "/assets/tangui/v5/logo-symbol.svg");
  await expect(page.locator(".brand-wordmark")).toHaveAttribute("src", "/assets/tangui/v5/logo-wordmark.svg");
  await expect(page.locator(".spine-signature")).toHaveAttribute("alt", "WangC");
  await expect(page.locator("link[rel='icon']")).toHaveAttribute("href", "/assets/tangui/v5/logo-symbol.svg");
  await expect(page.locator("link[rel='apple-touch-icon']")).toHaveAttribute("href", "/assets/tangui/v5/apple-touch-icon.png");
  const symbol = await page.request.get("/assets/tangui/v5/logo-symbol.svg");
  expect(symbol.ok()).toBeTruthy();
  const source = await symbol.text();
  expect(source).toContain('d="M-97.4028 -11.1209 A150 84 -45 1 1 -79.3545 119.9844"');
  expect(source).toContain('d="M-109 -109L0 0"');
  expect(source).toContain('stroke-width="6.4"');
  const touchIcon = await page.request.get("/assets/tangui/v5/apple-touch-icon.png");
  expect(touchIcon.ok()).toBeTruthy();
  expect(touchIcon.headers()["content-type"]).toContain("image/png");
  await page.getByRole("navigation", { name: "檀晷应用导航" }).getByRole("button", { name: "档案", exact: true }).click();
  const lockup = page.locator("img[src='/assets/tangui/v5/logo-lockup.svg']");
  await expect(lockup).toBeVisible();
  await expect.poll(() => lockup.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBeTruthy();
});

test("iPhone-only preview retains its chrome and product across desktop and narrow viewports", async ({ page }) => {
  await expect(page.getByTestId("phone-frame")).toHaveAttribute("data-device", "iphone");
  await expect(page.getByTestId("status-indicators")).toHaveAttribute("data-platform", "ios");
  await expect(page.getByTestId("home-indicator")).toBeVisible();
  await expect(page.getByTestId("device-picker")).toHaveCount(0);
  await expect(page.getByTestId("device-option-pixel-10")).toHaveCount(0);
  await expect(page.getByTestId("android-navigation-bar")).toHaveCount(0);
  await page.locator(".specimen-selector .specimen-option").nth(2).click();
  await settled(page);
  for (const width of [375, 430, 1280]) {
    await page.setViewportSize({ width, height: 850 });
    await settled(page);
    expect((await productState(page)).id).toBe("45");
    await expect(page.locator(".specimen-selector").first().locator(".specimen-option[data-active='true'] strong")).toHaveText("45");
    await expect(page.getByTestId("phone-frame")).toHaveAttribute("data-device", "iphone");
    await expect(page.getByTestId("device-picker")).toHaveCount(0);
  }
});
