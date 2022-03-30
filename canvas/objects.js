const cppCode = '#include <iostream>\nusing namespace std;\n\nint main() {\n   int wage;\n\n   wage = 20;\n\n   cout << "Salary is ";\n   cout << wage * 40 * 52;\n   cout << endl;\n\n   return 0;\n}';
const pngs = [ 'alex-edgcomb', 'bailey-miller', 'colin-frerichs', 'curtis-hohl', 'erin-cardenas', 'hari-gangadharan', 'keith-zmudzinski', 'kenny-chen', 'ryan-renno', 'sarah-strawn' ].map(name => `${name}.png`);
const imgsList = pngs.concat([ 'archana-prasad', 'arian-jimenez', 'christopher_turner', 'ethan-valdez', 'kaden-johnsen', 'lester-delacruz', 'lyssa-vanderbeek', 'matthew-donnelly', 'maya-varghese' ].map(name => `${name}.jpg`));
let nextObjId = 0;
const properties = [ 'cornerRadius', 'fill', 'opacity', 'rotation', 'stroke', 'width', 'height', 'x', 'y' ];

function createCodeObject({ code, konvaShape = null, method, x = 0, y = 0 }) {
    const preEl = document.body.appendChild(document.createElement('pre'));
    const codeEl = preEl.appendChild(document.createElement('code'));

    codeEl.textContent = code;

    hljs.highlightElement(preEl);

    html2canvas(preEl).then(canvas => {
        konvaShape.image(canvas)
    });
}

function addObj(obj, type) {
    layer.add(obj);
    const initialProperties = properties.reduce((acc, prop) => {
        const propertiesToRound = [ 'cornerRadius', 'height', 'rotation', 'width', 'x', 'y' ];
        const newValue = propertiesToRound.includes(prop) ? Math.round(obj[prop]()) : obj[prop]();

        acc[prop] = newValue;
        return acc;
    }, {});

    objects.push({
        initialProperties,
        obj,
    });
    obj.id(String(nextObjId));
    nextObjId++;

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

function setupProperties() {
    const [ firstObj ] = transformer.nodes();

    properties.forEach(prop => {
        const id = `${prop}-prop`;
        try {
            if (firstObj[prop]()) {
                const propertiesToRound = [ 'cornerRadius', 'rotation', 'x', 'y' ];
                const newValue = propertiesToRound.includes(prop) ? Math.round(firstObj[prop]()) : firstObj[prop]();

                setInputValue(id, newValue);
                setDisableElementId(id, false);
            }
            else {
                setInputValue(id, '');
            }
        }
        catch (e) {
            setDisableElementId(id, true);
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
                    setDisableElementId(id, false);
                }
                else {
                    setInputValue(id, '');
                }
            }
            catch (e) {
                console.log(`Property ${prop} does not exist`);
                setInputValue(id, '');
                setDisableElementId(id, true);
            }
        });
    }
    else {
        document.getElementById('text-properties').style.visibility = 'hidden';
    }
}

function addObjectsEventListeners() {
    const commonAttributes = {
        draggable: true,
        name: 'selectable',
    };

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
            name: 'selectable',
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

    // Add image
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

    // SELECTION OF OBJECTS:
    let [ x1, y1 ] = [ null, null ];

    // mousedown
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

    function updateDisabledInstructionButtons() {
        setDisabledArrayOfElements(getInstructionButtons(), !(transformer.nodes().length && (currentStep < getNumberOfSteps() - 1)));
    }

    // mousemove
    stage.on('mousemove', e => {
        if (!selectionRectangle.visible()) {
            return;
        }
        updateDisabledInstructionButtons();
        // setDisabledArrayOfElements(getInstructionButtons(), true);
        e.evt.preventDefault();
        const x2 = stage.getPointerPosition().x;
        const y2 = stage.getPointerPosition().y;

        selectionRectangle.setAttrs({
            x: Math.min(x1, x2),
            y: Math.min(y1, y2),
            width: Math.abs(x2 - x1),
            height: Math.abs(y2 - y1),
        });
    });

    // mouseup
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

        updateDisabledInstructionButtons();
        // if (transformer.nodes().length) {
        //     setDisabledArrayOfElements(getInstructionButtons(), currentStep === getNumberOfSteps() - 1);
        // }
        setupProperties();
    });

    // click
    stage.on('click', e => {
        updateDisabledInstructionButtons();
        // if (!transformer.nodes().length) {
        //     setDisabledArrayOfElements(getInstructionButtons(), true);
        // }

        if (selectionRectangle.visible()) {
            return;
        }

        if ((e.target === stage) || !e.target.hasName('selectable')) {
            transformer.nodes([]);
            updateDisabledInstructionButtons();
            // setDisabledArrayOfElements(getInstructionButtons(), true);
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

        updateDisabledInstructionButtons();
        // if (transformer.nodes().length) {
            // setDisabledArrayOfElements(getInstructionButtons(), currentStep === getNumberOfSteps() - 1);
        // }
        setupProperties();
    });

    // Property changes:
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
