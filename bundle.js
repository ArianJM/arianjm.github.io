(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const redLine = { line: { color: 'red', width: 1 } };

const initialScale = pyComplexVcdJson.endtime / 1000;
const initialRange = [ 0, pyComplexVcdJson.endtime ];

let { data, layout } = plot(pyComplexVcdJson, initialScale, { range: initialRange });

const plotElement = document.getElementById('plot');

Plotly.newPlot(plotElement, data, layout);
plotElement.on('plotly_relayout', eventData => {
    const range = eventData.hasOwnProperty('xaxis.range[0]') ? [ eventData['xaxis.range[0]'], eventData['xaxis.range[1]'] ] : initialRange;
    const scale = (range[1] - range[0]) / 1000;
    const stuff = plot(pyComplexVcdJson, isNaN(scale) ? initialScale : scale, { range });

    Plotly.react(plotElement, stuff.data, stuff.layout);
});

function plot({ endtime, signals, timescale }, zoomFactor, { range }) {
    const numSignals = Object.keys(signals).length;
    const layout = {
        height: numSignals * 50,
        hovermode: 'closest',
        hoverinfo: 'none',
        margin: { t: 50, b: 5, l: 200 },
        showlegend: false,
        xaxis: {
            automargin: true,
            rangemode: 'nonnegative',
            range,
            showgrid: false,
            showline: false,
            showspikes: true,
            spikecolor: 'orange',
            spikedash: 'solid',
            spikemode: 'across',
            spikesnap: 'cursor',
            spikethickness: 1,
            title: { text: `Time (${timescale})` },
        },
    };
    const fractionOfPlot = 1 / numSignals;
    const annotationTexts = [];
    const allShapes = [];

    const data = Object.values(signals).flatMap(({ nets: [ { hier, name, size, type } ], tv }, index) => {
        const module = hier.replace(/testbench\.?/, '').replaceAll('.', '/');
        const graphName = module ? `${module}/${name}` : name;
        annotationTexts.push(graphName);

        const sizeInt = parseInt(size, 10);
        const yAxisNumber = index + 1;

        layout[`yaxis${yAxisNumber}`] = makeYAxisLayout({ fractionOfPlot, index });

        if (parseInt(size, 10) === 1) {
            const binarySignal = makeBinarySignal({ endtime, fractionOfPlot, index, name: graphName, timescale, tv });

            allShapes.push(...binarySignal.shapes);

            return binarySignal.data;
        }

        const vectorSignal = makeVectorSignal({ endtime, fractionOfPlot, index, name: graphName, size, timescale, tv, zoomFactor });

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

function makeVectorSignal({ endtime, fractionOfPlot, index, name, size, timescale, tv, zoomFactor }) {
    const shapes = [];
    const vectorShapes = [];
    const [ text, textposition ] = [ [], [] ];
    const [ x, y ] = [ [], [] ];
    let previousYStr = null;
    const yaxis = `y${index + 1}`;

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

function makeBinarySignal({ endtime, index, name, timescale, tv }) {
    const shapes = [];
    const [ text, textposition ] = [ [], [] ];
    const [ x, y ] = [ [], [] ];
    const [ undefinedX, undefinedY ] = [ [], [] ];
    let previousYStr = null;
    const yaxis = `y${index + 1}`;
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

},{}]},{},[1]);
