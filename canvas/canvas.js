const cppCode = '#include <iostream>\nusing namespace std;\n\nint main() {\n   int wage;\n\n   wage = 20;\n\n   cout << "Salary is ";\n   cout << wage * 40 * 52;\n   cout << endl;\n\n   return 0;\n}';
const pngs = [ 'alex-edgcomb', 'bailey-miller', 'colin-frerichs', 'curtis-hohl', 'erin-cardenas', 'hari-gangadharan', 'keith-zmudzinski', 'kenny-chen', 'ryan-renno', 'sarah-strawn' ].map(name => `${name}.png`);
const imgsList = pngs.concat([ 'archana-prasad', 'arian-jimenez', 'christopher_turner', 'ethan-valdez', 'kaden-johnsen', 'lester-delacruz', 'lyssa-vanderbeek', 'matthew-donnelly', 'maya-varghese' ].map(name => `${name}.jpg`));

function randomColorValue() {
    return Math.random() * 255;
}

function getRandomColor() {
    return `rgb(${randomColorValue()}, ${randomColorValue()}, ${randomColorValue()})`;
}

function getRandomXAndY({ maxX = 600, maxY = 400 } = {}) {
    return { x: Math.random() * maxX - 10, y: Math.random() * maxY - 10 };
}

function createCodeObject({ code, konvaShape = null, method, x = 0, y = 0 }) {
    const preEl = document.body.appendChild(document.createElement('pre'));
    const codeEl = preEl.appendChild(document.createElement('code'));

    codeEl.textContent = code;

    hljs.highlightElement(preEl);

    html2canvas(preEl).then(canvas => {
        konvaShape.image(canvas)
    });
}

(function() {
    let currentStep = 1;
    const initialObjectsState = [];
    const objects = [];
    const stage = new Konva.Stage({ container: 'konva', width: 600, height: 400 });
    let layer = new Konva.Layer();
    const steps = [ { initialState: layer, instructions: [] } ];
    stage.add(layer);

    const transformer = new Konva.Transformer();
    layer.add(transformer);

    const selectionRectangle = new Konva.Rect({ fill: 'rgba(0, 0, 170, 0.4)', stroke: 'rgba(0, 0, 170, 0.8)', visible: false });
    layer.add(selectionRectangle);
    layer.draw();

    // Selection.
    let [ x1, x2, y1, y2 ] = Array(4).fill(null);

    function addEventListeners() {
        const commonAttributes = {
            draggable: true,
            name: 'selectable',
        };

        function addObj(obj, type) {
            layer.add(obj);
            objects.push(obj);

            const objectsList = document.getElementById('objects-list');
            const newElement = document.createElement('div');
            const objectIndex = objects.length - 1;
            const objName = `Object ${objects.length}: ${type}`

            obj.addName(objName.replaceAll(' ', '-'));
            newElement.textContent = objName;
            newElement.classList.add('object-element');

            const removeElement = document.createElement('span');
            newElement.appendChild(removeElement);
            removeElement.textContent = 'X';
            removeElement.addEventListener('click', e => {
                objectsList.removeChild(newElement);
                obj.destroy();
                objects.splice(objectIndex, 1);
            });
            objectsList.appendChild(newElement)
        }

        function addStep() {
            layer = steps[currentStep - 1].initialState.clone();
            const previousStepInstructions = steps[currentStep - 1].instructions;

            // TODO apply instructions from previous step to new layer, so we are at correct initial state.
            steps.push({ initialState: layer, instructions: [] });
            currentStep++;

            const stepElement = document.createElement('div');

            stepElement.classList.add('flex-col', 'step-obj');
            stepElement.innerHTML = `<h4>Step ${currentStep}</h4>`;
            document.getElementById('steps-list').appendChild(stepElement);

            selectStep(currentStep);
        }

        function selectStep(stepToSelect) {
            currentStep = stepToSelect;
            Array.from(document.getElementsByClassName('step-obj')).forEach((element, index) => {
                if ((stepToSelect - 1) !== index) {
                    element.classList.remove('selected');
                }
                else {
                    element.classList.add('selected');
                }
            });
        }

        // Play button
        document.getElementById('play-button').addEventListener('click', () => {
            const layerClone = steps[currentStep - 1].initialState.clone();
            stage.remove(layer);
            stage.add(layerClone);
            steps[currentStep - 1].instructions.forEach(({ parameters, target, type }) => {
                layer.find(target.replace('selectable ', '.'))[0].to({
                    ...parameters,
                    duration,
                });
            });
        });

        // Objects:
        // Add line.
        document.getElementById('add-line').addEventListener('click', () => {
            addObj(new Konva.Line({
                ...commonAttributes,
                points: [ ...Object.values(getRandomXAndY()), ...Object.values(getRandomXAndY()) ],
                stroke: getRandomColor(),
                strokeWidth: Math.random() * 8,
            }), 'Line');
        });

        // Add circle.
        document.getElementById('add-circle').addEventListener('click', () => {
            addObj(new Konva.Circle({
                ...commonAttributes,
                fill: 'red',
                radius: 70,
                stroke: 'black',
                strokeWidth: 4,
                ...getRandomXAndY()
            }), 'Circle');
        });

        // Add box.
        document.getElementById('add-box').addEventListener('click', () => {
            const height = 50;
            const width = 100;
            addObj(new Konva.Rect({
                ...commonAttributes,
                ...getRandomXAndY(),
                fill: 'blue',
                height,
                offset: {
                    x: width / 2,
                    y: height / 2,
                },
                stroke: 'black',
                strokeWidth: 1,
                width,
            }), 'Box');
        });

        // Add text.
        document.getElementById('add-text').addEventListener('click', () => {
            const textNode = new Konva.Text({
                fontSize: Math.random() * 10 + 20,
                padding: Math.random() * 20,
                text: 'Lorem ipsum',
                x: 0,
                y: 0,
            });
            const height = textNode.height();
            const width = textNode.width();

            const group = new Konva.Group({
                ...commonAttributes,
                ...getRandomXAndY(),
                height,
                width,
            });
            const container = new Konva.Rect({
                fill: 'lightblue',
                height,
                stroke: 'black',
                strokeWidth: 1,
                width,
                x: 0,
                y: 0,
            });

            textNode.on('dblclick', () => {
                const position = textNode.getAbsolutePosition();
                const stageBox = stage.container().getBoundingClientRect();
                const textarea = document.createElement('textarea');

                document.body.appendChild(textarea);
                textarea.value = textNode.text();
                textarea.style.position = 'absolute';
                textarea.style.top = `${position.y + stageBox.top}px`;
                textarea.style.left = `${position.x + stageBox.left}px`;
                textarea.style.width = textNode.width();
                textarea.focus();

                textarea.addEventListener('keydown', function (e) {
                    console.log(e.keyCode);
                    const metaPressed = e.shiftKey;
                    if ([ 13, 27 ].includes(e.keyCode) && !metaPressed) {
                        textNode.text(textarea.value);
                        container.to({
                            height: textNode.height(),
                            width: textNode.width(),
                            duration,
                        });
                        document.body.removeChild(textarea);
                    }
                });
            });

            group.add(container, textNode);
            addObj(group, 'Text');
        });

        // Add code.
        document.getElementById('add-code').addEventListener('click', () => {
            const shape = new Konva.Image({ ...commonAttributes, ...getRandomXAndY() });
            createCodeObject({ code: cppCode, konvaShape: shape, method: 'konva' });

            addObj(shape, 'Code');
        });

        // Add triangle.
        document.getElementById('add-triangle').addEventListener('click', () => {
            addObj(new Konva.RegularPolygon({
                ...commonAttributes,
                fill: getRandomColor(),
                radius: Math.random() * 100 + 10,
                sides: 3,
                stroke: 'black',
                ...getRandomXAndY(),
            }), 'Triangle');
        });

        document.getElementById('add-image').addEventListener('click', () => {
            const imgObj = new Image();

            imgObj.onload = () => {
                layer.add(new Konva.Image({ ...commonAttributes, ...getRandomXAndY(), height: 100, image: imgObj, width: 100 }));
            };
            imgObj.src = `../assets/${imgsList[Math.floor(Math.random() * imgsList.length)]}`;
            addObj(imgObj, 'Image');
        });

        // Add AND gate.
        document.getElementById('add-and').addEventListener('click', () => {
            addObj(new Konva.Path({
                ...commonAttributes,
                data: 'M44 44h-19v-26l19-0c7 0 13 6 13 13s-6 13-13 13z',
                stroke: getRandomColor(),
                scale: { x: 1, y: 1 },
                ...getRandomXAndY(),
            }), 'AND gate');
        });

        // Add OR gate.
        document.getElementById('add-or').addEventListener('click', () => {
            addObj(new Konva.Path({
                ...commonAttributes,
                data: 'M14 77.095v0.062c2.199 3.815 3.469 8.221 3.469 12.938 0 4.716-1.27 9.122-3.469 12.935v0.06h13.469c9.61 0 18-5.235 22.5-12.995-4.5-7.761-12.89-13-22.5-13h-13.469z',
                stroke: getRandomColor(),
                scale: { x: 1, y: 1 },
                ...getRandomXAndY(),
            }), 'OR gate');
        });

        // Konva selection: mousedown
        stage.on('mousedown', e => {
            if (e.target !== stage) {
                return;
            }

            e.evt.preventDefault();
            x1 = stage.getPointerPosition().x;
            y1 = stage.getPointerPosition().y;
            selectionRectangle.visible(true);
            selectionRectangle.width(0);
            selectionRectangle.height(0);
        });

        // Konva selection: mousemove
        stage.on('mousemove', e => {
            if (!selectionRectangle.visible()) {
                return;
            }
            e.evt.preventDefault();
            x2 = stage.getPointerPosition().x;
            y2 = stage.getPointerPosition().y;

            selectionRectangle.setAttrs({
                x: Math.min(x1, x2),
                y: Math.min(y1, y2),
                width: Math.abs(x2 - x1),
                height: Math.abs(y2 - y1),
            });
        });

        // Konva selection: mouseup
        stage.on('mouseup', e => {
            if (!selectionRectangle.visible()) {
                return;
            }
            e.evt.preventDefault();

            // update visibility in timeout, so we can check it in click event
            setTimeout(() => {
                selectionRectangle.visible(false);
            });

            const shapes = stage.find('.selectable').filter(shape => shape.visible());
            const box = selectionRectangle.getClientRect();

            transformer.nodes(shapes.filter((shape) =>
                Konva.Util.haveIntersection(box, shape.getClientRect())
            ));
            setupProperties();
        });

        // Konva selection: click
        stage.on('click', e => {
            if (selectionRectangle.visible()) {
                return;
            }

            if ((e.target === stage) || !e.target.hasName('selectable')) {
                transformer.nodes([]);
                return;
            }

            const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
            const isSelected = transformer.nodes().indexOf(e.target) >= 0;

            if (!metaPressed && !isSelected) {
                transformer.nodes([ e.target ]);
            }
            else if (metaPressed && isSelected) {
                const nodes = transformer.nodes().slice();

                nodes.splice(nodes.indexOf(e.target), 1);
                transformer.nodes(nodes);
            }
            else if (metaPressed && !isSelected) {
                const nodes = transformer.nodes().concat([ e.target ]);

                transformer.nodes(nodes);
            }
            setupProperties();
        });

        // INSTRUCTIONS:
        const duration = 0.33;
        let clonedNodes = null;
        let savedNodes = null;

        function addInstruction(type, inputs) {
            const instructionElement = document.createElement('div');

            const inputElements = inputs.map(({ label, type }) => {
                const labelEl = document.createElement('label');
                const inputEl = document.createElement('input');

                labelEl.textContent = label;
                inputEl.setAttribute('type', type);
                labelEl.appendChild(inputEl);

                return labelEl;
            });
            const saveButtonElement = document.createElement('button');
            saveButtonElement.textContent = 'Save';

            saveButtonElement.addEventListener('click', () => {
                savedNodes.forEach((savedNode, index) => {
                    const parameters = { x: clonedNodes[index].x(), y: clonedNodes[index].y() };
                    steps[currentStep - 1].instructions.push({
                        parameters,
                        target: savedNode.name(),
                    });

                    // savedNode.to({ ...parameters, duration: 0 });
                    savedNode.show();
                });
                clonedNodes.forEach(node => node.destroy());
            });

            instructionElement.classList.add('instr');
            instructionElement.append(`${steps[currentStep - 1].instructions.length + 1}. ${type}`, ...inputElements, saveButtonElement);
            document.getElementsByClassName('step-obj')[currentStep - 1].appendChild(instructionElement);
        }

        function cloneHideAndSave(nodes) {
            Array.from(document.getElementsByClassName('instr-button')).forEach(el => el.disabled = true);
            savedNodes = nodes;

            return nodes.map(node => {
                const clone = node.clone();
                node.hide();
                return clone;
            });
        }
        // Move:
        document.getElementById('move-instr').addEventListener('click', () => {
            addInstruction('Move', [ { label: 'x', type: 'number' }, { label: 'y', type: 'number' } ]);
            clonedNodes = cloneHideAndSave(transformer.nodes());

            layer.add(...clonedNodes)
            transformer.nodes(clonedNodes);
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

        // STEPS:
        // Add step:
        document.getElementById('add-step').addEventListener('click', () => {
            addStep();
        });

        // Properties;
        function setInputValue(id, value) {
            document.getElementById(id).value = value;
        }

        function setDisableElement(id, newDisabled) {
            document.getElementById(id).disabled = newDisabled;
        }

        function setupProperties() {
            const [ firstObj ] = transformer.nodes();
            const properties = [ 'cornerRadius', 'fill', 'opacity', 'rotation', 'stroke', 'width', 'height', 'x', 'y' ];

            properties.forEach(prop => {
                const id = `${prop}-prop`;
                try {
                    if (firstObj[prop]()) {
                        const propertiesToRound = [ 'cornerRadius', 'rotation', 'x', 'y' ];
                        const newValue = propertiesToRound.includes(prop) ? Math.round(firstObj[prop]()) : firstObj[prop]();

                        setInputValue(id, newValue);
                        setDisableElement(id, false);
                    }
                    else {
                        setInputValue(id, '');
                    }
                }
                catch (e) {
                    console.log(`Property ${prop} does not exist`);
                    setDisableElement(id, true);
                }
            });

            if (firstObj instanceof Konva.Text) {
                document.getElementById('text-properties').style.visibility = 'visible';
                const textProperties = [ 'align', 'fill', 'fontFamily', 'fontSize', 'fontStyle' ];

                textProperties.forEach(prop => {
                    const id = `text-${prop}-prop`;
                    try {
                        if (firstObj[prop]() !== undefined) {
                            const newValue = prop === 'fontSize' ? Math.round(firstObj[prop]()) : firstObj[prop]();

                            setInputValue(id, newValue);
                            setDisableElement(id, false);
                        }
                        else {
                            setInputValue(id, '');
                        }
                    }
                    catch (e) {
                        console.log(`Property ${prop} does not exist`);
                        setInputValue(id, '');
                        setDisableElement(id, true);
                    }
                });
            }
            else {
                document.getElementById('text-properties').style.visibility = 'hidden';
            }
        }

        Array.from(document.getElementsByClassName('prop-input')).forEach(element => {
            element.addEventListener('change', () => {
                if (transformer.nodes().length) {
                    const { id, value } = element;
                    const prop = id.replace('text-', '').replace('-prop', '');

                    transformer.nodes().forEach(node => {
                        if ([ 'align', 'fontFamily', 'fontStyle' ].includes(prop)) {
                            node[prop](value);
                        }
                        else {
                            node.to({
                                [prop]: value,
                                duration,
                            });
                        }
                    });
                }
            });
        });
    }

    addEventListeners();
})();
