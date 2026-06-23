import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        pw = await async_api.async_playwright().start()

        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        context = await browser.new_context()
        context.set_default_timeout(15000)

        page = await context.new_page()

        await page.goto("http://localhost:5173")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass

        # Sign in as waiter
        elem = page.get_by_role('button', name='Mesero', exact=True)
        await elem.click(timeout=10000)

        elem = page.locator('[id="login-submit"]')
        await elem.click(timeout=10000)

        # Open tables view and pick an available table
        await page.goto("http://localhost:5173/pos")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass

        elem = page.get_by_role('button', name='1 Mesa 1 2 personas Libre', exact=True)
        await elem.click(timeout=10000)

        # Add a menu item — this creates the order and assigns the table
        elem = page.get_by_text('AU Bebidas AutoTest Producto 20260623 001 C$ 99.99', exact=True)
        await elem.click(timeout=10000)

        # Return to tables overview without completing payment
        await page.goto("http://localhost:5173/pos")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass

        # --> Verify the order is created from the selected table
        await expect(
            page.get_by_role('button', name=re.compile(r'1 Mesa 1 2 personas Ocupada'))
        ).to_be_visible(timeout=15000)

        # Open the table again to confirm the order is still assigned
        elem = page.get_by_role('button', name=re.compile(r'1 Mesa 1 2 personas Ocupada'))
        await elem.click(timeout=10000)

        # --> Verify the table remains consistently assigned to the new order
        await expect(page.get_by_text('C$ 114.99')).to_be_visible(timeout=15000)
        await expect(page.get_by_role('button', name='Completar Venta', exact=True)).to_be_visible(timeout=15000)

        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
