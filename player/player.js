const konvaWidth = 600;
const stage = new Konva.Stage({ container: 'konva', width: konvaWidth, height: 400 });
let layer = new Konva.Layer();
let currentStep = 0;
let currentInstruction = 0;
let animationInstructions = [];
const animationSteps = [];

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

function scrollToBottom() {
    output.scrollTop = output.scrollHeight;
}

// needed for builder, not player
function goToInstruction(instructionNumber) {
    const undoOrRedo = (instructionNumber - currentInstruction) < 0 ? 'undo' : 'redo';
    let instructionStepChange = undoOrRedo === 'redo' ? 1 : -1;

    debugger;

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
    scrollToBottom();
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
    animationInstructions.forEach(instruction => {
        instruction.animate?.pause();
    });
    console.log('TODO: Stop animating');
    // Stop any animating. Note: The promises need to resolve with forcedStop
}

async function playNextStep() {
    document.getElementById('play').disabled = true;
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
    document.getElementById('play').disabled = false;
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
    if (currentInstruction >= animationInstructions.length - 1) {
        goToBeginning();
    }
    playNextStep();
    scrollToBottom();
}

(function() {
    const [ height, width ] = [ 50, 50 ];
    const objects = [
        new Konva.Text({
            align: 'center',
            fontFamily: 'HelveticaNeue-Light,"Helvetica Neue Light","Helvetica Neue",Helvetica,Arial,"Lucida Grande",sans-serif',
            fontSize: 15,
            width: konvaWidth,
        }),
        new Konva.Rect({
            fill: 'blue',
            height,
            offset: {
                x: width / 2,
                y: height / 2,
            },
            stroke: 'black',
            x: 100,
            y: 100,
            width,
        }),
        new Konva.Circle({
            fill: 'red',
            radius: 10,
            stroke: 'black',
            x: 50,
            y: 50,
        }),
    ];
    objects.forEach((obj, index) => {
        obj.id(String(index));
    });
    layer.add(...objects);
    stage.add(layer);

    animationInstructions = [
        { caption: 'Move Rect 1, then make bigger', type: 'step' },
        {
            nextState: { x: 200, y: 150 },
            objId: '1',
            previousState: { x: 100, y: 100 },
        },
        {
            nextState: { height: 100, width: 100 },
            objId: '1',
            previousState: { height: 50, width: 50 },
        },
        { caption: 'Make Circle 1 bigger and move above Rect 1 at the same time', type: 'step' },
        {
            nextState: { radius: 80 },
            objId: '2',
            previousState: { radius: 10 },
        },
        {
            nextState: { x: 500, y: 250 },
            objId: '2',
            previousState: { x: 50, y: 50 },
            delay: 0,
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
        else {
            instruction.animate = new Konva.Tween({
                duration: 1,
                easing: Konva.Easings.EaseInOut,
                node: layer.find(`#${instruction.objId}`)[0],
                ...instruction.nextState,
            });
        }
        animationSteps[animationSteps.length - 1].instructions.push(instruction);

        const output = document.getElementById('output');

        instruction.play = () => new Promise(resolve => {
            if (instruction.type === 'step') {
                output.appendChild(document.createTextNode(`Play step ${currentStep}, instruction index ${index}: ${instruction.caption}\n`));
                resolve();
            }
            else {
                instruction.animate.onFinish = () => { resolve(); };
                instruction.animate.reset();
                instruction.animate.play();
                output.appendChild(document.createTextNode(`  Playing instruction index ${index}: ${JSON.stringify(instruction.nextState)}\n`));
            }
        });
        instruction.undo = () => {
            if (instruction.type === 'step') {
                output.appendChild(document.createTextNode(`Undoing step ${currentStep}, instruction index ${index}: ${instruction.caption}\n`));
            }
            else {
                instruction.animate.reset();
                output.appendChild(document.createTextNode(`  Undoing instruction index ${index}: ${JSON.stringify(instruction.previousState)}\n`));
            }
        };
        instruction.redo = () => {
            if (instruction.type === 'step') {
                output.appendChild(document.createTextNode(`Redoing step ${currentStep}, instruction index ${index}: ${instruction.caption}\n`));
            }
            else {
                instruction.animate.finish();
                output.appendChild(document.createTextNode(`  Redoing instruction index ${index}: ${JSON.stringify(instruction.nextState)}\n`));
            }
        };
    });

    goToEnd();

    const undoButton = document.getElementById('undo');

    undoButton.addEventListener('click', function() {
        if (currentInstruction <= 0) {
            output.appendChild(document.createTextNode(`-- Already at the beginning, can't go back.\n`));
            scrollToBottom();
            return;
        }
        goToInstruction(currentInstruction - 1);
        scrollToBottom();
    });

    document.getElementById('play').addEventListener('click', playButtonPressed);

    document.getElementById('redo').addEventListener('click', function() {
        if (currentInstruction >= animationInstructions.length) {
            output.appendChild(document.createTextNode(`-- Already at the end, can't go forward.\n`));
            scrollToBottom();
            return;
        }
        goToInstruction(currentInstruction + 1);
        scrollToBottom();
    });
})();
