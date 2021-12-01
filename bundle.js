(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const redLine = { line: { color: 'red', width: 1 } };

plot(pyComplexVcdJson);

function plot({ endtime, signals, timescale }) {
    const numSignals = Object.keys(signals).length;
    const layout = {
        height: numSignals * 50,
        hovermode: 'closest',
        hoverinfo: 'none',
        margin: { t: 50, b: 5, l: 200 },
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        showlegend: false,
        xaxis: {
            automargin: true,
            rangemode: 'nonnegative',
            showgrid: false,
            showline: false,
            showspikes: true,
            spikecolor: 'yellow',
            spikedash: 'solid',
            spikemode: 'across',
            spikesnap: 'cursor',
            spikethickness: 2,
            tickfont: { color: 'black' },
            title: { text: `Time (${timescale})` },
        },
    };
    const fractionOfPlot = 1 / numSignals;
    const annotationTexts = [];
    const allShapes = [];

    const data = Object.values(signals).flatMap(({ nets: [ { hier, name, size, type } ], tv }, index) => {
        const module = hier.replace('testbench', '');
        const graphName = `${module.startsWith('.') ? module.substr(1) : module} ${name}`.replace('testbench', '');
        annotationTexts.push(graphName);

        const sizeInt = parseInt(size, 10);
        const yAxisNumber = index + 1;

        layout[`yaxis${yAxisNumber}`] = makeYAxisLayout({ fractionOfPlot, index });

        if (parseInt(size, 10) === 1) {
            const binarySignal = makeBinarySignal({ endtime, fractionOfPlot, index, name: graphName, timescale, tv });

            allShapes.push(...binarySignal.shapes);

            return binarySignal.data;
        }

        const vectorSignal = makeVectorSignal({ endtime, fractionOfPlot, index, name: graphName, size, timescale, tv });

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

    Plotly.newPlot(document.getElementById('plot'), data, layout);
}

function makeVectorSignal({ endtime, fractionOfPlot, index, name, size, timescale, tv }) {
    const shapes = [];
    const [ text, textposition ] = [ [], [] ];
    const [ x, y ] = [ [], [] ];
    let previousYStr = null;
    const zoomFactor = (endtime - 0) / 100000;
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
                    shapes[shapes.length - 1].path += closeShape;
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
                    shapes[shapes.length - 1].path += closeShape;
                }
            }

            shapes.push({ line: { color: 'lightgreen', width: 1 }, path: openShape, type: 'path', yref: yaxis });
        }

        x.push(xInt);
        y.push(0.5);

        const numLeadingZeroes = size - yStr.length;
        const leadingZeroes = isNaN(yStr) ? '' : '0'.repeat(numLeadingZeroes);

        text.push(`${leadingZeroes}${isNaN(yStr) ? '' : yStr}`);
        textposition.push('right center');

        lastXInt = xInt;
        previousYStr = yStr;
    });

    // Stretch final result to the end of time.
    if (isNaN(previousYStr)) {
        shapes[shapes.length - 1].x1 += lastXInt;
    }
    else {
        shapes[shapes.length - 1].path += ` H${endtime - zoomFactor} L${endtime},0.5 L${endtime - zoomFactor},0 Z`;
    }

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
        zeroline: false,
    };
}

},{}]},{},[1]);
