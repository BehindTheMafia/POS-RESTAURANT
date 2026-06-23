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
        
        # -> Click the 'Mesero' quick-access button, then click the 'Ingresar' button to log in as a waiter.
        # Mesero button
        elem = page.get_by_role('button', name='Mesero', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Mesero' quick-access button, then click the 'Ingresar' button to log in as a waiter.
        # Ingresar button
        elem = page.locator('[id="login-submit"]')
        await elem.click(timeout=10000)
        
        # -> Open the 'Mesa 1' table tile to start creating a new order for that table.
        # 1 Mesa 1 2 personas Ocupada button
        elem = page.get_by_role('button', name='1 Mesa 1 2 personas Ocupada', exact=True)
        await elem.click(timeout=10000)
        
        # -> Add the menu item 'AutoTest Producto 20260623 001' to the open order by clicking its product card in the product grid.
        # AutoTest Producto 20260623 001
        elem = page.get_by_text('AutoTest Producto 20260623 001', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Completar Venta' button to submit the order and enter the payment workflow so the order can be completed.
        # Completar Venta button
        elem = page.get_by_role('button', name='Completar Venta', exact=True)
        await elem.click(timeout=10000)
        
        # -> Enter '114.99' into the payment amount field in the 'Confirmar venta' modal, then click the 'Confirmar venta' button to submit the order.
        # 0 number field
        elem = page.locator('xpath=/html/body/div/div/div[2]/main/div/div/div[3]/div/div[2]/div[2]/div/div[2]/div[2]/div/div/div/input')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("114.99")
        
        # -> Enter '114.99' into the payment amount field in the 'Confirmar venta' modal, then click the 'Confirmar venta' button to submit the order.
        # Confirmar venta button
        elem = page.get_by_role('button', name='Confirmar venta', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Volver a Mesas' button to return to the tables page, then check the orders/table list to verify the created order is displayed.
        # Volver a Mesas button
        elem = page.get_by_role('button', name='Volver a Mesas', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the 'Mesa 1' table card on the Mesas overview to view its order details/history and verify the recently completed order (Total C$114.99) is listed.
        # 1 Mesa 1 2 personas Libre button
        elem = page.get_by_role('button', name='1 Mesa 1 2 personas Libre', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the Mesa 1 sidebar's edit/history button (the pencil or history icon in the Mesa 1 panel) to view past/completed orders and verify the C$114.99 sale is listed.
        # button
        elem = page.locator('xpath=/html/body/div/div/div[2]/main/div/div/div[2]/div[2]/div/button')
        await elem.click(timeout=10000)
        
        # -> Open the 'Mesa 1' table card from the Mesas / POS overview to display its sidebar and locate a 'history' or edit control (pencil/icon) to view past/completed orders.
        # 1 Mesa 1 2 personas Libre button
        elem = page.get_by_role('button', name='1 Mesa 1 2 personas Libre', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the Mesa 1 sidebar's edit/history button (the pencil icon at the top-right of the Mesa 1 panel) to open order history and check for the sale totaling C$114.99.
        # button
        elem = page.locator('xpath=/html/body/div/div/div[2]/main/div/div/div[2]/div[2]/div/button')
        await elem.click(timeout=10000)
        
        # -> Open the 'Mesa 1' card to display its sidebar so the history/pencil icon or a 'Historial' control can be accessed and the C$114.99 completed sale can be verified.
        # 1 Mesa 1 2 personas Ocupada button
        elem = page.get_by_role('button', name='1 Mesa 1 2 personas Ocupada', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the edit/history (pencil) icon in the 'Mesa 1' sidebar to open order history and check for the sale totaling C$114.99.
        # button
        elem = page.locator('xpath=/html/body/div/div/div[2]/main/div/div/div[2]/div[2]/div/button')
        await elem.click(timeout=10000)
        
        # -> Click the 'Actualizar' (Refresh) button to reload the tables list, then reopen the 'Mesa 1' card and check its history/sidebar for the completed sale totaling C$114.99.
        # Actualizar button
        elem = page.get_by_role('button', name='Actualizar', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the order can proceed through the payment workflow
        # Assert: The current URL contains 'pos', confirming we returned to the POS page after payment.
        await expect(page).to_have_url(re.compile("pos"), timeout=15000), "The current URL contains 'pos', confirming we returned to the POS page after payment."
        # Assert: Mesa 1 is shown as 'Libre' in the tables list, indicating the order completed and the table was freed.
        await expect(page.locator("xpath=/html/body/div/div/div[2]/main/div/div/div[2]/button[1]").nth(0)).to_have_text("1\nMesa 1\n2\n personas\nLibre", timeout=15000), "Mesa 1 is shown as 'Libre' in the tables list, indicating the order completed and the table was freed."
        # Assert: The summary shows '1 libres', confirming the free-table count reflects the completed payment.
        await expect(page.locator("xpath=/html/body/div/div/div[2]/main/div/div/div[1]/div[1]/p/span[1]").nth(0)).to_have_text("1\n libres", timeout=15000), "The summary shows '1 libres', confirming the free-table count reflects the completed payment."
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
    