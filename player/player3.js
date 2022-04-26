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
        X: -1,
        y: 359,
    }),
    textObjBackground,
    textObj,
    new Konva.Rect({
        cornerRadius: 10,
        fill: 'rgb(30, 200, 30)',
        height: 42,
        offset: {
            x: 51,
            y: 21,
        },
        rotation: 0,
        stroke: 'rgb(230, 129, 66)',
        x: 252,
        y: 242,
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
        y: 46,
    }),
    new Konva.Rect({
        fill: 'black',
        height: 2,
        x: 560,
        y: 20,
        width: 40,
    }),

    // AND gate.
    new Konva.Path({
        data: 'M 0 0 H 36 C 65 0, 65 48, 36 48 H 0 Z',
        height: 50,
        offset: { x: 30, y: 25 },
        stroke: 'black',
        strokeScaleEnabled: false,
        width: 60,
        x: 51 + 30,
        y: 51 + 25,
    }),

    // Triangle
    new Konva.RegularPolygon({
        fill: '#333',
        offset: { y: -1 },
        rotation: 45,
        sides: 3,
        radius: 7,
        //width: 14,
        x: 126,
        y: 356,
    }),

    // OR gate.
    new Konva.Path({
        data: 'M 0 0 H 10 C 55 0, 55 22, 55 24 C 55 26, 55 48, 10 48 H 0 Q 20 20, 0 0 Z',
        height: 50,
        offset: { x: 30, y: 25 },
        stroke: 'rgb(87, 128, 220)',
        strokeScaleEnabled: false,
        width: 60,
        x: 150 + 30,
        y: 51 + 25,
    }),
    // XOR gate.
    new Konva.Path({
        data: 'M 0 0 H 10 C 56 0, 56 22, 56 24 C 56 26, 56 48, 10 48 H 0 Q 20 24, 0 0 Z M -5 0 Q 15 24, -5 48',
        offset: { x: 30, y: 25 },
        stroke: 'rgb(87, 128, 220)',
        strokeScaleEnabled: false,
        x: 200 + 33,
        y: 3 + 25,
    }),
    // NOT gate.
    new Konva.Path({
        data: `
M 40 25 V 11 L 59 21
M 59 26 L 40 36 V 25
M 59 24 a 5,5 0 1,1 10,0 a 5,5 0 1,1 -10,0`,
        offset: { x: 30, y: 25 },
        stroke: 'rgb(87, 128, 220)',
        strokeScaleEnabled: false,
        x: 170 + 32,
        y: 51 + 25,
    }),

    // NAND gate.
    new Konva.Path({
        data: `
M 0 0 H 36 C 65 0, 65 48, 36 48 H 0 Z
M 60 24 a 5,5 0 1,1 10,0 a 5,5 0 1,1 -10,0`,
        offset: { x: 30, y: 25 },
        stroke: 'rgb(87, 128, 220)',
        strokeScaleEnabled: false,
        x: 50 + 31,
        y: 260 + 26,
    }),

    // NOR gate.
    new Konva.Path({
        data: `
M 0 0 H 10 C 57 0, 57 22, 57 24 C 57 26, 57 48, 10 48 H 0 Q 20 20, 0 0 Z
M 59 24 a 5,5 0 1,1 10,0 a 5,5 0 1,1 -10,0`,
        offset: { x: 30, y: 25 },
        stroke: 'rgb(87, 128, 220)',
        strokeScaleEnabled: false,
        x: 50 + 32,
        y: 320 + 26,
        }),
    // XNOR gate.
    new Konva.Path({
        data: `
M 0 0 H 10 C 56 0, 56 22, 56 24 C 56 26, 56 48, 10 48 H 0 Q 20 24, 0 0 Z M -5 0 Q 15 24, -5 48
M 58 24 a 5,5 0 1,1 10,0 a 5,5 0 1,1 -10,0`,
        offset: { x: 30, y: 25 },
        stroke: 'rgb(87, 128, 220)',
        strokeScaleEnabled: false,
        x: 130 + 33,
        y: 260 + 26,
    }),
];

const imgObj = new Image();

imgObj.onload = () => {
    const konvaImage = new Konva.Image().setAttrs({
        height: 160,
        id: objects.length,
        image: imgObj,
        offset: { x: 105, y: 80 },
        width: 209,
        x: 360 + 104,
        y: 230 + 80,
    });
    objects.push(konvaImage);
    layer.add(konvaImage);
    const instruction = { type: 'instruction', node: objects[14], options: { rotation: 180 } };
    instruction.oldOptions = Object.fromEntries(Object.keys(instruction.options).map(key => [ key, instruction.node[key]() ]));
    instruction.node.setAttrs(instruction.options);
    instructions.splice(1, 0, instruction);
    currentInstructionIndex = instructions.length;
};
imgObj.src = 'train.png';

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

function emptyFunction() {}

function stepPressed(stepNumber) {
    stopButtonPressed();
    currentTweens.forEach(tween => { tween.onFinish = emptyFunction });
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
        { type: 'instruction', node: objects[8], options: { scaleX: 40 / objects[8].width(), scaleY: 80 / objects[8].height(), x: objects[8].x() - 10, y: objects[8].y() + 16 } },
        { type: 'instruction', node: objects[3], options: { rotation: 30 } },
        { type: 'instruction', node: objects[1], options: { opacity: .33 } },
        { type: 'instruction', node: objects[2], options: { opacity: .33 }, delay: 0 },
        { type: 'instruction', node: objects[1], options: { x: 0, y: 100 } },
        { type: 'instruction', node: objects[2], options: { x: 0, y: 100 }, delay: 0 },
        { type: 'instruction', node: objects[5], options: { x: 0, y: 122 } },
        { type: 'instruction', node: objects[4], options: { fill: 'rgb(176, 214, 251)' } },
        { type: 'instruction', node: objects[3], options: { stroke: 'rgb(136, 100, 65)' } },
        { type: 'instruction', node: objects[1], options: { opacity: 1 } },
        { type: 'instruction', node: objects[2], options: { opacity: 1 }, delay: 0 },
        { type: 'instruction', node: objects[2], options: { fill: 'rgb(255, 211, 100)' } },
        { type: 'step', caption: captions[1] },
        { type: 'instruction', node: objects[13], options: { scaleX: 2, scaleY: 1.2, x: 300, y: objects[13].y() + 5 } },
        { type: 'instruction', node: objects[12], options: { scaleX: 2, scaleY: 1.2, x: objects[12].x() + 30, y: objects[12].y() + 5 }, delay: 0 },
        { type: 'instruction', node: objects[11], options: { scaleX: 2, scaleY: 1.2, x: objects[11].x() + 30, y: objects[11].y() + 5 }, delay: 0 },
        { type: 'step', caption: 'Another step' },
        { type: 'instruction', node: objects[5], options: { x: 0, y: 138 } },
        { type: 'instruction', node: objects[5], options: { x: 0, y: 154 } },
        { type: 'instruction', node: objects[5], options: { x: 0, y: 170 } },
        { type: 'instruction', node: objects[5], options: { x: 0, y: 186 } },
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
