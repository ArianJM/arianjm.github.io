let currentStep = 0;
let currentInstruction = 0;
let stop = true;
const initialObjectsState = [];
const objects = [];
const stage = new Konva.Stage({ container: 'konva', width: 600, height: 400 });
let layer = new Konva.Layer();
const transformer = new Konva.Transformer();
const selectionRectangle = new Konva.Rect({ fill: 'rgba(0, 0, 170, 0.4)', stroke: 'rgba(0, 0, 170, 0.8)', visible: false });
let playerLayer = null;
const animationInstructions = [ new Step({ caption: 'Animation end' }) ];
let numberOfSteps = 0;
const playButton = document.getElementById('play-button');

(function() {
    setDisabledArrayOfElements(getInstructionButtons(), true);
    stage.add(layer);
    layer.add(transformer);
    layer.add(selectionRectangle);
    renderSteps();

    function addEventListeners() {
        addObjectsEventListeners();
        addInstructionsEventListeners();
        addStepsEventListeners();

        // Play button
        document.getElementById('play-button').addEventListener('click', () => {
            if (playButton.textContent === 'Play') {
                stop = false;
                playButton.textContent = 'Stop';
                playStep(currentStep, currentInstruction);
            }
            else {
                stop = true;
            }
        });
    }

    addEventListeners();
})();
