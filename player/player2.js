const konvaWidth = 600;
const stage = new Konva.Stage({ container: 'konva', width: konvaWidth, height: 400 });
let layer = new Konva.Layer();
let steps = [];
const instructions = [];
const duration = 1;
let currentInstructionIndex = 0;
let currentStepIndex = 0;
let skip = false;
let pause = false;
const commonTween = {
    duration,
    easing: Konva.Easings.EaseInOut,
};
const [ height, width ] = [ 50, 50 ];
const objects = [
    new Konva.Text({
        align: 'center',
        fontFamily: 'HelveticaNeue-Light,"Helvetica Neue Light","Helvetica Neue",Helvetica,Arial,"Lucida Grande",sans-serif',
        fontSize: 15,
        opacity: 1,
        width: konvaWidth,
        y: 350,
    }),
    new Konva.Rect({
        fill: 'blue',
        height,
        offset: {
            x: width / 2,
            y: height / 2,
        },
        stroke: 'black',
        x: 50,
        y: 300,
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

const fadeOutOptions = {
    ...commonTween,
    opacity: 0,
};
const fadeInOptions = {
    ...commonTween,
    opacity: 1,
}

function goToBeginning() {
    objects[0].opacity(0);
    objects[0].text(steps[0].caption);
    for (let instructionIndex = currentInstructionIndex; instructionIndex >= 0; instructionIndex--) {
        const instruction = instructions[instructionIndex];
        instruction.node.setAttrs({ ...instruction.oldOptions });
    }
    currentInstructionIndex = 0;
}

function goToEnd() {
    skip = true;
    objects[0].text(steps[steps.length - 1].caption);
    objects[0].opacity(1);
    instructions.forEach(instruction => {
        instruction.node.to({ ...commonTween, ...instruction.options })
    })
    skip = false;
}

function playNextStep() {
    document.getElementById('play').style = 'display: none';
    document.getElementById('stop').style = 'display: initial';
    if (instructions[currentInstructionIndex].type === 'step') {
        objects[0].to({
            ...fadeOutOptions,
            onFinish: () => {
                objects[1].text(instructions[currentInstructionIndex].text);
                objects[1].to({
                    ...fadeInOptions,
                    onFinish: () => {
                        currentInstructionIndex++;
                        instructions[currentInstructionIndex].node.to({ ...commonTween, ...instructions[currentInstructionIndex].options })
                    },
                });
            },
        });
    }
    else {
        instructions[currentInstructionIndex].node.to({ ...commonTween, ...instructions[currentInstructionIndex].options });
    }
}

function playButtonPressed() {
    pause = false;
    if (currentInstructionIndex >= instructions.length) {
        goToBeginning();
    }
    playNextStep();
}

function stopButtonPressed() {
    document.getElementById('play').style = 'display: initial';
    document.getElementById('stop').style = 'display: none';
    pause = true;

    instructions[currentInstructionIndex].tween?.pause();
}

function processTweenEndCurried(instructionIndex) {
    return () => {
        output.appendChild(document.createTextNode(`${skip ? 'Skipping' : 'Ending'} instruction ${instructionIndex}.\n`));
        currentInstructionIndex++;
        const nextInstruction = instructions[currentInstructionIndex];

        if (nextInstruction?.type === 'instruction') {
            if (skip) {
                nextInstruction.node.setAttrs(nextInstruction.options);
            }
            else {
                nextInstruction.node.to({ ...commonTween, ...nextInstruction.options });
            }
        }
        else if (nextInstruction?.type === 'step') {
            currentStepIndex++;
            document.getElementById('stop').style = 'display: none';
            document.getElementById('play').style = 'display: initial';
        }

        // If only last step remains (animation end caption), play it.
        if (!skip && (currentInstructionIndex === instructions.length - 1) && nextInstruction.type === 'step') {
            playNextStep();
        }
    };
}

(function() {
    const captions = [ 'Step 1 caption', 'Step 2 caption', 'Animation end' ];

    instructions.push(
        { type: 'step', caption: captions[0] },
        { type: 'instruction', node: objects[1], options: { x: 200, y: 150 } },
        { type: 'instruction', node: objects[1], options: { height: 100, width: 100 } },
        { type: 'step', caption: captions[1] },
        { type: 'instruction', node: objects[2], options: { radius: 80, x: 500, y: 250 } },
        { type: 'instruction', node: objects[1], options: { x: 20, y: 15 } },
        { type: 'instruction', node: objects[2], options: { radius: 5 } },
        { type: 'step', caption: captions[2] },
    );
    steps = instructions.filter(({ type }) => type === 'step');

    const output = document.getElementById('output');
    let stepNumber = 0;

    instructions.forEach((instruction, instructionIndex) => {
        if (instruction.type === 'step') {
            stepNumber++;
            const newButton = document.createElement('button');

            newButton.textContent = stepNumber;
            newButton.id = `step-${stepNumber}`;
            newButton.addEventListener('click', ({ target: { id } }) => {
                stepPressed(parseInt(id.replace('step-', ''), 10));
            });
            document.getElementById('timeline').appendChild(newButton);
        }
        else {
            instruction.oldOptions = Object.fromEntries(Object.keys(instruction.options).map(key => [ key, instruction.node[key]() ]));
            instruction.node.setAttrs(instruction.options);
            instruction.options.onFinish = processTweenEndCurried(instructionIndex);
        }
    });
    currentInstructionIndex = instructions.length;

    // goToEnd();

    // document.getElementById('undo').addEventListener('click', function() {
    //     if (currentInstruction <= 0) {
    //         output.appendChild(document.createTextNode(`-- Already at the beginning, can't go back.\n`));
    //         return;
    //     }
    //     goToInstruction(currentInstruction - 1);
    // });

    document.getElementById('play').addEventListener('click', playButtonPressed);
    document.getElementById('stop').addEventListener('click', stopButtonPressed);

    // document.getElementById('redo').addEventListener('click', function() {
    //     if (currentInstruction >= animationInstructions.length) {
    //         output.appendChild(document.createTextNode(`-- Already at the end, can't go forward.\n`));
    //         return;
    //     }
    //     goToInstruction(currentInstruction + 1);
    // });
})();
