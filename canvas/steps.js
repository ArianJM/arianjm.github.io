class Step {
    caption = '';
    type = 'step';

    jumpBackward() {
        console.log(`Jumping backward. Caption: ${this.caption}`);
    }

    jumpForward() {
        console.log(`Jumping forward. Caption: ${this.caption}`);
    }

    constructor({ caption }) {
        this.caption = caption;
    }
}

function addStep() {
    const numberOfSteps = getNumberOfSteps();

    // Insert before animation end.
    animationInstructions.splice(animationInstructions.length - 1, 0, new Step({ caption: `Step: ${numberOfSteps}` }));
    goToStep(numberOfSteps - 1);
    updateSelectedStep();
}

function stopAnimating() {
    console.log('TODO: Stop animating.');
}

function selectStepCurried(stepIndex) {
    return () => {
        stopAnimating();
        goToStep(stepIndex);
        updateSelectedStep();
    }
}

function renderSteps() {
    const stepsElement = document.getElementById('steps-list');
    const stepFragments = [];
    let instructionIndex = 0;

    for (let stepIndex = 0; stepIndex < getNumberOfSteps(); stepIndex++) {
        const stepElement = document.createElement('div');

        const classes = [ 'flex-col', 'step-obj' ];

        if (stepIndex === currentStep) {
            classes.push('selected');
        }

        stepElement.classList.add(...classes);
        stepElement.addEventListener('click', selectStepCurried(stepIndex));

        let h4Element = document.createElement('h4');
        stepElement.append(h4Element);

        // Animation end, insert at the beginning.
        if (stepIndex === getNumberOfSteps() - 1) {
            h4Element.textContent = 'Animation end';
            stepFragments.unshift(stepElement);
        }
        else {
            h4Element.textContent = `Step ${stepIndex + 1}`;
            stepFragments.push(stepElement);
        }

        instructionIndex++;

        stepElement.append(...getInstructionsInStep(stepIndex).map((instruction, stepInstructionIndex) => {
            const pElement = document.createElement('p');
            pElement.textContent = `${stepInstructionIndex + 1}. ${instruction.type}`;
            pElement.addEventListener('click', selectInstructionCurried(instructionIndex));

            const instructionElement = document.createElement('div');
            instructionElement.id = `instr-${instructionIndex}`;
            instructionElement.classList.add('instr');
            instructionElement.append(pElement);

            instructionIndex++;

            return instructionElement;
        }));
    }
    stepsElement.innerHTML = '';
    stepsElement.append(...stepFragments);
}

function updateSelectedStep() {
    // Enable instruction creation if step is not "Animation end".
    setDisabledArrayOfElements(getInstructionButtons(), !transformer.nodes().length || currentStep === (getNumberOfSteps() - 1));
    renderSteps();
}

function playStep(stepIndex, instructionIndex) {
    // stepIndex 0 is the "Animation end" state. So we jump to step 1 and start there.
    if (stepIndex === 0) {
        goToBeginning();
        playStep(1, 0);
        return;
    }

    const { newState, target } = steps[stepIndex].instructions[instructionIndex];
    currentStep = stepIndex;
    currentInstruction = instructionIndex;

    layer.find(`#${target}`)[0].to({
        ...newState,
        duration,
        onFinish: () => {
            if (stop) {
                return;
            }

            if ((steps[stepIndex].instructions.length - 1) > instructionIndex) {
                console.log('Finished instruction');
                playStep(stepIndex, instructionIndex + 1);
            }
            else if ((steps[stepIndex].length - 1) > stepIndex){
                console.log('Finished step');
                playButton.textContent = 'Play';
                updateSelectedStep();
            }
            else {
                console.log('Finished animation');
                playButton.textContent = 'Play';
                goToEnd();
                updateSelectedStep();
            }
        }
    });
}

function getAllForwardObjectChangesBetween({ fromStepIndex, toStepIndex, fromInstructionIndex = 0, toInstructionIndex }) {
    const applyChanges = {};
    const defaultToInstructionIndex = toInstructionIndex ?? steps[toStepIndex].instructions.length;

    for (let stepIndex = fromStepIndex; stepIndex < toStepIndex; stepIndex++) {
        const step = steps[stepIndex];
        const fromInstructionForStep = stepIndex === fromStepIndex ? fromInstructionIndex : 0;
        const toInstructionForStep = stepIndex === (toStepIndex - 1) ? defaultToInstructionIndex : step.instructions.length;

        for (let instructionIndex = fromInstructionForStep; instructionIndex < toInstructionForStep; instructionIndex++) {
            const { newState, target } = step.instructions[instructionIndex];

            if (applyChanges[target]) {
                Object.assign(applyChanges[target], newState);
            }
            else {
                applyChanges[target] = newState;
            }
        }
    }

    return applyChanges;
}

function getAllBackwardObjectChangesBetween({ fromStepIndex, toStepIndex, fromInstructionIndex, toInstructionIndex = 0 }) {
    const applyChanges = {};
    const defaultFromInstructionIndex = fromInstructionIndex ?? steps[fromStepIndex].instructions.length - 1;

    for (let stepIndex = fromStepIndex; stepIndex >= toStepIndex; stepIndex--) {
        const step = steps[stepIndex];
        const fromInstructionForStep = stepIndex === fromStepIndex ? defaultFromInstructionIndex : step.instructions.length - 1;
        const toInstructionForStep = stepIndex === toStepIndex ? toInstructionIndex : 0;

        for (let instructionIndex = fromInstructionForStep; instructionIndex >= toInstructionForStep; instructionIndex--) {
            const { previousState, target } = step.instructions[instructionIndex];

            if (applyChanges[target]) {
                Object.assign(applyChanges[target], previousState);
            }
            else {
                applyChanges[target] = previousState;
            }
        }
    }

    return applyChanges;
}

function addStepsEventListeners() {
    // Add step:
    document.getElementById('add-step').addEventListener('click', () => {
        addStep();
    });
}
