function randomColorValue() {
    return Math.random() * 255;
}

function getRandomColor() {
    return `rgb(${randomColorValue()}, ${randomColorValue()}, ${randomColorValue()})`;
}

function getRandomXAndY({ maxX = 600, maxY = 400 } = {}) {
    return { x: Math.random() * maxX - 10, y: Math.random() * maxY - 10 };
}

function setInputValue(id, value) {
    document.getElementById(id).value = value;
}

function setDisabledArrayOfElements(array, newDisabled) {
    array.forEach(element => setDisabled(element, newDisabled));
}

function setDisableElementId(id, newDisabled) {
    setDisabled(document.getElementById(id), newDisabled);
}

function setDisabled(element, newDisabled) {
    element.disabled = newDisabled;
}

function getObjectButtons() {
    return Array.from(document.getElementsByClassName('obj-btn'));
}

function getInstructionButtons() {
    return Array.from(document.getElementsByClassName('instr-button'));
}

function setVisibilityOfArray(array, newVisibility) {
    array.forEach(element => setVisibilityOfElement(element, newVisibility));
}

function setVisibilityOfElement(element, newVisibility) {
    element.style.display = newVisibility === 'hidden' ? 'none' : 'block';
}

function getNumberOfSteps() {
    return animationInstructions.filter(({ type }) => type === 'step').length;
}

function getInstructionsInStep(stepIndex) {
    let currentStepIndex = -1;
    return animationInstructions.filter(instruction => {
        if (instruction.type === 'step') {
            currentStepIndex++;
            return false;
        }
        if (stepIndex === currentStepIndex) {
            return true;
        }
        return false;
    });
}
