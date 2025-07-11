const { test, expect } = require('@playwright/test');

test.describe('WanderLog Stepper Navigation', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the app
        await page.goto('http://localhost:8000');
        
        // Wait for the app to load
        await page.waitForSelector('#createPage', { timeout: 10000 });
        
        // Clear any existing data
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    });

    test('Step 2 to Step 3 navigation should work correctly', async ({ page }) => {
        console.log('🧪 Starting step navigation test...');
        
        // Step 1: Enter country and find cities
        console.log('📍 Step 1: Entering country...');
        await page.fill('#countryInputStep1', 'Thailand');
        await page.click('button:has-text("Find Cities & Activities")');
        
        // Wait for cities to load
        console.log('🏙️ Waiting for cities to load...');
        await page.waitForSelector('.city-card', { timeout: 15000 });
        
        // Verify we're on step 2
        console.log('✅ Checking we are on step 2...');
        const step2Indicator = await page.locator('#step2');
        await expect(step2Indicator).toHaveClass(/active/);
        
        // Step 2: Select a city
        console.log('🎯 Step 2: Selecting a city...');
        const firstCityCard = await page.locator('.city-card').first();
        await firstCityCard.click();
        
        // Verify city is selected
        await expect(firstCityCard).toHaveClass(/selected/);
        
        // Verify Next button is enabled
        console.log('🔘 Checking Next button is enabled...');
        const nextButton = await page.locator('#nextStepBtnStep2');
        await expect(nextButton).not.toBeDisabled();
        
        // Click Next button
        console.log('➡️ Clicking Next button...');
        await nextButton.click();
        
        // Wait a moment for navigation
        await page.waitForTimeout(1000);
        
        // Check if we're still on step 2 (should be step 3)
        console.log('🔍 Checking current step after clicking Next...');
        const currentStep = await page.evaluate(() => {
            const step1 = document.getElementById('step1');
            const step2 = document.getElementById('step2');
            const step3 = document.getElementById('step3');
            const step4 = document.getElementById('step4');
            
            if (step1.classList.contains('active')) return 1;
            if (step2.classList.contains('active')) return 2;
            if (step3.classList.contains('active')) return 3;
            if (step4.classList.contains('active')) return 4;
            return 0;
        });
        
        console.log(`📍 Current step after clicking Next: ${currentStep}`);
        
        // This should be step 3, not step 1
        expect(currentStep).toBe(3);
        
        // Additional verification - check if step 3 content is visible
        const step3Content = await page.locator('#step3Content');
        await expect(step3Content).toBeVisible();
        
        console.log('✅ Test completed successfully!');
    });

    test('Step navigation should not reset to step 1', async ({ page }) => {
        console.log('🧪 Starting regression test...');
        
        // Navigate to step 2
        await page.fill('#countryInputStep1', 'Japan');
        await page.click('button:has-text("Find Cities & Activities")');
        await page.waitForSelector('.city-card', { timeout: 15000 });
        
        // Select a city
        const firstCityCard = await page.locator('.city-card').first();
        await firstCityCard.click();
        
        // Verify we're on step 2
        const step2Indicator = await page.locator('#step2');
        await expect(step2Indicator).toHaveClass(/active/);
        
        // Click Next multiple times to check for regression
        for (let i = 0; i < 3; i++) {
            console.log(`🔄 Clicking Next button (attempt ${i + 1})...`);
            
            const nextButton = await page.locator('#nextStepBtnStep2');
            await nextButton.click();
            
            await page.waitForTimeout(500);
            
            // Check current step
            const currentStep = await page.evaluate(() => {
                const step1 = document.getElementById('step1');
                const step2 = document.getElementById('step2');
                const step3 = document.getElementById('step3');
                const step4 = document.getElementById('step4');
                
                if (step1.classList.contains('active')) return 1;
                if (step2.classList.contains('active')) return 2;
                if (step3.classList.contains('active')) return 3;
                if (step4.classList.contains('active')) return 4;
                return 0;
            });
            
            console.log(`📍 Current step after click ${i + 1}: ${currentStep}`);
            
            // Should not be step 1
            expect(currentStep).not.toBe(1);
        }
        
        console.log('✅ Regression test passed!');
    });

    test('Debug step navigation with console logs', async ({ page }) => {
        console.log('🧪 Starting debug test...');
        
        // Enable console logging
        page.on('console', msg => {
            if (msg.text().includes('[UI]')) {
                console.log(`[BROWSER] ${msg.text()}`);
            }
        });
        
        // Navigate to step 2
        await page.fill('#countryInputStep1', 'Italy');
        await page.click('button:has-text("Find Cities & Activities")');
        await page.waitForSelector('.city-card', { timeout: 15000 });
        
        // Select a city
        const firstCityCard = await page.locator('.city-card').first();
        await firstCityCard.click();
        
        // Click Next and monitor console
        const nextButton = await page.locator('#nextStepBtnStep2');
        await nextButton.click();
        
        // Wait for any async operations
        await page.waitForTimeout(2000);
        
        // Check final state
        const currentStep = await page.evaluate(() => {
            const step1 = document.getElementById('step1');
            const step2 = document.getElementById('step2');
            const step3 = document.getElementById('step3');
            const step4 = document.getElementById('step4');
            
            if (step1.classList.contains('active')) return 1;
            if (step2.classList.contains('active')) return 2;
            if (step3.classList.contains('active')) return 3;
            if (step4.classList.contains('active')) return 4;
            return 0;
        });
        
        console.log(`📍 Final step: ${currentStep}`);
        expect(currentStep).toBe(3);
        
        console.log('✅ Debug test completed!');
    });
}); 