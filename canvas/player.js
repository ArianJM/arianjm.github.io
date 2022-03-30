function getNextConcurrentInstructionsToExecute(instructions) {
    const concurrentInstructions = [ instructions[0] ];
    for (let i = 1; i < instructions.length; i++) {
        if (instructions[i].delay !== 0) {
            break;
        }
        concurrentInstructions.push(instructions[1]);
    }
    return concurrentInstructions;
}

function getInstructionsForNextStep() {
    return animationInstructions.slice(currentInstruction, animationInstructions.findIndex((instr, index) => (index > currentInstruction) && (instr.type === 'step')))
}

// Needed for builder, not player
function goToInstruction(instructionNumber) {
    const forwardOrBackward = (instructionNumber - currentInstruction) < 0 ? 'Backward' : 'Forward';
    let instructionStepChange = forwardOrBackward === 'Forward' ? 1 : -1;

    while (currentInstruction !== instructionNumber) {
        let instruction = animationInstructions[currentInstruction];

        if (forwardOrBackward === 'Backward') {
            currentInstruction--;
            instruction = animationInstructions[currentInstruction];
            if (instruction.type === 'step') {
                currentStep--;
            }
        }

        instruction[`jump${forwardOrBackward}`]();

        if (forwardOrBackward === 'Forward') {
            currentInstruction++;
            if (instruction.type === 'step') {
                currentStep++;
            }
        }
    }
}

function goToStep(stepIndex) {
    let searchStepNumber = 0;
    const instructionIndex = animationInstructions.findIndex(({ type }) => {
        if (searchStepNumber === stepIndex) {
            return true;
        }
        searchStepNumber++;
        return false;
    });

    goToInstruction(instructionIndex);
    currentStep = stepIndex;
}

function goToBeginning() {
    goToInstruction(0);
}

function goToEnd() {
    goToInstruction(animationInstructions.length - 1);
}

function stopAnimating() {
    console.log('TODO: Stop animating');
    // Stop any animating. Note: The promises need to resolve with forcedStop
}

async function playNextStep() {
    instructionsInStep = getInstructionsForNextStep();

    while (instructionsInStep.length) {
        const instructionsToPlay = getNextConcurrentInstructionsToExecute(instructionsInStep);

        // This would avoid the need to compute a "isPromiseStale", like AnimationPlayer currently does.
        await Promise.all(instructionsToPlay.map(instructionToPlay => {
            const promise = instructionToPlay.play();
            currentInstruction++;
            return promise;
        }));

        // TODO
        // if (forcedStop) return;

        instructionsInStep.splice(0, instructionsToPlay.length);
    }
    output.appendChild(document.createTextNode(`End of step: ${currentStep}\n`));
    currentStep++;

    // If we reach the last step, run it (it's the animation end step).
    if (currentStep === animationSteps.length - 1) {
        animationInstructions[currentInstruction].play();
        currentInstruction++;
        currentStep++;
    }
}
