import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:5173")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Navigate to http://localhost:5173/tables and verify that access is blocked and that no protected table status data (table rows, statuses, or table management UI) is displayed without signing in.
        await page.goto("http://localhost:5173/tables")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # --> Assertions to verify final state
        
        # --> Verify access is blocked
        # Assert: The page URL contains '/login', indicating access to /tables was redirected to the login page.
        await expect(page).to_have_url(re.compile("/login"), timeout=15000), "The page URL contains '/login', indicating access to /tables was redirected to the login page."
        await page.locator("xpath=/html/body/div/div/div[2]/div/form/button[1]").nth(0).scroll_into_view_if_needed()
        # Assert: The login page is displayed because the 'Ingresar' button is visible.
        await expect(page.locator("xpath=/html/body/div/div/div[2]/div/form/button[1]").nth(0)).to_be_visible(timeout=15000), "The login page is displayed because the 'Ingresar' button is visible."
        current_url = await page.evaluate("() => window.location.href")
        # Assert: page loaded with a URL (final outcome verified by the AI judge during the run)
        assert current_url, 'Page should have loaded with a URL'
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    