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
        
        # -> input
        # correo@restaurant.com email field
        elem = page.locator('[id="login-email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("example@gmail.com")
        
        # -> input
        # •••••••• password field
        elem = page.locator('[id="login-password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("password123")
        
        # -> click
        # Ingresar button
        elem = page.locator('[id="login-submit"]')
        await elem.click(timeout=10000)
        
        # -> click
        # Mesero button
        elem = page.get_by_role('button', name='Mesero', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the email field with 'example@gmail.com', fill the password with 'password123', then click the 'Ingresar' button to submit the login form.
        # correo@restaurant.com email field
        elem = page.locator('[id="login-email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("example@gmail.com")
        
        # -> Fill the email field with 'example@gmail.com', fill the password with 'password123', then click the 'Ingresar' button to submit the login form.
        # •••••••• password field
        elem = page.locator('[id="login-password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("password123")
        
        # -> Fill the email field with 'example@gmail.com', fill the password with 'password123', then click the 'Ingresar' button to submit the login form.
        # Ingresar button
        elem = page.locator('[id="login-submit"]')
        await elem.click(timeout=10000)
        
        # -> Click the 'Mesero' quick-access button, then click the 'Ingresar' button to attempt login as the waiter and reach the Tables (Mesas) view.
        # Ingresar button
        elem = page.locator('[id="login-submit"]')
        await elem.click(timeout=10000)
        
        # -> Click the 'Administrador' quick-access button, then click the 'Ingresar' button to attempt login as Administrator and reach the Tables (Mesas) view.
        # Administrador button
        elem = page.get_by_role('button', name='Administrador', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Administrador' quick-access button, then click the 'Ingresar' button to attempt login as Administrator and reach the Tables (Mesas) view.
        # Ingresar button
        elem = page.locator('[id="login-submit"]')
        await elem.click(timeout=10000)
        
        # -> Click the 'Mesas / POS' link in the left sidebar to open the Tables view (Mesas) and display current table states.
        # Mesas / POS link
        elem = page.get_by_role('link', name='Mesas / POS', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify table status data is displayed
        # Assert: The page summary displays '1 libres · 1 ocupadas · 2 mesas', confirming table state counts are shown.
        await expect(page.locator("xpath=/html/body/div/div/div[2]/main").nth(0)).to_contain_text("1 libres \u00b7 1 ocupadas \u00b7 2 mesas", timeout=15000), "The page summary displays '1 libres \u00b7 1 ocupadas \u00b7 2 mesas', confirming table state counts are shown."
        # Assert: Mesa 1 is shown with status 'Libre'.
        await expect(page.locator("xpath=/html/body/div/div/div[2]/main/div/div/div[2]/button[1]").nth(0)).to_contain_text("Libre", timeout=15000), "Mesa 1 is shown with status 'Libre'."
        # Assert: Mesa 2 is shown with status 'Ocupada'.
        await expect(page.locator("xpath=/html/body/div/div/div[2]/main/div/div/div[2]/button[2]").nth(0)).to_contain_text("Ocupada", timeout=15000), "Mesa 2 is shown with status 'Ocupada'."
        
        # --> Verify multiple table states are shown
        # Assert: A table card showing the status "Libre" is visible on the page.
        await expect(page.locator("xpath=/html/body/div/div/div[2]/main/div/div/div[2]/button[1]").nth(0)).to_contain_text("Libre", timeout=15000), "A table card showing the status \"Libre\" is visible on the page."
        # Assert: A table card showing the status "Ocupada" is visible on the page.
        await expect(page.locator("xpath=/html/body/div/div/div[2]/main/div/div/div[2]/button[2]").nth(0)).to_contain_text("Ocupada", timeout=15000), "A table card showing the status \"Ocupada\" is visible on the page."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    