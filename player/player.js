const animationSteps = [];
const animationInstructions = [
    { caption: 'Move Rect 1, then make bigger', type: 'step' },
    {
        animate: { x: 100, y: 120 },
        objId: 0,
        previousState: { x: 0, y: 0 },
    },
    {
        animate: { height: 80, width: 80 },
        objId: 0,
        previousState: { height: 50, width: 50 },
    },
    { caption: 'Make Circle 1 bigger and move above Rect 1 at the same time', type: 'step' },
    {
        animate: { radius: 80 },
        objId: 1,
        previousState: { radius: 10 },
    },
    {
        delay: 0,
        animate: {x: 100, y: 120 },
        objId: 1,
        previousState: { x: 5, y: 50 },
    },
    { caption: 'Animation end', type: 'step' },
];

animationInstructions.forEach((instruction, index) => {
    if (instruction.type === 'step') {
        animationSteps.push({ caption: instruction.caption, instructions: [] });
        const newButton = document.createElement('button');

        newButton.textContent = animationSteps.length;
        newButton.id = `step-${animationSteps.length}`
        newButton.addEventListener('click', ({ target: { id } }) => {
            stepPressed(parseInt(id.replace('step-', ''), 10));
        });
        document.getElementById('timeline').appendChild(newButton);
    }
    animationSteps[animationSteps.length - 1].instructions.push(instruction);

    const output = document.getElementById('output');

    instruction.play = () => new Promise(resolve => {
        if (instruction.type === 'step') {
            output.appendChild(document.createTextNode(`Play step ${currentStep}, instruction index ${index}: ${instruction.caption}\n`));
        }
        else {
            output.appendChild(document.createTextNode(`  Playing instruction index ${index}: ${JSON.stringify(instruction.animate)}\n`));
        }
        setTimeout(resolve, 1000);
    });
    instruction.undo = () => {
        if (instruction.type === 'step') {
            output.appendChild(document.createTextNode(`Undoing step ${currentStep}, instruction index ${index}: ${instruction.caption}\n`));
        }
        else {
            output.appendChild(document.createTextNode(`  Undoing instruction index ${index}: ${JSON.stringify(instruction.previousState)}\n`));
        }
    };
    instruction.redo = () => {
        if (instruction.type === 'step') {
            output.appendChild(document.createTextNode(`Redoing step ${currentStep}, instruction index ${index}: ${instruction.caption}\n`));
        }
        else {
            output.appendChild(document.createTextNode(`  Redoing instruction index ${index}: ${JSON.stringify(instruction.animate)}\n`));
        }
    };
});

let currentStep = animationSteps.length;
let currentInstruction = animationInstructions.length;

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
    const undoOrRedo = (instructionNumber - currentInstruction) < 0 ? 'undo' : 'redo';
    let instructionStepChange = undoOrRedo === 'redo' ? 1 : -1;

    while (currentInstruction !== instructionNumber) {
        let instruction = animationInstructions[currentInstruction];

        if (undoOrRedo === 'undo') {
            currentInstruction--;
            instruction = animationInstructions[currentInstruction];
            if (instruction.type === 'step') {
                currentStep--;
            }
        }

        instruction[undoOrRedo]();

        if (undoOrRedo === 'redo') {
            currentInstruction++;
            if (instruction.type === 'step') {
                currentStep++;
            }
        }
    }
}

function goToStep(stepNumber) {
    let searchStepNumber = 0;
    const instructionIndex = animationInstructions.findIndex(({ type }) => {
        if (type === 'step') {
            searchStepNumber++;
        }
        return searchStepNumber === stepNumber;
    });

    goToInstruction(instructionIndex);
    currentStep = stepNumber - 1;
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

    // If we reach the last step, run it.
    if (currentStep === animationSteps.length - 1) {
        animationInstructions[currentInstruction].play();
        currentInstruction++;
        currentStep++;
    }
}

// Actions
function stepPressed(stepNumber) {
    stopAnimating();
    goToStep(stepNumber);
    playNextStep();
}

function backToStartPressed() {
    stopAnimating();
    goToEnd();
}

function playButtonPressed() {
    // TODO:
    // if on last step
    if (currentInstruction >= animationInstructions.length) {
        goToBeginning();
    }
    debugger;
    playNextStep();
}

(function() {
    const undoButton = document.getElementById('undo');

    undoButton.addEventListener('click', function() {
        if (currentInstruction <= 0) {
            output.appendChild(document.createTextNode(`-- Already at the beginning, can't go back.\n`));
            return;
        }
        goToInstruction(currentInstruction - 1);
    });

    document.getElementById('play').addEventListener('click', playButtonPressed);

    document.getElementById('redo').addEventListener('click', function() {
        if (currentInstruction >= animationInstructions.length) {
            output.appendChild(document.createTextNode(`-- Already at the end, can't go forward.\n`));
            return;
        }
        goToInstruction(currentInstruction + 1);
    });
})();
