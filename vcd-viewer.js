
const signalNames = Object.values(pyComplexVcdJson.signals).map(({ nets: [ { hier, name } ] }) => {
    const module = hier.replace(/testbench\.?/, '').replaceAll('.', '/');
    return module ? `${module}/${name}` : name;
});

const plotElement = document.getElementById('plot');
const initialScale = pyComplexVcdJson.endtime / 500;
const redLine = { line: { color: 'red', width: 1 } };
const initialRange = [ 0, pyComplexVcdJson.endtime ];

signalNames.forEach(name => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input')

    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.addEventListener('change', () => {
        const stuff = plot(pyComplexVcdJson, initialScale, { range: initialRange });

        Plotly.react(plotElement, stuff.data, stuff.layout);
    });
    label.appendChild(checkbox);
    label.append(name);
    document.getElementById('signal-selection').appendChild(label);
});

// Plot setup.
let { data, layout } = plot(pyComplexVcdJson, initialScale, { range: initialRange });

Plotly.newPlot(plotElement, data, layout, { modeBarButtonsToRemove: [ 'select2d', 'lasso2d',  ] });
plotElement.on('plotly_relayout', eventData => {
    const range = eventData.hasOwnProperty('xaxis.range[0]') ? [ eventData['xaxis.range[0]'], eventData['xaxis.range[1]'] ] : initialRange;
    const scale = (range[1] - range[0]) / 500;
    const stuff = plot(pyComplexVcdJson, isNaN(scale) ? initialScale : scale, { range });

    Plotly.react(plotElement, stuff.data, stuff.layout);
});

function plot({ endtime, signals, timescale }, zoomFactor, { range }) {
    const labels = Array.from(document.getElementsByTagName('label'));
    const numShownSignals = labels.filter(label => label.getElementsByTagName('input')[0].checked).length;
    const fractionOfPlot = 1 / numShownSignals;
    const layout = {
        height: numShownSignals * 50,
        hovermode: 'closest',
        hoverinfo: 'none',
        margin: { t: 50, b: 5, l: 200 },
        showlegend: false,
        xaxis: {
            automargin: true,
            exponentformat: 'none',
            rangemode: 'nonnegative',
            range,
            showgrid: false,
            showline: false,
            showspikes: true,
            showticksuffix: 'all',
            spikecolor: 'orange',
            spikedash: 'solid',
            spikemode: 'across',
            spikesnap: 'cursor',
            spikethickness: 1,
            ticksuffix: ` ${timescale.substr(1)}`,
            title: { text: `Time (${timescale})` },
        },
    };
    const annotationTexts = [];
    const allShapes = [];
    let yAxisNumber = 0;

    const data = Object.values(signals).flatMap(({ nets: [ { hier, name, size, type } ], tv }, index) => {
        const module = hier.replace(/testbench\.?/, '').replaceAll('.', '/');
        const graphName = module ? `${module}/${name}` : name;
        const label = labels.find(label => label.textContent === graphName);

        if (label && !label.getElementsByTagName('input')[0].checked) {
            debugger;
            return null;
        }
        annotationTexts.push(graphName);

        const sizeInt = parseInt(size, 10);

        yAxisNumber++;
        layout[`yaxis${yAxisNumber}`] = makeYAxisLayout({ fractionOfPlot, index: yAxisNumber - 1 });

        if (parseInt(size, 10) === 1) {
            const binarySignal = makeBinarySignal({ endtime, fractionOfPlot, yAxisNumber, name: graphName, timescale, tv });

            allShapes.push(...binarySignal.shapes);

            return binarySignal.data;
        }

        const vectorSignal = makeVectorSignal({ endtime, fractionOfPlot, yAxisNumber, name: graphName, size, timescale, tv, zoomFactor });

        allShapes.push(...vectorSignal.shapes);

        return vectorSignal.data;
    }).filter(data => data !== null);

    layout.annotations = annotationTexts.map((text, index) => ({
        x: 0,
        xanchor: 'right',
        xref: 'paper',
        y: index * fractionOfPlot + (fractionOfPlot / 2),
        yanchor: 'middle',
        yref: 'paper',
        showarrow: false,
        text,
    }));
    layout.shapes = allShapes;

    return { data, layout };
}

function makeVectorSignal({ endtime, fractionOfPlot, name, size, timescale, tv, yAxisNumber, zoomFactor }) {
    const shapes = [];
    const vectorShapes = [];
    const [ text, textposition ] = [ [], [] ];
    const [ x, y ] = [ [], [] ];
    let previousYStr = null;
    const yaxis = `y${yAxisNumber}`;

    let lastXInt = null;
    let shapeMiddle = null;
    let openShape = null;
    let closeShape = null;

    tv.forEach(([ xInt, yStr ], signalChangeIndex) => {
        shapeMiddle = `L${xInt},0.5`;
        openShape = `M${xInt + zoomFactor},0 ${shapeMiddle} L${xInt + zoomFactor},1`
        closeShape = ` H${xInt - zoomFactor} ${shapeMiddle} L${xInt - zoomFactor},0 Z`;

        // Current state is undefined.
        if (isNaN(yStr)) {
            if (signalChangeIndex) {
                // Previous state was undefined. Finish previous line.
                if (isNaN(previousYStr)) {
                    shapes[shapes.length - 1].x1 = xInt;
                }
                // Previous state wasn't undefined. Close previous shape.
                else {
                    vectorShapes[vectorShapes.length - 1] += closeShape;
                }
            }

            shapes.push({ ...redLine, x0: xInt, y0: 0.5, y1: 0.5, yref: yaxis });
        }
        // Current state is not undefined.
        else {
            if (signalChangeIndex) {
                // Previous state was undefined
                if (isNaN(previousYStr)) {
                    shapes[shapes.length - 1].x1 = xInt;
                }
                // Previous state wasn't undefined. Close previous shape.
                else {
                    vectorShapes[vectorShapes.length - 1] += closeShape;
                }
            }

            vectorShapes.push(openShape);
        }

        x.push(xInt);
        y.push(0.5);

        const numLeadingZeroes = size - yStr.length;
        const leadingZeroes = isNaN(yStr) ? '' : '0'.repeat(numLeadingZeroes);

        text.push(`  ${leadingZeroes}${isNaN(yStr) ? '' : yStr}`);
        textposition.push('right center');

        lastXInt = xInt;
        previousYStr = yStr;
    });

    // Stretch final result to the end of time.
    if (isNaN(previousYStr)) {
        shapes[shapes.length - 1].x1 += lastXInt;
    }
    else {
        vectorShapes[vectorShapes.length - 1] += ` H${endtime - zoomFactor} L${endtime},0.5 L${endtime - zoomFactor},0 Z`;
    }

    shapes.push({ line: { color: 'lightgreen', width: 1 }, path: vectorShapes.join(' '), type: 'path', yref: yaxis });

    const hovertemplate = `${name} @ %{x:.0f} ${timescale.substr(1)}<br>%{text}`;

    return {
        data: {
            hovertemplate,
            mode: 'text',
            name,
            text,
            textfont: { color: 'black' },
            textposition,
            type: 'scattergl',
            x,
            y,
            yaxis,
        },
        shapes,
    };
}

function makeBinarySignal({ endtime, name, timescale, tv, yAxisNumber }) {
    const shapes = [];
    const [ text, textposition ] = [ [], [] ];
    const [ x, y ] = [ [], [] ];
    const [ undefinedX, undefinedY ] = [ [], [] ];
    let previousYStr = null;
    const yaxis = `y${yAxisNumber}`;
    const greenLine = { line: { color: 'green', width: 1 }, type: 'line' };

    tv.forEach(([ xInt, yStr ], signalChangeIndex) => {
        const yInt = parseInt(yStr, 2)
        const previousYInt = parseInt(previousYStr, 2);

        // Current state is undefined
        if (isNaN(yStr)) {
            if (signalChangeIndex) {
                // Previous state was undefined. Finish previous undefined line.
                if (isNaN(previousYStr)) {
                    shapes[shapes.length - 1].path += ` H ${xInt}`;
                }
                // Previous state was not undefined. Make a red line to the center of y-axis.
                else {
                    shapes.push({ ...redLine, path: `M ${xInt},${previousYStr} V 0.5`, type: 'path', yref: yaxis });
                }
            }
            else {
                shapes.push({ ...redLine, path: `M ${xInt},0.5`, type: 'path', yref: yaxis });
            }
        }
        // Current state is not undefined.
        else {
            if (signalChangeIndex) {
                // Previous state was undefined. Make green line.
                if (isNaN(previousYStr)) {
                    shapes[shapes.length - 1].path += ` H ${xInt}`;
                    shapes.push({ ...greenLine, path: `M ${xInt},0.5 V ${yStr}`, type: 'path', yref: yaxis })
                }
                // Previous state was not undefined. Continue green line.
                else {
                    shapes[shapes.length - 1].path += ` H ${xInt} V ${yInt}`;
                }
            }
            else {
                shapes.push({ ...greenLine, path: `M ${xInt},${yInt}`, type: 'path', yref: yaxis });
            }
        }

        x.push(xInt);
        y.push(0.5);

        text.push(yStr);
        textposition.push('right center');

        lastXInt = xInt;
        previousYStr = yStr;
    });

    shapes[shapes.length - 1].path += `H ${endtime}`;
    // Stretch final result to the end of time.
    x.push(endtime);
    y.push(0.5);
    text.push(previousYStr);

    const hovertemplate = `${name} @ %{x:.0f} ${timescale.substr(1)}<br>%{text}`;

    return {
        data: {
            hovertemplate,
            mode: 'none',
            name,
            text,
            textfont: { color: 'black' },
            textposition,
            type: 'scattergl',
            x,
            y,
            yaxis,
        },
        shapes,
    };
}

function makeYAxisLayout({ fractionOfPlot, index }) {
    return {
        domain: [ index * fractionOfPlot, fractionOfPlot + (index * fractionOfPlot) ],
        fixedrange: true,
        range: [ -0.3, 1.3 ],
        showgrid: false,
        showticklabels: false,
        zeroline: index === 0,
    };
}
