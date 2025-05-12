// 通用函数：设置输入框或滑块的值（React 兼容）
const setInputValue = (element, value, options = {}) => {
    if (!element) {
        console.error('Element not found for setting value');
        return false;
    }

    const isSlider = element.getAttribute('role') === 'slider';
    const { triggerChange = isSlider, updateAria = isSlider } = options;

    // 检查禁用或只读状态
    const wasDisabled = element.disabled;
    const wasReadOnly = element.readOnly;
    if (wasDisabled) element.disabled = false;
    if (wasReadOnly) element.readOnly = false;

    try {
        // 使用原生的 value setter
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
        ).set;

        // 创建 React 兼容的 input 事件
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        Object.defineProperty(inputEvent, 'target', { writable: false, value: element });
        Object.defineProperty(inputEvent, 'currentTarget', { writable: false, value: element });

        // 设置值
        nativeInputValueSetter.call(element, value);
        element.setAttribute('value', value);

        // 更新 ARIA 属性（滑块）
        if (updateAria) {
            element.setAttribute('aria-valuenow', value);
            element.setAttribute('aria-valuetext', `${value} units`);
        }

        // 模拟焦点（滑块）
        if (isSlider) {
            element.focus();
        }

        // 触发 input 事件
        element.dispatchEvent(inputEvent);

        // 触发 change 事件（如果需要）
        if (triggerChange) {
            const changeEvent = new Event('change', { bubbles: true, cancelable: true });
            Object.defineProperty(changeEvent, 'target', { writable: false, value: element });
            Object.defineProperty(changeEvent, 'currentTarget', { writable: false, value: element });
            element.dispatchEvent(changeEvent);
        }

        // 模拟失焦（滑块）
        if (isSlider) {
            element.blur();
        }

        console.log(`${isSlider ? 'Slider' : 'Input'} value after set:`, element.value);
    } catch (error) {
        console.error('Error setting input value:', error);
        return false;
    } finally {
        // 恢复状态
        if (wasDisabled) element.disabled = true;
        if (wasReadOnly) element.readOnly = true;
    }

    return true;
};

// 通用函数：模拟点击
const simulateClick = (element, type = 'button') => {
    if (!element) {
        console.error(`${type} not found`);
        return false;
    }

    if (element.disabled) {
        console.warn(`${type} is disabled, click ignored`);
        return false;
    }

    const mouseClickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: element.getBoundingClientRect().left + 10,
        clientY: element.getBoundingClientRect().top + 10
    });
    const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window });
    const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window });

    element.focus();
    element.dispatchEvent(mouseDownEvent);
    element.dispatchEvent(mouseClickEvent);
    element.dispatchEvent(mouseUpEvent);
    console.log(`${type} clicked`);
    return true;
};

// 通用函数：点击标签
const clickTab = (id, text) => {
    const element = Array.from(document.querySelectorAll(`div[role="tab"][id="${id}"].bn-tab.bn-tab__buySell`))
        .find(el => el.textContent.trim() === text);
    
    if (!element) {
        console.error(`Tab "${text}" not found with id "${id}"`);
        return false;
    }

    return simulateClick(element, `Tab "${text}"`);
};

// 异步延迟函数
const randomDelay = (min = 1000, max = 3000) => {
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(`Waiting for ${ms}ms`);
    return new Promise(resolve => setTimeout(resolve, ms));
};

// 点击确认按钮
const clickConfirmButton = () => {
    const button = document.querySelector('.bn-modal-footer .bn-button.bn-button__primary');
    if (!button) {
        console.error('Confirm button not found');
        return false;
    }
    return simulateClick(button, 'Confirm button');
};

// 重置交易面板
const resetTradePanel = async () => {
    try {
        // 关闭模态框
        const modal = document.querySelector('.bn-modal-footer');
        if (modal) {
            const cancelButton = document.querySelector('.bn-modal-footer .bn-button:not(.bn-button__primary)');
            if (cancelButton) {
                if (!simulateClick(cancelButton, 'Cancel button')) {
                    console.warn('Failed to click cancel button');
                }
                await randomDelay(500, 1000); // 较短延迟以关闭模态框
            }
        }

        // 确保回到买入标签
        if (!clickTab('bn-tab-0', '买入')) {
            console.error('Failed to reset to Buy tab');
            return false;
        }
        await randomDelay(500, 1000);

        // 等待页面稳定
        const buyInput = document.querySelector('#fromCoinAmount');
        const slider = document.querySelector('input[role="slider"]');
        if (!buyInput || !slider) {
            console.error('Trade panel elements not found after reset');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error resetting trade panel:', error);
        return false;
    }
};

// 主函数：执行交易
const executeTrade = async (iteration) => {
    try {
        console.log(`Starting trade iteration ${iteration}`);

        // 重置状态
        if (!(await resetTradePanel())) {
            throw new Error('Failed to reset trade panel');
        }

        // 获取最新元素
        const buyInput = document.querySelector('#fromCoinAmount');
        const slider = document.querySelector('input[role="slider"]');
        console.log('Buy input:', buyInput, 'Slider:', slider);
        if (!buyInput || !slider) {
            throw new Error('Required elements not found');
        }
        console.log('Buy input disabled:', buyInput.disabled, 'value:', buyInput.value);
        console.log('Slider disabled:', slider.disabled, 'value:', slider.value);

        // 1. 点击买入标签
        if (!clickTab('bn-tab-0', '买入')) {
            throw new Error('Failed to click Buy tab');
        }
        await randomDelay(500, 1000);

        // 2. 输入买入金额 8
        if (!setInputValue(buyInput, '8')) {
            throw new Error('Failed to set buy input value');
        }
        console.log('Buy input after set:', buyInput.value);
        await randomDelay(2000, 4000);


        // 设置滑点
        // 定位包含设置滑点元素
        const button = document.querySelector('div.t-subtitle3.text-PrimaryText div.bn-flex.cursor-pointer');
        // 触发点击事件
        if (button) {
            button.click();
        } else {
            console.error('未找到目标按钮');
        }
        await randomDelay(500, 1000);

        // 定位包含“自定义”文本的 div 元素
        const buttonList = document.querySelectorAll('div.t-subtitle1.text-PrimaryText');
        let targetButton = null;

        for (let button of buttonList) {
            if (button.textContent.includes('自定义')) {
                targetButton = button;
                break;
            }
        }
        await randomDelay(500, 1000);

        // 触发点击事件
        if (targetButton) {
            targetButton.click();
        } else {
            console.error('未找到包含“自定义”的按钮');
        }
        await randomDelay(500, 1000);
        const customizeinput = document.querySelector('#customize-slippage');
        setInputValue(customizeinput, '0.1')
        await randomDelay(500, 1000);
        // 8. 点击确认按钮
        if (!clickConfirmButton()) {
            throw new Error('Failed to click Confirm button for sell');
        }
        await randomDelay(3000, 5000);

        // 3. 点击买入按钮
        const buyButton = document.querySelector('.bn-button.bn-button__buy');
        if (!buyButton || !simulateClick(buyButton, 'Buy button')) {
            throw new Error('Failed to click Buy button');
        }
        await randomDelay(500, 1000);

        // 4. 点击确认按钮
        if (!clickConfirmButton()) {
            throw new Error('Failed to click Confirm button for buy');
        }
        await randomDelay(3000, 5000); // 额外延迟以确保交易完成

        // 5. 点击卖出标签
        if (!clickTab('bn-tab-1', '卖出')) {
            throw new Error('Failed to click Sell tab');
        }
        await randomDelay(500, 1000);

        // 6. 滑动100%卖出
        if (!setInputValue(slider, '100', { triggerChange: true, updateAria: true })) {
            throw new Error('Failed to set slider value');
        }
        console.log('Slider after set:', slider.value);
        await randomDelay(3000, 5000);

        // 设置滑点
        // 定位包含设置滑点元素
        const cursorbutton = document.querySelector('div.t-subtitle3.text-PrimaryText div.bn-flex.cursor-pointer');
        if (cursorbutton) {
            cursorbutton.click();
        } else {
            console.error('未找到目标按钮');
        }
        await randomDelay(500, 1000);

        // 定位包含“自定义”文本的 div 元素
        // 定位包含“自定义”文本的 div 元素
        const buttonList2 = document.querySelectorAll('div.t-subtitle1.text-PrimaryText');
        let targetButton2 = null;
        for (let button of buttonList2) {
            if (button.textContent.includes('自定义')) {
                targetButton2 = button;
                break;
            }
        }
        await randomDelay(500, 1000);

        // 触发点击事件
        if (targetButton2) {
            targetButton2.click();
        } else {
            console.error('未找到包含“自定义”的按钮');
        }
        await randomDelay(500, 1000);
        const customizeinput2 = document.querySelector('#customize-slippage');
        setInputValue(customizeinput2, '0.1')
        await randomDelay(500, 1000);
        // 8. 点击确认按钮
        if (!clickConfirmButton()) {
            throw new Error('Failed to click Confirm button for sell');
        }
        await randomDelay(3000, 5000);

        // 7. 点击卖出按钮
        const sellButton = document.querySelector('.bn-button.bn-button__sell');
        if (!sellButton || !simulateClick(sellButton, 'Sell button')) {
            throw new Error('Failed to click Sell button');
        }
        await randomDelay(500, 1000);

        // 8. 点击确认按钮
        if (!clickConfirmButton()) {
            throw new Error('Failed to click Confirm button for sell');
        }
        await randomDelay(1000, 2000);

        console.log(`Trade iteration ${iteration} completed successfully`);
    } catch (error) {
        console.error(`Error during trade iteration ${iteration}:`, error.message);
        throw error; // 抛出错误以便循环处理
    }
};

// 循环执行主函数 20 次
const runTradeLoop = async (maxIterations = 100) => {
    let successfulIterations = 0;
    let failedIterations = 0;

    for (let i = 1; i <= maxIterations; i++) {
        try {
            console.log(`=== Starting iteration ${i} of ${maxIterations} ===`);
            await executeTrade(i);
            successfulIterations++;
            console.log(`=== Iteration ${i} succeeded ===`);
        } catch (error) {
            failedIterations++;
            console.error(`=== Iteration ${i} failed: ${error.message} ===`);
            // 等待较短时间后继续下一次循环
            await randomDelay(1000, 2000);
        }
        // 在每次迭代后添加额外延迟以确保页面状态稳定
        await randomDelay(3000, 7000);
    }

    console.log(`Trade loop completed: ${successfulIterations} successful, ${failedIterations} failed`);
};

// 启动循环
runTradeLoop(3).catch(error => {
    console.error('Trade loop encountered an unexpected error:', error);
});