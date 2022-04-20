const konvaWidth = 600;
const stage = new Konva.Stage({ container: 'konva', width: konvaWidth, height: 400 });
let layer = new Konva.Layer();
const instructions = [];
let currentTweens = [];
let steps = [];
let currentInstructionIndex = 0;
let currentStepIndex = 0;
let skip = false;
let pause = false;
const duration = 1;
const commonTween = {
    duration,
    easing: Konva.Easings.EaseInOut,
};
const [ height, width ] = [ 50, 50 ];
const textObj = new Konva.Text({
    fontFamily: 'Arial',
    fontSize: 14,
    fontWeight: 400,
    fill: 'rgb(51, 51, 51)',
    fillFalse: true,
    lineHeight: 1.15,
    offset: { x: 1, y: -1 },
    padding: 8,
    text: 'Line 1 This is just to test that many words still work and stuff.\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6',
    x: 556,
    y: 0,
});
const textObjBackground = new Konva.Rect({
    fill: 'rgb(230, 129, 66)',
    // stroke: 'rgb(132, 36, 172)',
    height: textObj.height() - 1,
    // offset: {
    //     x: -1,
    //     y: -1,
    // },

    width: textObj.width() - 1,
    x: 556,
    y: 0,
});
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
        cornerRadius: 10,
        fill: 'rgb(30, 200, 30)',
        height: 42,
        offset: {
            x: -1,
            y: 0,
        },
        stroke: 'rgb(230, 129, 66)',
        x: 202,
        y: 218,
        width: 102,
    }),
    new Konva.Circle({
        fill: 'rgb(220, 4, 4)',
        radius: 49,
        offset: {
            x: -49,
            y: -49,
        },
        // stroke: 'black',
        x: 478,
        y: 42,
    }),
    textObjBackground,
    textObj,
    new Konva.Rect({
        fill: 'black',
        height: 2,
        x: 560,
        y: 20,
        width: 40,
    }),

    // AND gate.
    new Konva.Rect({
        // fill: 'black',
        cornerRadius: [ 0, 50, 50, 0 ],
        height: 49,
        offset: { x: -1 },
        stroke: 'black',
        width: 59,
        x: 50,
        y: 200,
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
    for (let instructionIndex = Math.min(currentInstructionIndex, instructions.length - 1); instructionIndex >= 0; instructionIndex--) {
        const instruction = instructions[instructionIndex];
        if (instruction.type === 'instruction') {
            instruction.node.setAttrs({ ...instruction.oldOptions });
        }
    }
    currentInstructionIndex = 0;
}

function goToEnd() {
    objects[0].text(steps[steps.length - 1].caption);
    objects[0].opacity(1);
    instructions.forEach(instruction => {
        instruction.node.setAttrs({ ...commonTween, ...instruction.options })
    });
}

function goToStep(stepNumber) {
    objects[0].opacity(0);
    objects[0].text(steps[stepNumber - 1].caption);
    const currentPosition = Math.min(currentInstructionIndex, instructions.length - 1);
    const wantedPosition = instructions.indexOf(instructions.filter(instr => instr.type === 'step')[stepNumber - 1]);

    if (currentPosition > wantedPosition) {
        currentTweens.forEach(tween => { tween.finish(); });
        for (let instructionIndex = currentPosition; instructionIndex >= wantedPosition; instructionIndex--) {
            const instruction = instructions[instructionIndex];
            if (instruction.type === 'instruction') {
                instruction.node.setAttrs({ ...instruction.oldOptions });
            }
        }
    }
    else if (currentPosition < wantedPosition) {
        currentTweens.forEach(tween => { tween.reset(); });
        for (let instructionIndex = currentPosition; instructionIndex < wantedPosition; instructionIndex++) {
            const instruction = instructions[instructionIndex];
            if (instruction.type === 'instruction') {
                instruction.node.setAttrs({ ...instruction.options });
            }
        }
    }
    currentInstructionIndex = wantedPosition;
}

function getNextConcurrentInstructionsToExecute() {
    const concurrentInstructions = [ instructions[currentInstructionIndex] ];
    let offset = 1;

    while(instructions[currentInstructionIndex + offset].type !== 'step' && instructions[currentInstructionIndex + offset].delay === 0) {
        concurrentInstructions.push(instructions[currentInstructionIndex + offset]);
        offset++;
    }

    return concurrentInstructions;
}

function playNextStep() {
    document.getElementById('play').style = 'display: none';
    document.getElementById('stop').style = 'display: initial';

    const currentInstruction = instructions[currentInstructionIndex];
    if (currentInstruction.type === 'step') {
        currentTweens = [ new Konva.Tween({
            ...commonTween,
            node: objects[0],
            opacity: 0,
            onFinish: () => {
                objects[0].text(currentInstruction.caption);
                currentTweens = [ new Konva.Tween({
                    ...commonTween,
                    node: objects[0],
                    opacity: 1,
                    onFinish: processTweenEndCurried(),
                }) ];
                currentTweens.forEach(tween => { tween.play(); });
            },
        }) ];
    }

    currentTweens.forEach(tween => { tween.play(); });
}

function stepPressed(stepNumber) {
    stopButtonPressed();
    goToStep(stepNumber);
    playNextStep();
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

    currentTweens.forEach(tween => { tween.pause(); });
}

function processTweenEndCurried() {
    return () => {
        output.appendChild(document.createTextNode(`${skip ? 'Skipping' : 'Ending'} instruction ${currentInstructionIndex}.\n`));
        currentInstructionIndex++;
        const nextInstruction = instructions[currentInstructionIndex];

        if (nextInstruction?.type === 'instruction') {
            if (skip) {
                nextInstruction.node.setAttrs(nextInstruction.options);
            }
            else {
                currentTweens = getNextConcurrentInstructionsToExecute().map(instruction => new Konva.Tween({
                    ...commonTween,
                    ...instruction.options,
                    node: instruction.node,
                }));
                currentInstructionIndex += currentTweens.length - 1;
                currentTweens[currentTweens.length - 1].onFinish = processTweenEndCurried();
                currentTweens.forEach(tween => { tween.play(); });
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
        { type: 'instruction', node: objects[2], options: { radius: 80 } },
        { type: 'instruction', node: objects[2], options: { x: 500, y: 250 }, delay: 0 },
        { type: 'instruction', node: objects[2], options: { opacity: .4 }, delay: 0 },
        { type: 'instruction', node: objects[3], options: { x: 0, y: 100 } },
        { type: 'instruction', node: objects[4], options: { x: 0, y: 100 }, delay: 0 },
        { type: 'instruction', node: objects[5], options: { x: 0, y: 116 } },
        { type: 'instruction', node: objects[5], options: { y: 132 } },
        { type: 'instruction', node: objects[5], options: { y: 148 } },
        { type: 'instruction', node: objects[5], options: { y: 164 } },
        { type: 'instruction', node: objects[5], options: { y: 180 } },
        { type: 'instruction', node: objects[5], options: { y: 196 } },
        { type: 'step', caption: 'Next' },
        // { type: 'instruction', node: objects[1], options: { x: 200, y: 150 } },
        // { type: 'instruction', node: objects[1], options: { height: 100, width: 100 } },
        { type: 'step', caption: captions[1] },
        // { type: 'instruction', node: objects[1], options: { x: 200, y: 300 } },
        { type: 'instruction', node: objects[2], options: { radius: 5 } },
        { type: 'step', caption: captions[2] },
    );
    steps = instructions.filter(({ type }) => type === 'step');

    const output = document.getElementById('output');
    let stepNumber = 0;

    instructions.forEach((instruction, instructionIndex) => {
        if (instruction.type === 'step') {
            objects[0].text(instruction.caption);
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
        }
    });
    currentInstructionIndex = instructions.length;

    document.getElementById('play').addEventListener('click', playButtonPressed);
    document.getElementById('stop').addEventListener('click', stopButtonPressed);
})();
