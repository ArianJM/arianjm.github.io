const vcd = pyComplexVcdJson;
const signalNames = Object.values(vcd.signals).map(({ nets: [ { hier, name } ] }) => {
    const module = hier.replace(/testbench\.?/, '').replaceAll('.', '/');
    return module ? `${module}/${name}` : name;
});

const plotElement = document.getElementById('plot');
const { minChange, unit, scale } = updateTimescale(vcd);
vcd.timescale = `1${scale}`;

const initialZoomFactor = vcd.endtime / 500;
const redLine = { line: { color: 'red', width: 1.5 } };
const initialRange = [ 0, vcd.endtime ];
const grey = {
    light: '#939292',
    dark: '#252424',
};
let dragmode = 'zoom';
let zoomFactor = initialZoomFactor;

signalNames.forEach(name => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input')

    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.addEventListener('change', () => {
        const stuff = plot(vcd, zoomFactor, { minChange, range: initialRange.slice(), scale });

        Plotly.react(plotElement, stuff.data, { ...stuff.layout, dragmode });
    });
    label.appendChild(checkbox);
    label.append(name);
    document.getElementById('signal-selection').appendChild(label);
});

// Plot setup.
let { data, layout } = plot(vcd, initialZoomFactor, { minChange, range: initialRange.slice(), scale });

Plotly.newPlot(plotElement, data, layout, { displaylogo: false, modeBarButtonsToRemove: [ 'select2d', 'lasso2d' ] });
plotElement.on('plotly_relayout', eventData => {
    if (eventData.hasOwnProperty('dragmode')) {
        dragmode = eventData.dragmode;
        return;
    }

    let range = initialRange.slice();

    if (eventData.hasOwnProperty('xaxis.range[0]')) {
        range = [ eventData['xaxis.range[0]'], eventData['xaxis.range[1]'] ];
        zoomFactor = (range[1] - range[0]) / 500;
    }
    const stuff = plot(vcd, zoomFactor, { range });

    Plotly.react(plotElement, stuff.data, { ...stuff.layout, dragmode }, );
});

plotElement.on('plotly_click', ev => {
    const xAxis = plotElement._fullLayout.xaxis;
    const marginLeft = plotElement._fullLayout.margin.l;
    const cursorLineX = xAxis.p2c(ev.event.layerX - marginLeft);
    const stuff = plot(vcd, zoomFactor, { cursorLine: cursorLineX });

    Plotly.react(plotElement, stuff.data, { ...stuff.layout, dragmode }, );
});

function updateTimescale({ signals, timescale }) {
    const timescaleRegex = /(\d+)\s*(\w+)/;
    const [ match, unitStr, scale ] = timescaleRegex.exec(timescale);
    const unit = parseInt(unitStr, 10);

    if (unit > 1) {
        Object.values(signals).forEach(signal => {
            for (let i = 0; i < signal.tv.length; i++) {
                signal.tv[i][0] *= unit;
            }
        });
    }

    const scales = [ 's', 'ms', 'us', 'ns', 'ps', 'fs' ];
    const scaleIndex = scales.indexOf(scale);
    let scaleJump = 0;
    let minChange = getMinChange(signals);

    while (((minChange % 1000) === 0) && (scaleJump < scaleIndex)) {
        divideSignalValues(signals, 1000);
        vcd.endtime /= 1000;
        minChange = getMinChange(signals);
        scaleJump++;
    }

    return { minChange, scale: scales[scaleIndex - scaleJump] };
}

function getMinChange(signals) {
    return Math.min(...Object.values(signals).map(({ tv }) => {
        return Math.min(...tv.map((curr, index) => {
            return index ? (curr[0] - tv[index - 1][0]) : 0;
        }).filter(num => num > 0));
    }));
}

function divideSignalValues(signals, divisor) {
    Object.values(signals).forEach(({ tv }) => {
        tv.forEach(val => {
            val[0] /= divisor;
        });
    });
}

function plot({ endtime, signals }, zoomFactor, { cursorLine, minChange, range }) {
    const labels = Array.from(document.getElementsByTagName('label'));
    const numShownSignals = labels.filter(label => label.getElementsByTagName('input')[0].checked).length;
    const fractionOfPlot = 1 / numShownSignals;
    const layout = {
        height: Math.max(numShownSignals * 50, 250),
        hoverdistance: -1,
        hoverinfo: 'none',
        hovermode: 'closest',
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
            spikemode: 'across',
            spikesnap: 'cursor',
            spikethickness: 1,
            ticksuffix: ` ${scale}`,
            title: { text: `Time` },
        },
    };
    const annotationTexts = [];
    const allShapes = [];
    let yAxisNumber = 0;

    const data = Object.values(signals).reverse().flatMap(({ nets: [ { hier, name, size, type } ], tv }, index) => {
        const module = hier.replace(/testbench\.?/, '').replaceAll('.', '/');

        let currentValue = tv[0][1];

        if (!isNaN(cursorLine)) {
            const currentValueIndex = tv.findIndex(([ time ]) => time > cursorLine);

            if (currentValueIndex === -1) {
                currentValue = tv[tv.length - 1][1];
            }
            else if (currentValueIndex === 0) {
                currentValue = tv[currentValueIndex][1];
            }
            else {
                currentValue = tv[currentValueIndex - 1][1];
            }
        }

        const graphName = module ? `${module}/${name}` : name;
        const label = labels.find(label => label.textContent === graphName);

        if (label && !label.getElementsByTagName('input')[0].checked) {
            return null;
        }
        const numLeadingZeroes = size - currentValue.length;
        const leadingZeroes = isNaN(currentValue) ? '' : '0'.repeat(numLeadingZeroes);
        const annotation = `${graphName}<br> ${leadingZeroes}${currentValue}`;

        annotationTexts.push(annotation);

        const sizeInt = parseInt(size, 10);

        yAxisNumber++;
        layout[`yaxis${yAxisNumber}`] = makeYAxisLayout({ fractionOfPlot, index: yAxisNumber - 1 });

        if (parseInt(size, 10) === 1) {
            const binarySignal = makeBinarySignal({ endtime, fractionOfPlot, yAxisNumber, name: graphName, scale, tv });

            allShapes.push(...binarySignal.shapes);

            return binarySignal.data;
        }

        const vectorSignal = makeVectorSignal({ endtime, fractionOfPlot, yAxisNumber, name: graphName, scale, size, tv, zoomFactor });

        allShapes.push(...vectorSignal.shapes);

        return vectorSignal.data;
    }).filter(data => data !== null);

    layout.annotations = annotationTexts.map((text, index) => ({
        align: 'right',
        showarrow: false,
        text,
        x: 0,
        xanchor: 'right',
        xref: 'paper',
        y: index * fractionOfPlot + (fractionOfPlot / 2),
        yanchor: 'middle',
        yref: 'paper',
    }));

    if (cursorLine) {
        allShapes.push({
            line: {
                color: 'orange',
                width: 1,
            },
            type: 'line',
            x0: cursorLine,
            x1: cursorLine,
            y0: 0,
            y1: 1,
            yref: 'paper',
        });
    }
    layout.shapes = allShapes;

    return { data, layout };
}

function makeVectorSignal({ endtime, fractionOfPlot, name, size, tv, yAxisNumber, zoomFactor }) {
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

    shapes.push({ line: { color: grey.light, width: 1.5 }, path: vectorShapes.join(' '), type: 'path', yref: yaxis });

    const hovertemplate = `${name} @ %{x:.0f} ${scale}<br>%{text}`;

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

function makeBinarySignal({ endtime, name, tv, yAxisNumber }) {
    const shapes = [];
    const [ text, textposition ] = [ [], [] ];
    const [ x, y ] = [ [], [] ];
    const [ undefinedX, undefinedY ] = [ [], [] ];
    let previousYStr = null;
    const yaxis = `y${yAxisNumber}`;
    const greyLine = { line: { color: grey.dark, width: 1.5 }, type: 'line' };

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
                    shapes.push({ ...greyLine, path: `M ${xInt},0.5 V ${yStr}`, type: 'path', yref: yaxis })
                }
                // Previous state was not undefined. Continue green line.
                else {
                    shapes[shapes.length - 1].path += ` H ${xInt} V ${yInt}`;
                }
            }
            else {
                shapes.push({ ...greyLine, path: `M ${xInt},${yInt}`, type: 'path', yref: yaxis });
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

    const hovertemplate = `${name} @ %{x:.0f} ${scale}<br>%{text}`;

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
