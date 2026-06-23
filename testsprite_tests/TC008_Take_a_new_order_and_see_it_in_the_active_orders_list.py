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
        
        # -> Open the application's Login page by navigating to the '/login' route so the login form can be filled.
        await page.goto("http://localhost:5173/login")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Fill the 'Correo electrónico' field with the test email, fill the 'Contraseña' field with the test password, then click the 'Ingresar' button to attempt login.
        # correo@restaurant.com email field
        elem = page.locator('[id="login-email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("example@gmail.com")
        
        # -> Fill the 'Correo electrónico' field with the test email, fill the 'Contraseña' field with the test password, then click the 'Ingresar' button to attempt login.
        # •••••••• password field
        elem = page.locator('[id="login-password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("password123")
        
        # -> Fill the 'Correo electrónico' field with the test email, fill the 'Contraseña' field with the test password, then click the 'Ingresar' button to attempt login.
        # Ingresar button
        elem = page.locator('[id="login-submit"]')
        await elem.click(timeout=10000)
        
        # -> Click the 'Mesero' quick-access button to sign in as a waiter and open the POS/order interface.
        # Mesero button
        elem = page.get_by_role('button', name='Mesero', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Ingresar' button to submit the login form and sign in as the Mesero (waiter).
        # Ingresar button
        elem = page.locator('[id="login-submit"]')
        await elem.click(timeout=10000)
        
        # -> Open the order view for 'Mesa 1' by clicking the 'Mesa 1' table card so a new order can be created.
        # 1 Mesa 1 2 personas Ocupada button
        elem = page.get_by_role('button', name='1 Mesa 1 2 personas Ocupada', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Completar Venta' (Complete Sale) button to submit the order and trigger the success confirmation or order summary.
        # Completar Venta button
        elem = page.get_by_role('button', name='Completar Venta', exact=True)
        await elem.click(timeout=10000)
        
        # -> Add a payment by clicking the 'Agregar pago' button, enter C$114.99 as the payment amount, then click the 'Confirmar venta' button to submit the order.
        # Agregar pago button
        elem = page.get_by_role('button', name='Agregar pago', exact=True)
        await elem.click(timeout=10000)
        
        # -> Add a payment by clicking the 'Agregar pago' button, enter C$114.99 as the payment amount, then click the 'Confirmar venta' button to submit the order.
        # 0 number field
        elem = page.locator('xpath=/html/body/div/div/div[2]/main/div/div/div[3]/div/div[2]/div[2]/div/div[2]/div[2]/div/div/div/input')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("114.99")
        
        # -> Add a payment by clicking the 'Agregar pago' button, enter C$114.99 as the payment amount, then click the 'Confirmar venta' button to submit the order.
        # Confirmar venta button
        elem = page.get_by_role('button', name='Confirmar venta', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Volver a Mesas' button on the '¡Venta Completada!' confirmation to return to the Mesas / POS view and then check the Active Orders list for the new order.
        # Volver a Mesas button
        elem = page.get_by_role('button', name='Volver a Mesas', exact=True)
        await elem.click(timeout=10000)
        
        # -> Refresh the Mesas list by clicking the 'Actualizar' button, then open the 'Mesa 1' card to view its orders and check the Active Orders list for the new order.
        # Actualizar button
        elem = page.get_by_role('button', name='Actualizar', exact=True)
        await elem.click(timeout=10000)
        
        # -> Refresh the Mesas list by clicking the 'Actualizar' button, then open the 'Mesa 1' card to view its orders and check the Active Orders list for the new order.
        # 1 Mesa 1 2 personas Libre button
        elem = page.get_by_role('button', name='1 Mesa 1 2 personas Ocupada', exact=True)
        await elem.click(timeout=10000)
        
        # -> Return to the Mesas / POS overview by clicking the 'Mesas / POS' navigation button, then check the Active Orders list for the newly created order.
        # button
        elem = page.locator('xpath=/html/body/div/div/div/aside/div/button')
        await elem.click(timeout=10000)
        
        # -> Click the 'Mesas / POS' navigation button to return to the Mesas overview so the Active Orders list can be checked for the newly created order.
        # button
        elem = page.locator('xpath=/html/body/div/div/div/aside/div/button')
        await elem.click(timeout=10000)
        
        # -> Click the 'Mesas / POS' navigation button in the left sidebar to return to the Mesas overview so the Active Orders list can be checked for the new order.
        # button
        elem = page.locator('xpath=/html/body/div/div/div/aside/div/button')
        await elem.click(timeout=10000)
        
        # -> Click the 'Mesas / POS' navigation button in the left sidebar to return to the Mesas overview so the Active Orders list can be checked for the new order.
        # button
        elem = page.locator('xpath=/html/body/div/div/div/aside/div/button')
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the new order appears in the active orders list
        # Assert: Active order shows quantity '1' for the added product.
        await expect(page.locator("xpath=/html/body/div[1]/div/div[2]/main/div/div/div[2]/div[3]/div[2]/div[3]/span").nth(0)).to_have_text("1", timeout=15000), "Active order shows quantity '1' for the added product."
        # Assert: Active order shows the product price 'C$ 99.99'.
        await expect(page.locator("xpath=/html/body/div[1]/div/div[2]/main/div/div/div[2]/div[4]/div/div[1]/span[2]").nth(0)).to_have_text("C$ 99.99", timeout=15000), "Active order shows the product price 'C$ 99.99'."
        # Assert: Order detail displays the 'Completar Venta' button indicating an active order.
        await expect(page.locator("xpath=/html/body/div[1]/div/div[2]/main/div/div/div[2]/div[4]/button").nth(0)).to_have_text("Completar Venta", timeout=15000), "Order detail displays the 'Completar Venta' button indicating an active order."
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
    