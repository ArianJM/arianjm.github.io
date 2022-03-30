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
        this.type ='step';
    }
}
function addStep() {
    const numberOfSteps = getNumberOfSteps();

    // Insert before animation end.
    animationInstructions.splice(animationInstructions.length - 1, 0, new Step({ caption: `Step: ${numberOfSteps}` }));

    const stepElement = document.createElement('div');

    stepElement.classList.add('flex-col', 'step-obj');
    stepElement.innerHTML = `<h4>Step ${numberOfSteps}</h4>`;
    stepElement.addEventListener('click', selectStepCurried(numberOfSteps - 1));
    document.getElementById('steps-list').appendChild(stepElement);

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

function updateSelectedStep() {
    // Enable instruction creation if step is not "Animation end".
    setDisabledArrayOfElements(getInstructionButtons(), !transformer.nodes().length || currentStep === (getNumberOfSteps() - 1));

    // Deselect all.
    const animationEndEl = document.getElementById('animation-end');
    const stepObjArray = Array.from(document.getElementsByClassName('step-obj'));

    stepObjArray.forEach((element, index) => {
        element.classList.remove('selected');
    });
    animationEndEl.classList.remove('selected');

    // Last step is the "Animation end" state.
    if (currentStep === stepObjArray.length) {
        animationEndEl.classList.add('selected');
    }
    else {
        stepObjArray[currentStep].classList.add('selected');
    }
}

function selectStep(stepIndex) {
    currentStep = stepIndex;

    // Enable instruction creation if step is not "Animation end".
    setDisabledArrayOfElements(getInstructionButtons(), !transformer.nodes().length || currentStep === 0);

    // TODO: Select instruction.
    currentInstruction = 0;

    // Deselect all.
    const animationEndEl = document.getElementById('animation-end');
    const stepObjArray = Array.from(document.getElementsByClassName('step-obj'));

    stepObjArray.forEach((element, index) => {
        element.classList.remove('selected');
    });
    animationEndEl.classList.remove('selected');

    // stepIndex 0 is the "Animation end" state.
    if (stepIndex === 0) {
        animationEndEl.classList.add('selected');
    }
    else {
        stepObjArray[stepIndex - 1].classList.add('selected');
    }
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
                // selectStep(stepIndex === steps.length ? 0 : stepIndex + 1);
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

// function goToStep(stepIndex) {
//     let applyChanges = {};

//     // If currentStep is 0 we're in the "Animatin end" state, so we go backwards from the end.
//     if (currentStep === 0) {
//         applyChanges = getAllBackwardObjectChangesBetween({ fromStepIndex: steps.length - 1, toStepIndex: stepIndex });
//     }
//     else if (stepIndex > currentStep) {
//         applyChanges = getAllForwardObjectChangesBetween({ fromStepIndex: currentStep, toStepIndex: stepIndex });
//     }
//     else if (stepIndex < currentStep) {
//         applyChanges = getAllBackwardObjectChangesBetween({ fromStepIndex: currentStep, toStepIndex: stepIndex });
//     }

//     Object.entries(applyChanges).map(([ target, endState ]) => {
//         layer.find(`#${target}`)[0].to({
//             ...endState,
//             duration: 0,
//         });
//     });
// }

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

    const animationEndEl = document.getElementById('animation-end');

    document.getElementById('animation-end').addEventListener('click', () => {
        Array.from(document.getElementsByClassName('step-obj')).forEach((element, index) => {
            element.classList.remove('selected');
        });
        animationEndEl.classList.add('selected');

        goToEnd();
        updateSelectedStep();
        //selectStep(0);
    });
}
