(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const whiteFont = { font: { color: 'black' } };
plot(pyComplexVcdJson);

function plot({ endtime, signals, timescale }) {
    const numSignals = Object.keys(signals).length;
    const layout = {
        height: numSignals * 50,
        hovermode: 'closest',
        hoverinfo: 'none',
        margin: { t: 50, b: 5, l: 120 },
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        showlegend: false,
        // spikedistance: -1,
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
            title: { ...whiteFont, text: `Time (${timescale})` },
        },
    };
    const fractionOfPlot = 1 / numSignals;
    const annotationTexts = [];

    const data = Object.values(signals).flatMap(({ nets: [ { name, size, type } ], tv }, index) => {
        const graphName = `${type} ${name}`;
        annotationTexts.push(graphName);

        const sizeInt = parseInt(size, 10);
        const yAxisNumber = index + 1;

        layout[`yaxis${yAxisNumber}`] = makeYAxisLayout({ fractionOfPlot, index });

        if (parseInt(size, 10) === 1) {
            return makeBinarySignal({ endtime, fractionOfPlot, index, name: `${type} ${name}`, tv });
        }

        return makeVectorSignal({ endtime, fractionOfPlot, index, name: `${type} ${name}`, size, tv });
    });

    layout.annotations = annotationTexts.map((text, index) => ({
        ...whiteFont,
        x: 0,
        xanchor: 'right',
        xref: 'paper',
        y: index * fractionOfPlot + (fractionOfPlot / 2),
        yanchor: 'middle',
        yref: 'paper',
        showarrow: false,
        text,
    }));

    debugger;
    Plotly.newPlot(document.getElementById('plot'), data, layout);
}

function makeVectorSignal({ endtime, fractionOfPlot, index, name, size, tv }) {
    const annotations = [];
    const [ text, textposition ] = [ [], [] ];
    const [ x1, y1, x2, y2 ] = [ [], [], [], [] ];
    const [ undefinedX, undefinedY ] = [ [], [] ];
    let previousYStr = tv[0][1];
    let y1Up = true;

    tv.forEach(([ xInt, yStr ], signalChangeIndex) => {
        // If current state is undefined.
        if (isNaN(yStr)) {
            // If previous state wasn't undefined.
            if (!isNaN(previousYStr) && (signalChangeIndex > 0)) {
                const previousYInt = parseInt(previousYStr, 10);

                x1.push(xInt);
                x2.push(xInt);
                y1.push(y1[y1.length - 1]);
                y2.push(y2[y2.length - 1]);
                text.push('');
                textposition.push('center center');
                undefinedX.push(null, xInt);
                undefinedY.push(null, previousYInt);
            }
            undefinedX.push(xInt);
            undefinedY.push(0.5);
        }
        // If current state is not undefined.
        else {
            if (signalChangeIndex > 0) {
                // If previous state was undefined.
                if (isNaN(previousYStr)) {
                    x1.push(null, xInt);
                    x2.push(null, xInt);
                    y1.push(null, 0.5);
                    y2.push(null, 0.5);
                    undefinedX.push(xInt);
                    undefinedY.push(0.5);
                    text.push('', '');
                    textposition.push('center center', 'center center');
                }
                else {
                    x1.push(xInt);
                    x2.push(xInt);
                    y1.push(y1Up ? 0 : 1);
                    y2.push(y1Up ? 1 : 0);
                    text.push('');
                    textposition.push('center center');
                }
            }

            x1.push(xInt, xInt);
            x2.push(xInt, xInt);
            y1.push(0.5, y1Up ? 1 : 0);
            y2.push(0.5, y1Up ? 0 : 1);
            y1Up = !y1Up;

            const numLeadingZeroes = size - yStr.length;

            text.push(`${'0'.repeat(numLeadingZeroes)}${yStr}`, '');
            textposition.push('right center', 'center center');
        }
        previousYStr = yStr;
    });

    // Stretch final result to the end of time.
    if (isNaN(previousYStr)) {
        undefinedX.push(endtime);
        y.push(0.5);
    }
    else {
        x1.push(endtime);
        x2.push(endtime);
        y1.push(y1[y1.length - 1]);
        y2.push(y2[y2.length - 1]);
    }

    const common = { mode: 'lines', type: 'scattergl', yaxis: `y${index + 1}` };
    const data = [
        { ...common, line: { color: 'red', width: 1 }, name, x: undefinedX, y: undefinedY },
        { ...common, line: { color: 'lightgreen', width: 1 }, mode: 'lines+text', name, text, textfont: { color: 'black' }, textposition, x: x1, y: y1 },
        { ...common, line: { color: 'lightgreen', width: 1 }, name, x: x2, y: y2 },
    ];

    return data;
}

function makeBinarySignal({ endtime, index, name, tv }) {
    const [ x, y ] = [ [], [] ];
    const [ undefinedX, undefinedY ] = [ [], [] ];
    let previousYStr = tv[0][1];

    tv.forEach(([ xInt, yStr ], signalChangeIndex) => {
        if (isNaN(yStr)) {
            if (!isNaN(previousYStr) && (signalChangeIndex > 0)) {
                const previousYInt = parseInt(previousYStr, 2);
                x.push(xInt);
                y.push(previousYInt);
                undefinedX.push(null, xInt);
                undefinedY.push(null, previousYInt);
            }
            undefinedX.push(xInt);
            undefinedY.push(0.5);
        }
        else {
            if (signalChangeIndex > 0) {
                if (isNaN(previousYStr)) {
                    x.push(null, xInt);
                    y.push(null, 0.5);
                    undefinedX.push(xInt);
                    undefinedY.push(0.5);
                }
                else {
                    x.push(xInt);
                    y.push(parseInt(previousYStr, 2));
                }
            }

            x.push(xInt);
            y.push(parseInt(yStr, 2));
        }
        previousYStr = yStr;
    });

    // Stretch final result to the end of time.
    if (isNaN(previousYStr)) {
        undefinedX.push(endtime);
        y.push(0.5);
    }
    else {
        x.push(endtime);
        y.push(y[y.length - 1]);
    }

    const common = { mode: 'lines', type: 'scattergl', yaxis: `y${index + 1}` };
    const data = [
        { ...common, line: { color: 'red', width: 1 }, name, x: undefinedX, y: undefinedY },
        { ...common, line: { color: 'green', width: 1 }, name, x, y },
    ];

    return data;
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
