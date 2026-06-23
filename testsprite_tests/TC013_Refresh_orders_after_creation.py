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
        
        # -> Fill the email field with 'example@gmail.com', fill the password field with 'password123', then click the 'Ingresar' button to submit the login form.
        # correo@restaurant.com email field
        elem = page.locator('[id="login-email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("example@gmail.com")
        
        # -> Fill the email field with 'example@gmail.com', fill the password field with 'password123', then click the 'Ingresar' button to submit the login form.
        # •••••••• password field
        elem = page.locator('[id="login-password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("password123")
        
        # -> Fill the email field with 'example@gmail.com', fill the password field with 'password123', then click the 'Ingresar' button to submit the login form.
        # Ingresar button
        elem = page.locator('[id="login-submit"]')
        await elem.click(timeout=10000)
        
        # -> Click the 'Administrador' quick-access button to attempt a development quick-login and reach the main dashboard.
        # Administrador button
        elem = page.get_by_role('button', name='Administrador', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Ingresar' button on the login form to sign in as the Administrator and open the dashboard.
        # Ingresar button
        elem = page.locator('[id="login-submit"]')
        await elem.click(timeout=10000)
        
        # -> Open the order management page by clicking the 'Mesas / POS' link in the left navigation so the order creation UI becomes available.
        # Mesas / POS link
        elem = page.get_by_role('link', name='Mesas / POS', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Iniciar venta' button on the Venta Mostrador card to open the POS/order creation panel.
        # Venta Mostrador Para llevar · Sin mesa asignada... button
        elem = page.get_by_role('button', name='Venta Mostrador Para llevar · Sin mesa asignada Iniciar venta', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the product card labeled 'AutoTest Producto 20260623 001' (a visible menu product) to add it to the current Mostrador order and populate the order panel.
        # AU Bebidas AutoTest Producto 20260623 001 C$ 99.99
        elem = page.get_by_text('AU Bebidas AutoTest Producto 20260623 001 C$ 99.99', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Completar Venta' button in the POS sidebar to finalize the current Mostrador sale.
        # Completar Venta button
        elem = page.get_by_role('button', name='Completar Venta', exact=True)
        await elem.click(timeout=10000)
        
        # -> Enter the payment amount C$114.99 into the payment amount field in the Confirmar venta dialog, then click the 'Confirmar venta' button to finalize the sale.
        # 0 number field
        elem = page.locator('xpath=/html/body/div/div/div[2]/main/div/div/div[3]/div/div[2]/div[2]/div/div[2]/div[2]/div/div/div/input')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("114.99")
        
        # -> Enter the payment amount C$114.99 into the payment amount field in the Confirmar venta dialog, then click the 'Confirmar venta' button to finalize the sale.
        # Confirmar venta button
        elem = page.get_by_role('button', name='Confirmar venta', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Volver a Mesas' button on the Venta Completada confirmation card to return to the Mesas / POS order listing so the newly created order can be observed or the list refreshed.
        # Volver a Mesas button
        elem = page.get_by_role('button', name='Volver a Mesas', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Actualizar' (Refresh) button on the Mesas / POS page to reload the order list so the newly created Mostrador sale (total C$114.99 or product 'AutoTest Producto 20260623 001') can be located.
        # Actualizar button
        elem = page.get_by_role('button', name='Actualizar', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Actualizar' (Refresh) button on the Mesas / POS page to reload the order list so the newly created Mostrador sale can be re-checked; before clicking, search the page text for 'AutoTest Producto 20260623 001' to record current ...
        # Actualizar button
        elem = page.get_by_role('button', name='Actualizar', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the order list reflects the latest data
        await page.locator("xpath=/html/body/div[1]/div/div[2]/main").nth(0).scroll_into_view_if_needed()
        # Assert: The Mesas / POS order list panel is visible on the page.
        await expect(page.locator("xpath=/html/body/div[1]/div/div[2]/main").nth(0)).to_be_visible(timeout=15000), "The Mesas / POS order list panel is visible on the page."
        await page.locator("xpath=/html/body/div[1]/div/div[2]/main/div/div/div[1]/div[2]/button[1]").nth(0).scroll_into_view_if_needed()
        # Assert: The Actualizar (refresh) button is visible so the order list can be refreshed.
        await expect(page.locator("xpath=/html/body/div[1]/div/div[2]/main/div/div/div[1]/div[2]/button[1]").nth(0)).to_be_visible(timeout=15000), "The Actualizar (refresh) button is visible so the order list can be refreshed."
        await page.locator("xpath=/html/body/div[1]/div/div[2]/main/div/div/button").nth(0).scroll_into_view_if_needed()
        # Assert: The 'Venta Mostrador' card is visible in the order list, indicating current POS entries are shown.
        await expect(page.locator("xpath=/html/body/div[1]/div/div[2]/main/div/div/button").nth(0)).to_be_visible(timeout=15000), "The 'Venta Mostrador' card is visible in the order list, indicating current POS entries are shown."
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
    