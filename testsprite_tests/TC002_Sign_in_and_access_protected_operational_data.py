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
        
        # -> Open the Login page by navigating to /login (the app's /login route) and wait for the login form or interactive elements to appear.
        await page.goto("http://localhost:5173/login")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Fill the 'Correo electrónico' field with example@gmail.com, fill the 'Contraseña' field with password123, then click the 'Ingresar' (Enter) button to submit the form.
        # correo@restaurant.com email field
        elem = page.locator('[id="login-email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("example@gmail.com")
        
        # -> Fill the 'Correo electrónico' field with example@gmail.com, fill the 'Contraseña' field with password123, then click the 'Ingresar' (Enter) button to submit the form.
        # •••••••• password field
        elem = page.locator('[id="login-password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("password123")
        
        # -> Fill the 'Correo electrónico' field with example@gmail.com, fill the 'Contraseña' field with password123, then click the 'Ingresar' (Enter) button to submit the form.
        # Ingresar button
        elem = page.locator('[id="login-submit"]')
        await elem.click(timeout=10000)
        
        # -> Click the 'Administrador' quick-access button to populate developer credentials, then click the 'Ingresar' button to attempt login with those credentials.
        # Administrador button
        elem = page.get_by_role('button', name='Administrador', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Administrador' quick-access button to populate developer credentials, then click the 'Ingresar' button to attempt login with those credentials.
        # Ingresar button
        elem = page.locator('[id="login-submit"]')
        await elem.click(timeout=10000)
        
        # -> Click the 'Mesas / POS' link in the left navigation to open the POS (tables) view so orders, table statuses, and product catalog can be verified.
        # Mesas / POS link
        elem = page.get_by_role('link', name='Mesas / POS', exact=True)
        await elem.click(timeout=10000)
        
        # -> Search the POS page for the visible table text 'Mesa 1' to confirm table/status/orders are displayed, then open the 'Productos' page from the left navigation to verify the product catalog.
        # Productos link
        elem = page.get_by_role('link', name='Productos', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Mesas / POS' link in the left navigation to open the POS (tables) view so orders and table status can be verified.
        # Mesas / POS link
        elem = page.get_by_role('link', name='Mesas / POS', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the 'Mesa 2' card to view its order details and confirm that orders data is displayed.
        # 2 Mesa 2 4 personas Ocupada button
        elem = page.get_by_role('button', name='2 Mesa 2 4 personas Ocupada', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify orders data is displayed
        # Assert: The order contains the product 'Coca Cola' (image alt matches).
        await expect(page.locator("xpath=/html/body/div[1]/div/div[2]/main/div/div/div[2]/div[3]/div[2]/div[1]/img").nth(0)).to_have_attribute("alt", "Coca Cola", timeout=15000), "The order contains the product 'Coca Cola' (image alt matches)."
        # Assert: The order shows quantity '1' for the product.
        await expect(page.locator("xpath=/html/body/div[1]/div/div[2]/main/div/div/div[2]/div[3]/div[2]/div[3]/span").nth(0)).to_have_text("1", timeout=15000), "The order shows quantity '1' for the product."
        # Assert: The order item price/subtotal displays 'C$ 50.00'.
        await expect(page.locator("xpath=/html/body/div[1]/div/div[2]/main/div/div/div[2]/div[4]/div/div[1]/span[2]").nth(0)).to_have_text("C$ 50.00", timeout=15000), "The order item price/subtotal displays 'C$ 50.00'."
        # Assert: The order shows IVA of 'C$ 7.50'.
        await expect(page.locator("xpath=/html/body/div[1]/div/div[2]/main/div/div/div[2]/div[4]/div/div[2]/span[2]").nth(0)).to_have_text("C$ 7.50", timeout=15000), "The order shows IVA of 'C$ 7.50'."
        # Assert: The 'Completar Venta' button is visible to complete the order.
        await expect(page.locator("xpath=/html/body/div[1]/div/div[2]/main/div/div/div[2]/div[4]/button").nth(0)).to_have_text("Completar Venta", timeout=15000), "The 'Completar Venta' button is visible to complete the order."
        
        # --> Verify table status data is displayed
        await page.locator("xpath=/html/body/div[1]/div/div[2]/main/div/div/div[2]/div[2]/div/button").nth(0).scroll_into_view_if_needed()
        # Assert: A table card is visible in the POS, showing table status data is displayed.
        await expect(page.locator("xpath=/html/body/div[1]/div/div[2]/main/div/div/div[2]/div[2]/div/button").nth(0)).to_be_visible(timeout=15000), "A table card is visible in the POS, showing table status data is displayed."
        
        # --> Verify product catalog data is displayed
        # Assert: Product 'AutoTest Producto 20260623 001' is visible in the product catalog.
        await expect(page.locator("xpath=/html/body/div[1]/div/div[2]/main/div/div/div[1]/div[3]/div/div[1]/div[2]/h4").nth(0)).to_have_text("AutoTest Producto 20260623 001", timeout=15000), "Product 'AutoTest Producto 20260623 001' is visible in the product catalog."
        # Assert: Product 'AutoTest Producto 20260623 002' is visible in the product catalog.
        await expect(page.locator("xpath=/html/body/div[1]/div/div[2]/main/div/div/div[1]/div[3]/div/div[2]/div[2]/h4").nth(0)).to_have_text("AutoTest Producto 20260623 002", timeout=15000), "Product 'AutoTest Producto 20260623 002' is visible in the product catalog."
        # Assert: Product 'Coca Cola' is visible in the product catalog.
        await expect(page.locator("xpath=/html/body/div[1]/div/div[2]/main/div/div/div[1]/div[3]/div/div[6]/div[2]/h4").nth(0)).to_have_text("Coca Cola", timeout=15000), "Product 'Coca Cola' is visible in the product catalog."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    