const duration = 0.33;

class Instruction {
    newState = null;
    previousState = null;
    targetId = null;

    constructor({ previousState = null, target = null } = {}) {
        this.previousState = previousState;
        this.targetId = target;
    }

    getTarget() {
        return layer.find(`#${this.targetId}`)[0];
    }

    jumpBackward() {
        this.getTarget().to({
            ...this.previousState,
            duration: 0,
        });
    }

    jumpForward() {
        this.getTarget().to({
            ...newState,
            duration: 0,
        });
    }

    play() {
        return new Promise(resolve => {
            this.getTarget().to({
                ...this.newState,
                duration,
                onFinish: () => {
                    resolve();
                },
            });
        });
    }
}

function addInstruction({ inputs, nodes, type }) {
    // Disable buttons.
    setDisabledArrayOfElements(getObjectButtons().concat(getInstructionButtons()).concat(document.getElementById('add-step')), true);

    const newInstruction = new Instruction();

    nodes.forEach((node, index) => {
        const previousState = { x: node.x(), y: node.y() };
        newInstruction.previousState = previousState;
        newInstruction.targetId = node.id();
        animationInstructions.splice(currentInstruction, 0, newInstruction);
    });

    const saveButtonElement = document.createElement('button');
    saveButtonElement.textContent = 'Save';
    saveButtonElement.addEventListener('click', () => {
        nodes.forEach((node, index) => {
            const newState = { x: node.x(), y: node.y() };
            newInstruction.newState = newState;
            setVisibilityOfArray(Array.from(document.getElementsByClassName('instr-parameters')), 'hidden');

            // Re-enable buttons.
            setDisabledArrayOfElements(getObjectButtons().concat(getInstructionButtons()).concat(document.getElementById('add-step')), false);
        });
    });

    const inputElements = inputs.map(({ label, type }) => {
        const labelEl = document.createElement('label');
        const inputEl = document.createElement('input');

        inputEl.setAttribute('type', type);
        inputEl.value = newInstruction.previousState[label];
        inputEl.addEventListener('change', ({ target: { value } }) => {
            nodes.forEach(node => {
                node.to({
                    [label]: parseInt(value, 10),
                    duration: 0,
                });
            });
        });
        labelEl.textContent = label;
        labelEl.appendChild(inputEl);

        return labelEl;
    });

    const parametersElement = document.createElement('div');
    parametersElement.classList.add('instr-parameters');
    parametersElement.append(...inputElements, saveButtonElement);

    const instructionNumber = steps[currentStep].instructions.length;
    const pElement = document.createElement('p');
    pElement.textContent = `${instructionNumber}. ${type}`;
    pElement.id =`s${currentStep}-i${instructionNumber}`;
    pElement.addEventListener('click', () => {
        setVisibilityOfArray(Array.from(document.getElementsByClassName('instr-parameters')), 'show');
    });

    const instructionElement = document.createElement('div');
    instructionElement.classList.add('instr');
    instructionElement.append(pElement, parametersElement);
    document.getElementsByClassName('step-obj')[currentStep - 1].appendChild(instructionElement);
}

function addInstructionsEventListeners() {
    // Move:
    document.getElementById('move-instr').addEventListener('click', () => {
        addInstruction({
            inputs: [ { label: 'x', type: 'number' }, { label: 'y', type: 'number' } ],
            nodes: transformer.nodes(),
            type: 'Move',
        });
    });

    // Rotate:
    document.getElementById('rotate-instr').addEventListener('click', () => {
        transformer.nodes().forEach(node => {
            node.to({
                rotation: Math.random() * 360,
                duration,
            });
        });
    });

    // Scale:
    document.getElementById('scale-instr').addEventListener('click', () => {
        transformer.nodes().forEach(node => {
            node.to({
                scaleX: Math.random() + 0.5,
                scaleY: Math.random() + 0.5,
                duration,
            });
        });
    });

    // Fade:
    document.getElementById('fade-instr').addEventListener('click', () => {
        transformer.nodes().forEach(node => {
            node.to({
                opacity: Math.random(),
                duration,
            });
        });
    });


    // Background color:
    document.getElementById('background-instr').addEventListener('click', () => {
        transformer.nodes().forEach(node => {
            node.to({
                fill: getRandomColor(),
                duration,
            });
        });
    });


    // Border color:
    document.getElementById('border-instr').addEventListener('click', () => {
        transformer.nodes().forEach(node => {
            node.to({
                stroke: getRandomColor(),
                duration,
            });
        });
    });

    // Font color:
    document.getElementById('font-instr').addEventListener('click', () => {
        transformer.nodes().filter(obj => obj instanceof Konva.Text).forEach(node => {
            node.to({
                fill: getRandomColor(),
                duration,
            });
        });
    });
}

function selectInstruction(instructionToSelect) {
    currentInstruction = instructionToSelect;
    Array.from(document.getElementsByClassName(''))
}
